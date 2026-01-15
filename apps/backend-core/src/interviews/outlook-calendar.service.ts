import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { User, Interview } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import 'isomorphic-fetch';

@Injectable()
export class OutlookCalendarService {
    private readonly logger = new Logger(OutlookCalendarService.name);

    constructor(private prisma: PrismaService) { }

    private getClient(accessToken: string): Client {
        return Client.init({
            authProvider: (done) => {
                done(null, accessToken);
            },
        });
    }

    async getBusyPeriods(user: User, start: Date, end: Date): Promise<{ start: Date; end: Date }[]> {
        if (!user.outlookAccessToken) return [];

        try {
            const client = this.getClient(user.outlookAccessToken);
            // Outlook Graph API for getSchedule
            // https://graph.microsoft.com/v1.0/me/calendar/getSchedule
            const response = await client.api('/me/calendar/getSchedule').post({
                schedules: [user.email],
                startTime: {
                    dateTime: start.toISOString(),
                    timeZone: 'UTC',
                },
                endTime: {
                    dateTime: end.toISOString(),
                    timeZone: 'UTC',
                },
                availabilityViewInterval: 60,
            });

            const schedule = response.value?.[0]?.scheduleItems;
            if (!schedule) return [];

            return schedule.map((item: any) => ({
                start: new Date(item.start.dateTime + 'Z'), // Outlook returns without Z usually if simplified, but let's assume UTC from request
                end: new Date(item.end.dateTime + 'Z'),
            }));
        } catch (error) {
            this.logger.error(`Failed to fetch Outlook availability for user ${user.id}`, error);
            return [];
        }
    }

    async createEvent(user: User, interview: Interview & { application: { candidate: { firstName: string | null; lastName: string | null; email: string }; job: { title: string } } }) {
        if (!user.outlookAccessToken || !interview.scheduledAt) return null;

        try {
            const client = this.getClient(user.outlookAccessToken);

            const startTime = new Date(interview.scheduledAt);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

            const candidateName = `${interview.application.candidate.firstName || ''} ${interview.application.candidate.lastName || ''}`.trim() || 'Candidate';

            const event = {
                subject: `Interview: ${candidateName} - ${interview.application.job.title}`,
                body: {
                    contentType: 'HTML',
                    content: `Interview for ${interview.application.job.title} position.<br>Candidate: ${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
                },
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: 'UTC'
                },
                attendees: [
                    {
                        emailAddress: {
                            address: interview.application.candidate.email,
                            name: `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
                        },
                        type: 'required',
                    },
                ],
            };

            const result = await client.api('/me/events').post(event);
            return result.id;
        } catch (error) {
            this.logger.error(`Failed to create Outlook event for user ${user.id}`, error);
            return null;
        }
    }

    async updateEvent(user: User, eventId: string, interview: Interview & { application: { candidate: { firstName: string | null; lastName: string | null; email: string }; job: { title: string } } }) {
        if (!user.outlookAccessToken || !interview.scheduledAt) return;

        try {
            const client = this.getClient(user.outlookAccessToken);
            const startTime = new Date(interview.scheduledAt);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

            const event = {
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: 'UTC'
                }
            };

            await client.api(`/me/events/${eventId}`).patch(event);
        } catch (error) {
            this.logger.error(`Failed to update Outlook event ${eventId}`, error);
        }
    }

    async deleteEvent(user: User, eventId: string) {
        if (!user.outlookAccessToken) return;
        try {
            const client = this.getClient(user.outlookAccessToken);
            await client.api(`/me/events/${eventId}`).delete();
        } catch (error) {
            this.logger.error(`Failed to delete Outlook event ${eventId}`, error);
        }
    }
}
