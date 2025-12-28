import { EmailService } from './email/email.service';

async function run() {
  const emailService = new EmailService();

  console.log('Testing sendParsingErrorEmail...');
  try {
    const info = await emailService.sendParsingErrorEmail(
      'test@example.com',
      'John Doe',
      'Software Engineer',
    );
    console.log('Email sent successfully!');
    console.log(info);
  } catch (e) {
    console.error('Error sending email:', e);
  }
}

run();
