// --- Content from: apps/backend-core/src/email/email.service.ts ---

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  // --- Helper: Generate simple ICS content ---
  private generateIcs(
    summary: string,
    description: string,
    location: string,
    startTime: Date,
    durationMinutes: number,
  ) {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ATS AI//SmartScheduler//EN
BEGIN:VEVENT
UID:${Date.now()}@ats-platform.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
  }

  async sendInterviewInvite(
    to: string,
    name: string,
    jobTitle: string,
    bookingLink: string,
  ) {
    if (!this.transporter) await this.initTransporter();

    const info = await this.transporter.sendMail({
      from: '"ATS AI Recruiter" <ai@ats-platform.com>',
      to: to,
      subject: `Interview Invitation: ${jobTitle}`,
      text: `Hi ${name},\n\nPlease book your interview here: ${bookingLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Good News, ${name}! 🎉</h2>
          <p>We've reviewed your profile for the <strong>${jobTitle}</strong> position.</p>
          <div style="margin: 30px 0;">
            <a href="${bookingLink}" style="background-color: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              📅 Select Interview Time
            </a>
          </div>
        </div>
      `,
    });
    console.log(`📧 Invite Sent: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  }

  // --- NEW METHOD: Confirmation with ICS ---
  async sendConfirmation(
    to: string,
    name: string,
    date: Date,
    link: string = 'Google Meet',
  ) {
    if (!this.transporter) await this.initTransporter();

    const icsContent = this.generateIcs(
      `Interview with ${name}`,
      `Technical interview via ${link}`,
      link,
      date,
      60,
    );

    const info = await this.transporter.sendMail({
      from: '"ATS SmartScheduler" <ai@ats-platform.com>',
      to: to,
      subject: `✅ Interview Confirmed: ${date.toLocaleString()}`,
      text: `Your interview is confirmed for ${date.toLocaleString()}. A calendar invite is attached.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #16a34a;">Interview Confirmed ✅</h2>
          <p>Hi ${name},</p>
          <p>Your interview has been scheduled for: <strong>${date.toLocaleString()}</strong></p>
          <p>Location: ${link}</p>
          <p>A calendar invitation has been attached to this email.</p>
        </div>
      `,
      icalEvent: {
        filename: 'interview.ics',
        method: 'request',
        content: icsContent,
      },
    });

    console.log(`📧 Confirmation Sent: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  }

  // ... (Keep sendJobInvitation unchanged) ...
  async sendJobInvitation(
    to: string,
    name: string,
    jobTitle: string,
    jobId: string,
  ) {
    if (!this.transporter) await this.initTransporter();
    const applyLink = `http://localhost:3000/jobs/${jobId}/apply`;
    const info = await this.transporter.sendMail({
      from: '"ATS AI Sourcing" <talent@ats-platform.com>',
      to: to,
      subject: `Opportunity: ${jobTitle} @ ATS Corp`,
      html: `<a href="${applyLink}">View Job & Apply</a>`,
    });
    console.log(
      `📧 Sourcing Email Sent: ${nodemailer.getTestMessageUrl(info)}`,
    );
    return info;
  }

  // --- NEW METHOD: Send Rejection Email ---
  async sendRejectionEmail(to: string, subject: string, body: string) {
    if (!this.transporter) await this.initTransporter();

    const info = await this.transporter.sendMail({
      from: '"ATS Talent Team" <no-reply@ats-platform.com>',
      to: to,
      subject: subject,
      text: body,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
            ${body.replace(/\n/g, '<br/>')}
        </div>
      `,
    });
    console.log(
      `📧 Rejection Email Sent: ${nodemailer.getTestMessageUrl(info)}`,
    );
    return info;
  }

  async sendOfferEmail(
    to: string,
    subject: string,
    html: string,
    pdfAttachment: Buffer,
  ) {
    if (!this.transporter) await this.initTransporter();

    const info = await this.transporter.sendMail({
      from: '"ATS Talent Team" <congratulations@ats-platform.com>',
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'OfferLetter.pdf',
          content: pdfAttachment,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`📧 Offer Email Sent: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  }
}
