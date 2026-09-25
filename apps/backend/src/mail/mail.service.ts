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
      this.fromEmail = process.env.MAIL_FROM || `NoxGuarda <${smtpUser}>`;
      this.logger.log(`Gmail/SMTP Email Transport initialized with user: ${smtpUser}`);
    } else {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        this.resend = new Resend(apiKey);
        this.fromEmail = process.env.MAIL_FROM || 'NoxGuarda <onboarding@resend.dev>';
        this.logger.log('Resend Email Transport initialized.');
      } else {
        this.logger.warn('Neither SMTP_USER/SMTP_PASS nor RESEND_API_KEY configured in .env! Real email sending is disabled.');
        this.fromEmail = 'NoxGuarda <noreply@noxguarda.com>';
      }
    }
  }

  public async dispatchEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
  }) {
    const { to, subject, html, text, attachments } = options;

    // 1. Try Nodemailer / Gmail SMTP if configured
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromEmail,
          to,
          subject,
          html,
          text,
          attachments: attachments?.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          })),
        });
        this.logger.log(`Email successfully sent via SMTP to ${to} (Attachments: ${attachments?.length || 0}). MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        this.logger.error(`SMTP sending failed to ${to}: ${err.message}`, err.stack);
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
          attachments: attachments?.map((att) => ({
            filename: att.filename,
            content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content),
          })),
        });

        if (res.error) {
          this.logger.error(`Resend rejected email to ${to}: ${res.error.message} (${res.error.name})`);
          return { success: false, error: res.error.message };
        }

        this.logger.log(`Email successfully sent via Resend to ${to}. ID: ${res.data?.id}`);
        return { success: true, messageId: res.data?.id };
      } catch (err: any) {
        this.logger.error(`Resend exception sending to ${to}:`, err);
        return { success: false, error: err.message };
      }
    }

    this.logger.warn(`No active mail transport. Simulated email to ${to}: "${subject}"`);
    return { success: false, error: 'No email service configured in backend .env' };
  }

  async sendOtpEmail(to: string, otpCode: string, recipientName: string = 'Store Owner') {
    this.logger.log(`Dispatching 6-digit verification code to ${to}...`);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #121417; color: #ffffff; border-radius: 12px; font-weight: 800; font-size: 16px; letter-spacing: 1px;">NG</div>
          <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0; letter-spacing: -0.5px;">NOXGUARDA Enterprise OS</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">Verified Device & IMEI Intelligence Ledger</p>
        </div>

        <div style="background-color: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Confirm Your Email Address</h3>
          <p style="color: #475569; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
            Hello <strong>${recipientName}</strong>, enter the 6-digit code below to verify your email and activate your business workspace.
          </p>

          <div style="background-color: #f1f5f9; padding: 18px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2E6F5E; font-family: monospace; margin: 16px 0; border: 1px dashed #cbd5e1;">
            ${otpCode}
          </div>

          <p style="color: #94a3b8; font-size: 11px; margin-top: 20px;">
            This code will expire in <strong>10 minutes</strong>. If you did not request this email, please ignore it.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px;">
          © ${new Date().getFullYear()} NoxGuarda Enterprise Inc. All rights reserved.
        </div>
      </div>
    `;

    return this.dispatchEmail({
      to,
      subject: `[NoxGuarda] Your Verification Code: ${otpCode}`,
      html,
      text: `Your NoxGuarda verification code is ${otpCode}. It will expire in 10 minutes.`,
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, recipientName: string = 'User') {
    this.logger.log(`Preparing password reset link for ${to}...`);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #121417; color: #ffffff; border-radius: 12px; font-weight: 800; font-size: 16px; letter-spacing: 1px;">NG</div>
          <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0;">NoxGuarda</h2>
        </div>

        <div style="background-color: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center;">
          <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Password Reset Request</h3>
          <p style="color: #475569; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
            Hello <strong>${recipientName}</strong>, we received a request to reset your password. Click the button below to choose a new password:
          </p>

          <a href="${resetUrl}" style="display: inline-block; padding: 12px 28px; background-color: #2E6F5E; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; box-shadow: 0 2px 4px rgba(46,111,94,0.2);">
            Reset Password →
          </a>

          <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; word-break: break-all;">
            Or copy and paste this URL into your browser:<br/>
            <a href="${resetUrl}" style="color: #2E6F5E;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `;

    return this.dispatchEmail({
      to,
      subject: `[NoxGuarda] Reset Your Password`,
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
    let subject = 'Welcome to NoxGuarda - Your {{businessName}} Store is Ready! ';
    let heading = 'Welcome to NoxGuarda!';
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
        .replace(/{{platformName}}/g, 'NoxGuarda');
    };

    const finalSubject = interpolate(subject);
    const finalHeading = interpolate(heading);
    const finalSubheading = interpolate(subheading);
    const finalBody = interpolate(bodyText);
    const finalCta = interpolate(ctaText);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 20px; background-color: #121417; border-radius: 20px; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #2E6F5E 0%, #1e293b 100%); color: #ffffff; border-radius: 14px; font-weight: 800; font-size: 18px; box-shadow: 0 4px 12px rgba(46,111,94,0.4); letter-spacing: 1px;">NG</div>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 16px 0 4px 0; letter-spacing: -0.5px;">${finalHeading}</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">${finalSubheading}</p>
        </div>

        <div style="background-color: #1a1d24; padding: 32px 24px; border-radius: 18px; border: 1px solid #2a2f3a; box-shadow: 0 8px 16px rgba(0,0,0,0.3);">
          <h2 style="color: #f8fafc; font-size: 18px; font-weight: 700; margin-top: 0;">
            Hello ${recipientName || 'Store Owner'} 
          </h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px; white-space: pre-line;">
            ${finalBody}
          </p>

          <!-- Store Summary Card -->
          <div style="background-color: #121417; padding: 18px; border-radius: 14px; border: 1px solid #2a2f3a; margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #52a38c; letter-spacing: 1px; margin-bottom: 8px;">Workspace Overview</div>
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
              <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">•</td>
              <td style="padding: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.4;">
                <strong style="color: #ffffff;">Scan & Stock Inventory:</strong> Use your phone camera or barcode scanner to add IMEIs in seconds with automated duplicate protection.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">•</td>
              <td style="padding: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.4;">
                <strong style="color: #ffffff;">Express POS Checkout:</strong> Sell phones or accessories, print thermal receipts, or send digital receipts directly to customer inboxes.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 28px; font-size: 16px;">•</td>
              <td style="padding: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.4;">
                <strong style="color: #ffffff;">Public IMEI Verification:</strong> Give buyers confidence with scannable QR verification badges proving device legitimacy.
              </td>
            </tr>
          </table>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #2E6F5E 0%, #1e293b 100%); color: #ffffff; padding: 14px 36px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(46,111,94,0.4); text-transform: uppercase; letter-spacing: 0.5px;">
              ${finalCta}
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px; line-height: 1.5;">
          Have questions or need help setting up? Reply directly to this email.<br/>
          © ${new Date().getFullYear()} NoxGuarda Enterprise Inc. All rights reserved.
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

  public async sendQuoteEmail(options: {
    to: string;
    customerName?: string;
    storeName: string;
    quoteNumber: string;
    quoteTitle?: string;
    totalAmount: number;
    expiryDateStr?: string;
    pdfBuffer: Buffer;
  }) {
    const {
      to,
      customerName,
      storeName,
      quoteNumber,
      quoteTitle = 'Price Quotation',
      totalAmount,
      expiryDateStr,
      pdfBuffer,
    } = options;

    const subject = `${quoteTitle} ${quoteNumber} from ${storeName}`;
    const formattedAmount = `NGN ${totalAmount.toLocaleString()}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background-color: #0f172a; border-radius: 16px; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 8px 18px; background-color: #2563eb; color: #ffffff; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: 0.5px;">${storeName.toUpperCase()}</div>
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 16px 0 4px 0;">${quoteTitle} #${quoteNumber}</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">Official Commercial Proposal</p>
        </div>

        <div style="background-color: #1e293b; padding: 28px 24px; border-radius: 14px; border: 1px solid #334155;">
          <p style="color: #f1f5f9; font-size: 14px; line-height: 1.6; margin-top: 0;">
            Hello <strong>${customerName || 'Valued Client'}</strong>,
          </p>
          <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.6;">
            Thank you for your interest. Please find attached your formal <strong>${quoteTitle} (#${quoteNumber})</strong> from <strong>${storeName}</strong>.
          </p>

          <!-- Quote Breakdown Box -->
          <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">
              <span>Quotation Number:</span>
              <strong style="color: #f8fafc;">${quoteNumber}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">
              <span>Estimated Total:</span>
              <strong style="color: #38bdf8; font-size: 16px;">${formattedAmount}</strong>
            </div>
            ${
              expiryDateStr
                ? `<div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8;">
                    <span>Valid Until:</span>
                    <strong style="color: #f59e0b;">${expiryDateStr}</strong>
                  </div>`
                : ''
            }
          </div>

          <p style="color: #94a3b8; font-size: 12.5px; line-height: 1.5; margin-bottom: 0;">
            📎 The complete itemized PDF quotation is attached to this email. You can reply directly to this email or contact us via phone/WhatsApp to confirm or proceed with the order.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
          Sent by ${storeName} via NoxGuarda Retail OS.<br/>
          © ${new Date().getFullYear()} ${storeName}. All rights reserved.
        </div>
      </div>
    `;

    return this.dispatchEmail({
      to,
      subject,
      html,
      text: `Hello ${customerName || 'Valued Client'},\n\nPlease find attached your quotation ${quoteNumber} for ${formattedAmount} from ${storeName}.\n\nValid until: ${expiryDateStr || 'As specified on PDF'}.`,
      attachments: [
        {
          filename: `Quotation-${quoteNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  public async sendInstallmentReminderEmail(options: {
    to: string;
    customerName?: string;
    storeName: string;
    docNumber: string;
    docType?: 'Quotation' | 'Invoice' | 'Sale';
    installmentNo?: number;
    totalInstallments?: number;
    amountDue: number;
    balanceDue: number;
    dueDateStr: string;
    isOverdue?: boolean;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  }) {
    const {
      to,
      customerName = 'Valued Client',
      storeName,
      docNumber,
      docType = 'Quotation',
      installmentNo,
      totalInstallments,
      amountDue,
      balanceDue,
      dueDateStr,
      isOverdue = false,
      bankName,
      accountNumber,
      accountName,
    } = options;

    const installmentLabel = installmentNo
      ? `Installment #${installmentNo}${totalInstallments ? ` of ${totalInstallments}` : ''}`
      : 'Payment Reminder';

    const subject = isOverdue
      ? `⚠️ OVERDUE PAYMENT REMINDER: ${installmentLabel} for ${docType} #${docNumber} - ${storeName}`
      : `Payment Reminder: ${installmentLabel} for ${docType} #${docNumber} - ${storeName}`;

    const formattedAmountDue = `NGN ${amountDue.toLocaleString()}`;
    const formattedBalanceDue = `NGN ${balanceDue.toLocaleString()}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background-color: #0f172a; border-radius: 16px; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 8px 18px; background-color: ${isOverdue ? '#ef4444' : '#2E6F5E'}; color: #ffffff; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: 0.5px;">${storeName.toUpperCase()}</div>
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 16px 0 4px 0;">${isOverdue ? 'Overdue Payment Reminder' : 'Installment Due Reminder'}</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">${docType} #${docNumber} • ${installmentLabel}</p>
        </div>

        <div style="background-color: #1e293b; padding: 28px 24px; border-radius: 14px; border: 1px solid #334155;">
          <p style="color: #f1f5f9; font-size: 14px; line-height: 1.6; margin-top: 0;">
            Hello <strong>${customerName}</strong>,
          </p>
          <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.6;">
            This is a friendly reminder regarding your upcoming scheduled installment payment for <strong>${docType} #${docNumber}</strong> with <strong>${storeName}</strong>.
          </p>

          <!-- Due Summary Box -->
          <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid ${isOverdue ? '#ef4444' : '#334155'}; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">
              <span>Payment Stage:</span>
              <strong style="color: #f8fafc;">${installmentLabel}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">
              <span>Amount Due for this Period:</span>
              <strong style="color: ${isOverdue ? '#f87171' : '#38bdf8'}; font-size: 16px;">${formattedAmountDue}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">
              <span>Total Outstanding Balance:</span>
              <strong style="color: #fbbf24;">${formattedBalanceDue}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8;">
              <span>Due Date:</span>
              <strong style="color: ${isOverdue ? '#ef4444' : '#10b981'};">${dueDateStr}</strong>
            </div>
          </div>

          ${
            bankName || accountNumber
              ? `<!-- Bank Transfer Info -->
              <div style="background-color: #121417; padding: 16px; border-radius: 10px; border: 1px solid #334155; margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 700; color: #52a38c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Payment Remittance Details</div>
                ${bankName ? `<div style="font-size: 13px; color: #cbd5e1; margin-bottom: 4px;">Bank: <strong>${bankName}</strong></div>` : ''}
                ${accountNumber ? `<div style="font-size: 13px; color: #cbd5e1; margin-bottom: 4px;">Account Number: <strong style="color: #38bdf8; font-family: monospace;">${accountNumber}</strong></div>` : ''}
                ${accountName ? `<div style="font-size: 13px; color: #cbd5e1;">Account Name: <strong>${accountName}</strong></div>` : ''}
              </div>`
              : ''
          }

          <p style="color: #94a3b8; font-size: 12.5px; line-height: 1.5; margin-bottom: 0;">
            Please contact <strong>${storeName}</strong> after making payment to confirm receipt and update your account records.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
          Sent by ${storeName} via NoxGuarda Retail OS.<br/>
          © ${new Date().getFullYear()} ${storeName}. All rights reserved.
        </div>
      </div>
    `;

    return this.dispatchEmail({
      to,
      subject,
      html,
      text: `Hello ${customerName},\n\nReminder: Your installment payment of ${formattedAmountDue} for ${docType} #${docNumber} is due on ${dueDateStr}. Total outstanding balance: ${formattedBalanceDue}.\n\nThank you, ${storeName}.`,
    });
  }

  public async sendPaymentReceiptEmail(options: {
    to: string;
    customerName?: string;
    storeName: string;
    docNumber: string;
    docType?: string;
    amountPaid: number;
    balanceRemaining: number;
    paymentMethod: string;
    paymentDateStr: string;
    receiptRef?: string;
  }) {
    const {
      to,
      customerName = 'Valued Client',
      storeName,
      docNumber,
      docType = 'Quotation / Order',
      amountPaid,
      balanceRemaining,
      paymentMethod,
      paymentDateStr,
      receiptRef,
    } = options;

    const subject = `Payment Confirmation: ₦${amountPaid.toLocaleString()} received for ${docType} #${docNumber} - ${storeName}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background-color: #0f172a; border-radius: 16px; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 8px 18px; background-color: #10b981; color: #ffffff; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: 0.5px;">${storeName.toUpperCase()}</div>
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 16px 0 4px 0;">Payment Receipt Confirmation</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">${docType} #${docNumber} ${receiptRef ? `• Ref: ${receiptRef}` : ''}</p>
        </div>

        <div style="background-color: #1e293b; padding: 28px 24px; border-radius: 14px; border: 1px solid #334155;">
          <p style="color: #f1f5f9; font-size: 14px; line-height: 1.6; margin-top: 0;">
            Hello <strong>${customerName}</strong>,
          </p>
          <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.6;">
            We have successfully received and recorded your payment of <strong style="color: #10b981;">₦${amountPaid.toLocaleString()}</strong> towards <strong>${docType} #${docNumber}</strong>.
          </p>

          <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">
              <span>Amount Paid:</span>
              <strong style="color: #10b981; font-size: 16px;">₦${amountPaid.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">
              <span>Payment Method:</span>
              <strong style="color: #f8fafc;">${paymentMethod}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">
              <span>Date Received:</span>
              <strong style="color: #f8fafc;">${paymentDateStr}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8;">
              <span>Remaining Balance:</span>
              <strong style="color: ${balanceRemaining > 0 ? '#f59e0b' : '#10b981'}; font-size: 14px;">${balanceRemaining > 0 ? `₦${balanceRemaining.toLocaleString()}` : 'COMPLETELY PAID (₦0)'}</strong>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
          Sent by ${storeName} via NoxGuarda Retail OS.<br/>
          © ${new Date().getFullYear()} ${storeName}. All rights reserved.
        </div>
      </div>
    `;

    return this.dispatchEmail({
      to,
      subject,
      html,
      text: `Hello ${customerName},\n\nPayment of ₦${amountPaid.toLocaleString()} has been received for ${docType} #${docNumber}. Remaining balance: ₦${balanceRemaining.toLocaleString()}.\n\nThank you, ${storeName}.`,
    });
  }
}


