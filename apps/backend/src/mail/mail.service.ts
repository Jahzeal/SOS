import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn('⚠️ RESEND_API_KEY is not defined in .env! Emails will fail to send until configured.');
    }
    this.resend = new Resend(apiKey || '');
    this.fromEmail = process.env.MAIL_FROM || 'VerifyFlow <onboarding@resend.dev>';
  }

  async sendOtpEmail(to: string, otpCode: string, recipientName: string = 'Store Owner') {
    try {
      this.logger.log(`Sending 6-digit OTP ${otpCode} to ${to}...`);

      const res = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: `[VerifyFlow] Your Verification Code: ${otpCode}`,
        html: `
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
        `,
      });

      this.logger.log(`OTP email successfully dispatched via Resend to ${to}. ID: ${res.data?.id}`);
      return { success: true, messageId: res.data?.id };
    } catch (err: any) {
      this.logger.error(`Failed to send OTP email via Resend to ${to}:`, err);
      return { success: false, error: err.message };
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, recipientName: string = 'User') {
    try {
      this.logger.log(`Sending password reset link to ${to}...`);

      const res = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: `[VerifyFlow] Reset Your Password`,
        html: `
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
        `,
      });

      this.logger.log(`Password reset email dispatched via Resend to ${to}. ID: ${res.data?.id}`);
      return { success: true, messageId: res.data?.id };
    } catch (err: any) {
      this.logger.error(`Failed to send password reset email via Resend to ${to}:`, err);
      return { success: false, error: err.message };
    }
  }
}
