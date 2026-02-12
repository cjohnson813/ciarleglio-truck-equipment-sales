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

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'joey@ciarlegliotruckandequipmentsales.com';

export interface ContactPayload {
  name: string;
  phone: string;
  email: string;
  business?: string;
  message: string;
}

export async function sendContactEmail(payload: ContactPayload): Promise<void> {
  const { name, phone, email, business, message } = payload;
  const html = `
    <h2>Contact form submission – ${APP_NAME}</h2>
    <table style="border-collapse: collapse; max-width: 560px;">
      <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(phone)}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(email)}</td></tr>
      ${business ? `<tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Business</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(business)}</td></tr>` : ''}
      <tr><td style="padding: 8px 12px; border: 1px solid #ddd; vertical-align: top;"><strong>Message</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd; white-space: pre-wrap;">${escapeHtml(message)}</td></tr>
    </table>
    <p style="margin-top: 16px; color: #666; font-size: 12px;">Sent via website contact form.</p>
  `;
  const text = `Contact form\nName: ${name}\nPhone: ${phone}\nEmail: ${email}${business ? `\nBusiness: ${business}` : ''}\n\nMessage:\n${message}`;
  if (transporter) {
    await transporter.sendMail({
      from: FROM,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Contact form: ${name} – ${APP_NAME}`,
      text,
      html
    });
  } else {
    console.log('[Email] Contact form (no MAIL_HOST set):', { name, email, message: message.slice(0, 80) + '...' });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
