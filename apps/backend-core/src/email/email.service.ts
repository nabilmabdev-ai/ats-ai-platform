import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    } catch (error) {
      console.warn('⚠️ EmailService: Failed to connect to Ethereal. Falling back to JSON Transport (Offline Mode).');
      this.transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
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
    customMessage?: string,
    replyTo?: string,
    headerUrl?: string,
    footerUrl?: string,
    companyAddress?: string,
  ) {
    if (!this.transporter) await this.initTransporter();

    const customContent = customMessage
      ? `<p style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #3b82f6; font-style: italic;">"${customMessage}"</p>`
      : '';

    const headerHtml = headerUrl
      ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${headerUrl}" alt="Company Header" style="max-width: 600px; width: 100%; height: auto; border-radius: 8px 8px 0 0;" /></div>`
      : '';

    // Footer Image + Legal Address Text
    const footerHtml = `
      ${footerUrl ? `<div style="margin-top: 30px; text-align: center;"><img src="${footerUrl}" alt="Company Footer" style="max-width: 600px; width: 100%; height: auto;" /></div>` : ''}
      ${companyAddress ? `<div style="margin-top: 15px; pt-4; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center;">${companyAddress}</div>` : ''}
    `;

    const info = await this.transporter.sendMail({
      from: '"ATS AI Recruiter" <ai@ats-platform.com>',
      replyTo: replyTo, // Routes replies to the recruiter's real inbox
      to: to,
      subject: `Interview Invitation: ${jobTitle}`,
      text: `Hi ${name},\n\n${customMessage ? customMessage + '\n\n' : ''}Please book your interview here: ${bookingLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 0; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: 0 auto; overflow: hidden;">
            ${headerHtml}
            <div style="padding: 20px;">
              ${customContent}
            <div style="margin: 30px 0;">
              <a href="${bookingLink}" style="background-color: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                📅 Select Interview Time
              </a>
            </div>
            ${footerHtml}
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
    headerUrl?: string,
    footerUrl?: string,
    companyAddress?: string,
  ) {
    if (!this.transporter) await this.initTransporter();

    const icsContent = this.generateIcs(
      `Interview with ${name}`,
      `Technical interview via ${link}`,
      link,
      date,
      60,
    );

    const headerHtml = headerUrl
      ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${headerUrl}" alt="Company Header" style="max-width: 600px; width: 100%; height: auto; border-radius: 8px 8px 0 0;" /></div>`
      : '';

    // Footer Image + Legal Address Text
    const footerHtml = `
      ${footerUrl ? `<div style="margin-top: 30px; text-align: center;"><img src="${footerUrl}" alt="Company Footer" style="max-width: 600px; width: 100%; height: auto;" /></div>` : ''}
      ${companyAddress ? `<div style="margin-top: 15px; pt-4; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center;">${companyAddress}</div>` : ''}
    `;

    const info = await this.transporter.sendMail({
      from: '"ATS SmartScheduler" <ai@ats-platform.com>',
      to: to,
      subject: `✅ Interview Confirmed: ${date.toLocaleString()}`,
      text: `Your interview is confirmed for ${date.toLocaleString()}. A calendar invite is attached.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 0; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: 0 auto; overflow: hidden;">
          ${headerHtml}
          <div style="padding: 20px;">
            <h2 style="color: #16a34a; margin-top: 0;">Interview Confirmed ✅</h2>
            <p>Hi ${name},</p>
            <p>Your interview has been scheduled for: <strong>${date.toLocaleString()}</strong></p>
            <p>Location: ${link}</p>
            <p>A calendar invitation has been attached to this email.</p>
            ${footerHtml}
          </div>
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

  // --- NEW METHOD: Parsing Error Notification ---
  async sendParsingErrorEmail(to: string, name: string, jobTitle: string) {
    if (!this.transporter) await this.initTransporter();

    const info = await this.transporter.sendMail({
      from: '"ATS Support Team" <support@ats-platform.com>',
      to: to,
      subject: `Action Required: Application for ${jobTitle}`,
      text: `Hi ${name},\n\nWe encountered an issue processing your resume file. It appears to be corrupted or in an unsupported format.\n\nPlease re-apply with a standard PDF or DOCX file.\n\nBest regards,\nATS Support`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ffcccb; border-radius: 10px; background-color: #fff5f5;">
          <h2 style="color: #c53030;">Application Issue ⚠️</h2>
          <p>Hi ${name},</p>
          <p>We received your application for <strong>${jobTitle}</strong>, but unfortunately, our system was unable to read your resume file.</p>
          <p>This usually happens if the file is:</p>
          <ul>
            <li>Encrypted/Password protected</li>
            <li>Corrupted</li>
            <li>In an image-only format without text</li>
          </ul>
          <p style="font-weight: bold;">Please apply again with a standard PDF or DOCX file.</p>
          <p><em>Note: Your previous attempt has been cleared to allow you to re-apply immediately.</em></p>
        </div>
      `,
    });
    console.log(
      `📧 Parsing Error Email Sent: ${nodemailer.getTestMessageUrl(info)}`,
    );
    return info;
  }

  async sendMagicLink(to: string, link: string) {
    if (!this.transporter) await this.initTransporter();

    const info = await this.transporter.sendMail({
      from: '"ATS Security" <security@ats-platform.com>',
      to: to,
      subject: 'Log in to ATS Portal',
      text: `Click here to log in: ${link}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2>Log in to ATS Portal</h2>
          <p>Click the button below to sign in. This link expires in 15 minutes.</p>
          <a href="${link}" style="background-color: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0;">
            Magic Sign In 🪄
          </a>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    console.log(`📧 Magic Link Sent: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  }
}
