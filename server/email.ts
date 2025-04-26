import { config } from 'dotenv';
import nodemailer from 'nodemailer';

config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, code: string) {
  const verificationLink = `${process.env.FRONTEND_URL}/verify?email=${encodeURIComponent(email)}&code=${code}`;
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify your email - Assignment Kore Dibo",
    html: `
      <h1>Email Verification</h1>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p><a href="${verificationLink}">Click here to verify your email</a></p>
      <p>This link will remain active until used or it expires in 30 minutes.</p>
    `,
  });
}
