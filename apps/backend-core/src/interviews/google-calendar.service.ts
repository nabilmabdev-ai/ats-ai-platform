import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private oauth2Client;

  constructor(private prisma: PrismaService) {
    // These should be in your .env or ConfigService.
    // Ideally use ConfigService, but for now accessing process.env directly for simplicity as per existing pattern if applicable,
    // or better yet, inject ConfigService. I'll assume standard process.env usage here or empty strings to prevent crash.
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  /**
   * Fetches "busy" periods from the user's Google Calendar.
   * Returns an array of { start: Date, end: Date }.
   */
  async getBusyPeriods(
    user: User,
    timeMin: Date,
    timeMax: Date,
  ): Promise<{ start: Date; end: Date }[]> {
    if (!user.googleAccessToken) {
      return [];
    }

    try {
      this.setCredentials(user);

      // Check if token needs refresh
      if (this.isTokenExpired(user)) {
        await this.refreshAccessToken(user);
        // Credentials updated in refreshAccessToken
      }

      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          timeZone: 'UTC', // We want response effectively in UTC to normalize
          items: [{ id: user.googleCalendarId || 'primary' }],
        },
      });

      const calendars = response.data.calendars;
      const primary =
        calendars && calendars[user.googleCalendarId || 'primary'];

      if (!primary || !primary.busy) {
        return [];
      }

      return primary.busy.map((item) => ({
        start: new Date(item.start!),
        end: new Date(item.end!),
      }));
    } catch (error) {
      this.logger.error(
        `Failed to fetch Google Calendar availability for user ${user.id}`,
        error,
      );
      // In production, we might want to handle re-auth requests if we get 401 even after local refresh check
      return [];
    }
  }

  private setCredentials(user: User) {
    this.oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      // expiry_date is milliseconds for googleapis
      expiry_date: user.googleTokenExpiry
        ? user.googleTokenExpiry.getTime()
        : null,
    });
  }

  private isTokenExpired(user: User): boolean {
    if (!user.googleTokenExpiry) return true;
    // Add a buffer of 5 minutes
    return user.googleTokenExpiry.getTime() < Date.now() + 5 * 60 * 1000;
  }

  private async refreshAccessToken(user: User) {
    if (!user.googleRefreshToken) {
      this.logger.warn(
        `User ${user.id} has expired access token but no refresh token.`,
      );
      return;
    }

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // Update DB
      const newExpiry = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : undefined;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleAccessToken: credentials.access_token,
          // refresh token might not always be returned; if it is, update it
          ...(credentials.refresh_token && {
            googleRefreshToken: credentials.refresh_token,
          }),
          ...(newExpiry && { googleTokenExpiry: newExpiry }),
        },
      });

      this.oauth2Client.setCredentials(credentials);
    } catch (error) {
      this.logger.error(`Failed to refresh token for user ${user.id}`, error);
    }
  }
}
