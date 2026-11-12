import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export function clientIp(req: any): string {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req?.headers?.['x-real-ip'] || req?.ip || req?.socket?.remoteAddress || 'unknown';
}

/**
 * Fixed-window rate limiter stored in Postgres, so the limit holds across
 * serverless instances.
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private lastCleanup = 0;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Counts one hit against `key`. Throws 429 once more than `limit` hits land
   * inside the window.
   */
  async hit(key: string, limit: number, windowSeconds: number): Promise<void> {
    const bucketKey = key.slice(0, 300);
    const windowEndsAt = new Date(Date.now() + windowSeconds * 1000);

    let rows: Array<{ count: number; windowEndsAt: Date }>;
    try {
      rows = await this.prisma.$queryRaw<Array<{ count: number; windowEndsAt: Date }>>`
        INSERT INTO "RateLimitBucket" ("key", "count", "windowEndsAt")
        VALUES (${bucketKey}, 1, ${windowEndsAt})
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE WHEN "RateLimitBucket"."windowEndsAt" <= NOW() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
          "windowEndsAt" = CASE WHEN "RateLimitBucket"."windowEndsAt" <= NOW() THEN ${windowEndsAt} ELSE "RateLimitBucket"."windowEndsAt" END
        RETURNING "count", "windowEndsAt"
      `;
    } catch (err: any) {
      // If the limiter itself is unavailable (e.g. the table has not been created
      // yet), let the request through rather than locking every user out.
      this.logger.error(`Rate limiter unavailable, allowing request: ${err?.message || err}`);
      return;
    }

    this.cleanupOccasionally();

    const row = rows[0];
    if (row && Number(row.count) > limit) {
      const retryAfter = Math.max(1, Math.ceil((new Date(row.windowEndsAt).getTime() - Date.now()) / 1000));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many attempts. Please try again in ${
            retryAfter >= 120 ? `${Math.ceil(retryAfter / 60)} minutes` : `${retryAfter} seconds`
          }.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private cleanupOccasionally() {
    const now = Date.now();
    if (now - this.lastCleanup < 10 * 60 * 1000) return;
    this.lastCleanup = now;
    this.prisma.rateLimitBucket
      .deleteMany({ where: { windowEndsAt: { lt: new Date(now - 60 * 1000) } } })
      .catch(() => {});
  }
}
