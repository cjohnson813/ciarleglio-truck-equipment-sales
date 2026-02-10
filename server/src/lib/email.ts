import nodemailer from 'nodemailer';

const transporter = process.env.MAIL_HOST
  ? nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth:
        process.env.MAIL_USER && process.env.MAIL_PASS
          ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
          : undefined
    })
  : null;

const FROM = process.env.MAIL_FROM || 'noreply@example.com';
const APP_NAME = process.env.APP_NAME || 'Ciarleglio Truck-Equip';
const BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:8000';

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${BASE_URL}/verify-email.html?token=${encodeURIComponent(token)}`;
  const html = `
    <p>Thanks for signing up for ${APP_NAME}.</p>
    <p>Please verify your email by clicking the link below:</p>
    <p><a href="${link}">${link}</a></p>
    <p>This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
  `;
  const text = `Verify your email: ${link}`;
  if (transporter) {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Verify your email - ${APP_NAME}`,
      text,
      html
    });
  } else {
    console.log('[Email] Verification link (no MAIL_HOST set):', link);
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${BASE_URL}/reset-password.html?token=${encodeURIComponent(token)}`;
  const html = `
    <p>You requested a password reset for ${APP_NAME}.</p>
    <p>Click the link below to set a new password:</p>
    <p><a href="${link}">${link}</a></p>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `;
  const text = `Reset password: ${link}`;
  if (transporter) {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Reset your password - ${APP_NAME}`,
      text,
      html
    });
  } else {
    console.log('[Email] Password reset link (no MAIL_HOST set):', link);
  }
}
