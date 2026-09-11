import { Injectable, Logger, Optional } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(@Optional() private prisma?: PrismaService) {
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 465);

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for 587
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, ''), // Strip spaces in 16-char app passwords
        },
      });
      this.fromEmail = process.env.MAIL_FROM || `VerifyFlow <${smtpUser}>`;
      this.logger.log(`📧 Gmail/SMTP Email Transport initialized with user: ${smtpUser}`);
    } else {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        this.resend = new Resend(apiKey);
        this.fromEmail = process.env.MAIL_FROM || 'VerifyFlow <onboarding@resend.dev>';
        this.logger.log('📧 Resend Email Transport initialized.');
      } else {
        this.logger.warn('⚠️ Neither SMTP_USER/SMTP_PASS nor RESEND_API_KEY configured in .env! Real email sending is disabled.');
        this.fromEmail = 'VerifyFlow <noreply@verifyflow.com>';
      }
    }
  }

  private async dispatchEmail(options: { to: string; subject: string; html: string; text?: string }) {
    const { to, subject, html, text } = options;

    // 1. Try Nodemailer / Gmail SMTP if configured
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromEmail,
          to,
          subject,
          html,
          text,
        });
        this.logger.log(`✅ Email successfully sent via SMTP to ${to}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        this.logger.error(`❌ SMTP sending failed to ${to}: ${err.message}`, err.stack);
        return { success: false, error: err.message };
      }
    }

    // 2. Try Resend if configured
    if (this.resend) {
      try {
        const res = await this.resend.emails.send({
          from: this.fromEmail,
          to: [to],
          subject,
          html,
          text,
        });

        if (res.error) {
          this.logger.error(`❌ Resend rejected email to ${to}: ${res.error.message} (${res.error.name})`);
          return { success: false, error: res.error.message };
        }

        this.logger.log(`✅ Email successfully sent via Resend to ${to}. ID: ${res.data?.id}`);
        return { success: true, messageId: res.data?.id };
      } catch (err: any) {
        this.logger.error(`❌ Resend exception sending to ${to}:`, err);
        return { success: false, error: err.message };
      }
    }

    this.logger.warn(`⚠️ No active mail transport. Simulated email to ${to}: "${subject}"`);
    return { success: false, error: 'No email service configured in backend .env' };
  }

  async sendOtpEmail(to: string, otpCode: string, recipientName: string = 'Store Owner') {
    this.logger.log(`Dispatching 6-digit verification code to ${to}...`);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #0f172a; color: #ffffff; border-radius: 12px; font-weight: 800; font-size: 18px;">VF</div>
          <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0; letter-spacing: -0.5px;">VerifyFlow Enterprise OS</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">Verified Device & IMEI Intelligence Ledger</p>
        </div>

        <div style="background-color: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Confirm Your Email Address</h3>
          <p style="color: #475569; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
            Hello <strong>${recipientName}</strong>, enter the 6-digit code below to verify your email and activate your business workspace.
          </p>

          <div style="background-color: #f1f5f9; padding: 18px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0d9488; font-family: monospace; margin: 16px 0; border: 1px dashed #cbd5e1;">
            ${otpCode}
          </div>

          <p style="color: #94a3b8; font-size: 11px; margin-top: 20px;">
            This code will expire in <strong>10 minutes</strong>. If you did not request this email, please ignore it.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px;">
          © ${new Date().getFullYear()} VerifyFlow Enterprise Inc. All rights reserved.
        </div>
      </div>
    `;

    return this.dispatchEmail({
      to,
      subject: `[VerifyFlow] Your Verification Code: ${otpCode}`,
      html,
      text: `Your VerifyFlow verification code is ${otpCode}. It will expire in 10 minutes.`,
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, recipientName: string = 'User') {
    this.logger.log(`Preparing password reset link for ${to}...`);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #0f172a; color: #ffffff; border-radius: 12px; font-weight: 800; font-size: 18px;">VF</div>
          <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0;">VerifyFlow</h2>
        </div>

        <div style="background-color: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center;">
          <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Password Reset Request</h3>
          <p style="color: #475569; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
            Hello <strong>${recipientName}</strong>, we received a request to reset your password. Click the button below to choose a new password:
          </p>

          <a href="${resetUrl}" style="display: inline-block; padding: 12px 28px; background-color: #0d9488; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; box-shadow: 0 2px 4px rgba(13,148,136,0.2);">
            Reset Password →
          </a>

          <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; word-break: break-all;">
            Or copy and paste this URL into your browser:<br/>
            <a href="${resetUrl}" style="color: #0d9488;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `;

    return this.dispatchEmail({
      to,
      subject: `[VerifyFlow] Reset Your Password`,
      html,
      text: `Click the link below to reset your password:\n${resetUrl}`,
    });
  }

  async sendWelcomeEmail(
    to: string,
    recipientName: string,
    businessName: string,
    planName: string = 'Starter Trial',
    customTemplateOverrides?: {
      subject?: string;
      heading?: string;
      subheading?: string;
      body?: string;
      ctaText?: string;
    },
  ) {
    this.logger.log(`Preparing welcome email for ${to} (${recipientName}, ${businessName})...`);

    let enabled = true;
    let subject = 'Welcome to VerifyFlow - Your {{businessName}} Store is Ready! 🚀';
    let heading = 'Welcome to VerifyFlow!';
    let subheading = 'Your Verified Phone Inventory & Retail OS is Live';
    let bodyText =
      'Congratulations! Your store workspace "{{businessName}}" has been successfully created. You now have full access to our high-speed IMEI ledger, express POS checkout, and fraud prevention suite.';
    let ctaText = 'Go to Your Store Dashboard →';

    if (this.prisma) {
      try {
        const settings = await this.prisma.platformSetting.findMany({
          where: {
            key: {
              in: [
                'welcomeEmailEnabled',
                'welcomeEmailSubject',
                'welcomeEmailHeading',
                'welcomeEmailSubheading',
                'welcomeEmailBody',
                'welcomeEmailCtaText',
              ],
            },
          },
        });
        const map = new Map(settings.map((s) => [s.key, s.value]));
        if (map.has('welcomeEmailEnabled')) {
          enabled = map.get('welcomeEmailEnabled') === 'true';
        }
        if (map.get('welcomeEmailSubject')) subject = map.get('welcomeEmailSubject')!;
        if (map.get('welcomeEmailHeading')) heading = map.get('welcomeEmailHeading')!;
        if (map.get('welcomeEmailSubheading')) subheading = map.get('welcomeEmailSubheading')!;
        if (map.get('welcomeEmailBody')) bodyText = map.get('welcomeEmailBody')!;
        if (map.get('welcomeEmailCtaText')) ctaText = map.get('welcomeEmailCtaText')!;
      } catch (err) {
        this.logger.warn('Could not read welcome email template settings from db, using defaults:', err);
      }
    }

    // Apply manual overrides if test preview
    if (customTemplateOverrides) {
      if (customTemplateOverrides.subject) subject = customTemplateOverrides.subject;
      if (customTemplateOverrides.heading) heading = customTemplateOverrides.heading;
      if (customTemplateOverrides.subheading) subheading = customTemplateOverrides.subheading;
      if (customTemplateOverrides.body) bodyText = customTemplateOverrides.body;
      if (customTemplateOverrides.ctaText) ctaText = customTemplateOverrides.ctaText;
    }

    if (!enabled && !customTemplateOverrides) {
      this.logger.log('Welcome email is disabled in Admin Settings. Skipping dispatch.');
      return { success: true, skipped: true };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://sos-frontend-indol.vercel.app';
    const dashboardUrl = `${frontendUrl}/dashboard`;

    // Helper for variable interpolation
    const interpolate = (text: string) => {
      return (text || '')
        .replace(/{{recipientName}}/g, recipientName || 'Store Owner')
        .replace(/{{businessName}}/g, businessName || 'My Store')
        .replace(/{{email}}/g, to)
        .replace(/{{planName}}/g, planName || 'Starter')
        .replace(/{{dashboardUrl}}/g, dashboardUrl)
        .replace(/{{platformName}}/g, 'VerifyFlow');
    };

    const finalSubject = interpolate(subject);
    const finalHeading = interpolate(heading);
    const finalSubheading = interpolate(subheading);
    const finalBody = interpolate(bodyText);
    const finalCta = interpolate(ctaText);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 20px; background-color: #0f172a; border-radius: 20px; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #0d9488 0%, #2563eb 100%); color: #ffffff; border-radius: 14px; font-weight: 800; font-size: 20px; box-shadow: 0 4px 12px rgba(13,148,136,0.4);">VF</div>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 16px 0 4px 0; letter-spacing: -0.5px;">${finalHeading}</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">${finalSubheading}</p>
        </div>

        <div style="background-color: #1e293b; padding: 32px 24px; border-radius: 18px; border: 1px solid #334155; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
          <h2 style="color: #f8fafc; font-size: 18px; font-weight: 700; margin-top: 0;">
            Hello ${recipientName || 'Store Owner'} 👋
          </h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px; white-space: pre-line;">
            ${finalBody}
          </p>

          <!-- Store Summary Card -->
          <div style="background-color: #0f172a; padding: 18px; border-radius: 14px; border: 1px solid #334155; margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0d9488; letter-spacing: 1px; margin-bottom: 8px;">Workspace Overview</div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 6px;">
              <span>Store Name:</span> <strong style="color: #f1f5f9;">${businessName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 6px;">
              <span>Plan:</span> <strong style="color: #10b981;">14-Day Full Access Trial</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8;">
              <span>Login Email:</span> <strong style="color: #f1f5f9;">${to}</strong>
            </div>
          </div>

          <!-- Feature Highlights -->
          <h3 style="color: #f1f5f9; font-size: 14px; font-weight: 700; margin-bottom: 12px;">What you can do next:</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">📱</td>
              <td style="padding: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.4;">
                <strong style="color: #ffffff;">Scan & Stock Inventory:</strong> Use your phone camera or barcode scanner to add IMEIs in seconds with automated duplicate protection.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">⚡</td>
              <td style="padding: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.4;">
                <strong style="color: #ffffff;">Express POS Checkout:</strong> Sell phones or accessories, print thermal receipts, or send digital receipts directly to customer inboxes.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">🛡️</td>
              <td style="padding: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.4;">
                <strong style="color: #ffffff;">Public IMEI Verification:</strong> Give buyers confidence with scannable QR verification badges proving device legitimacy.
              </td>
            </tr>
          </table>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #2563eb 100%); color: #ffffff; padding: 14px 36px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(13,148,136,0.4); text-transform: uppercase; letter-spacing: 0.5px;">
              ${finalCta}
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px; line-height: 1.5;">
          Have questions or need help setting up? Reply directly to this email.<br/>
          © ${new Date().getFullYear()} VerifyFlow Enterprise Inc. All rights reserved.
        </div>
      </div>
    `;

    return this.dispatchEmail({
      to,
      subject: finalSubject,
      html,
      text: `${finalHeading}\n\n${finalBody}\n\nAccess your dashboard: ${dashboardUrl}`,
    });
  }
}
