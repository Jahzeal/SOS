import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type DocumentKind = 'INVOICE' | 'RECEIPT' | 'REPAIR' | 'QUOTE';

/**
 * Hands out the next running number for a store's documents.
 *
 * Numbers are sequential per store and allocated atomically in the database,
 * so two sales made at the same moment can never receive the same number.
 * New numbers are 7 digits wide; the older random numbers were 4-6 digits, so
 * the two can never clash.
 */
@Injectable()
export class DocumentNumberService {
  private readonly logger = new Logger(DocumentNumberService.name);

  constructor(private readonly prisma: PrismaService) {}

  async next(businessId: string, kind: DocumentKind): Promise<string> {
    const year = new Date().getFullYear();
    const counterKind = kind === 'QUOTE' ? `QUOTE-${year}` : kind;

    try {
      // Quotes used to be numbered "count + 1", so start a new counter after the
      // quotes that already exist to avoid reusing a number.
      let startAt = 1;
      if (kind === 'QUOTE') {
        const existing = await this.prisma.quote.count({
          where: { businessId, quoteNumber: { startsWith: `QT-${year}-` } },
        });
        startAt = existing + 1;
      }

      const rows = await this.prisma.$queryRaw<Array<{ value: number }>>`
        INSERT INTO "DocumentCounter" ("businessId", "kind", "value")
        VALUES (${businessId}, ${counterKind}, ${startAt})
        ON CONFLICT ("businessId", "kind") DO UPDATE SET "value" = "DocumentCounter"."value" + 1
        RETURNING "value"
      `;
      return this.format(kind, Number(rows[0].value), year);
    } catch (err: any) {
      // Never block a sale because numbering is unavailable; fall back to a
      // number that is unique by construction and say so loudly in the logs.
      this.logger.error(`Document counter unavailable for ${kind}: ${err?.message || err}`);
      const stamp = Date.now().toString(36).toUpperCase();
      const rand = randomBytes(2).toString('hex').toUpperCase();
      return `${this.prefix(kind)}-X${stamp}${rand}`;
    }
  }

  private prefix(kind: DocumentKind): string {
    switch (kind) {
      case 'INVOICE':
        return 'NG-INV';
      case 'RECEIPT':
        return 'NG-REC';
      case 'REPAIR':
        return 'REP';
      case 'QUOTE':
        return `QT-${new Date().getFullYear()}`;
    }
  }

  private format(kind: DocumentKind, value: number, year: number): string {
    if (kind === 'QUOTE') {
      return `QT-${year}-${String(value).padStart(4, '0')}`;
    }
    return `${this.prefix(kind)}-${String(value).padStart(7, '0')}`;
  }
}
