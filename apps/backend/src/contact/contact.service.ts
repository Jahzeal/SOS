import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { RateLimitService } from '../common/services/rate-limit.service';
import { ContactMessageDto } from './contact.dto';

const TOPIC_LABELS: Record<string, string> = {
  general: 'General question',
  sales: 'Plans and pricing',
  support: 'Help with my account',
  billing: 'Billing and payments',
  'stolen-device': 'Stolen or lost device',
  partnership: 'Partnership',
};

/**
 * Sends Contact Us form messages to the NoxGuarda team by email.
 *
 * Inbox: the CONTACT_INBOX_EMAIL server setting, otherwise the "alert email"
 * saved in Admin → Settings. Nothing typed by the sender is ever placed into the
 * email as HTML; every value is shown as plain text.
 */
@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly rateLimit: RateLimitService,
  ) {}

  private async inbox(): Promise<string | null> {
    const fromEnv = String(process.env.CONTACT_INBOX_EMAIL || '').trim();
    if (fromEnv) return fromEnv;
    const saved = await this.prisma.platformSetting
      .findUnique({ where: { key: 'alertEmail' } })
      .catch(() => null);
    return saved?.value?.trim() || null;
  }

  async send(dto: ContactMessageDto) {
    // Bots fill the hidden field. Pretend it worked so they learn nothing.
    if (dto.website && dto.website.trim()) {
      return { success: true };
    }

    const email = dto.email.trim().toLowerCase();
    await this.rateLimit.hit(`contact:email:${email}`, 3, 60 * 60);

    const to = await this.inbox();
    if (!to) {
      this.logger.error('Contact form: no inbox set (CONTACT_INBOX_EMAIL or Admin alert email).');
      throw new ServiceUnavailableException(
        'We could not send your message right now. Please try again later.',
      );
    }

    const topic = TOPIC_LABELS[dto.topic] || 'General question';
    const name = dto.name.trim();
    const rows: [string, string][] = [
      ['Name', name],
      ['Email', email],
      ['Phone', dto.phone?.trim() || 'Not given'],
      ['Store', dto.storeName?.trim() || 'Not given'],
      ['Topic', topic],
    ];

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 4px 0; font-size: 18px;">New message from the NoxGuarda website</h2>
        <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px;">Reply to the sender at the email address below.</p>
        <table style="border-collapse: collapse; width: 100%; font-size: 13px; margin-bottom: 16px;">
          ${rows
            .map(
              ([label, value]) =>
                `<tr><td style="padding: 6px 12px 6px 0; color: #64748b; width: 90px; vertical-align: top;">${label}</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(value)}</td></tr>`,
            )
            .join('')}
        </table>
        <div style="padding: 14px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(dto.message.trim())}</div>
      </div>
    `;

    const text = `${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}\n\n${dto.message.trim()}`;

    // The subject is plain text; line breaks are removed so nothing can be added to the email headers.
    const subject = `[NoxGuarda contact] ${topic} from ${name}`.replace(/[\r\n]+/g, ' ').slice(0, 180);

    const result = await this.mail.dispatchEmail({ to, subject, html, text });
    if (!result?.success) {
      this.logger.error(`Contact form email failed: ${result?.error || 'unknown error'}`);
      throw new ServiceUnavailableException(
        'We could not send your message right now. Please try again later.',
      );
    }

    return { success: true };
  }
}
