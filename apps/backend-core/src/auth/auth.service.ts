import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { google } from 'googleapis';
import { EmailService } from '../email/email.service';
import { CandidatesService } from '../candidates/candidates.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private candidatesService: CandidatesService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.passwordHash);

    if (user && isMatch) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  // --- Google OAuth ---

  getGoogleAuthUrl(userId: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar', // Full access to Calendar
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline', // Crucial: Prompts for refresh_token
      scope: scopes,
      prompt: 'consent', // Force consent to ensure refresh_token is returned
      state: userId, // Pass userId as state to retrieve it in callback
    });
  }

  async handleGoogleCallback(code: string, userId: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens to user
    await this.usersService.update(userId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token, // Only returned on first consent or forced prompt
      googleTokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      googleCalendarId: 'primary'
    });

    return { message: 'Google Calendar Connected', tokens };
  }

  // --- Magic Link ---

  async sendMagicLink(email: string) {
    // 1. Check if it's a User
    const user = await this.usersService.findByEmail(email);
    let role = 'candidate';
    let id = '';

    if (user) {
      role = 'user'; // Or specific role
      id = user.id;
    } else {
      // 2. Check if it's a Candidate
      const candidate = await this.candidatesService.findByEmail(email);
      if (candidate) {
        id = candidate.id;
      } else {
        throw new UnauthorizedException('No account found with this email.');
      }
    }

    // 3. Generate Token
    const payload = { sub: id, email, role, type: 'magic-link' };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    // 4. Send Email
    // The link should point to the Frontend Verify Page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/portal/login/verify?token=${token}`;

    await this.emailService.sendMagicLink(email, link);

    return { message: 'Magic link sent' };
  }

  async verifyMagicLink(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'magic-link') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Issue real session token (long lived)
      const sessionPayload = { sub: payload.sub, email: payload.email, role: payload.role };

      let userProfile: any = null;
      if (payload.role === 'candidate') {
        const c = await this.candidatesService.findByEmail(payload.email);
        if (c) {
          userProfile = { id: c.id, fullName: `${c.firstName} ${c.lastName}`, role: 'CANDIDATE' };
        }
      } else {
        const u = await this.usersService.findByEmail(payload.email);
        if (u) {
          userProfile = { id: u.id, fullName: u.fullName, role: u.role };
        }
      }

      if (!userProfile) {
        throw new UnauthorizedException('User not found');
      }

      return {
        access_token: this.jwtService.sign(sessionPayload),
        user: userProfile
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
