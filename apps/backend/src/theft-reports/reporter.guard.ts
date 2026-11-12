import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface VerifiedReporter {
  email: string;
  name: string;
  source: 'GOOGLE_AUTH' | 'ACCOUNT_AUTH';
}

/**
 * Identifies who is filing or resolving a theft report.
 *
 * Accepts either:
 *  - a reporter token issued by POST /theft-reports/session after Google
 *    verified the person's identity, or
 *  - a normal logged-in account token.
 *
 * The email always comes from the verified token, never from the request body.
 */
@Injectable()
export class ReporterGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers?.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!token) {
      throw new UnauthorizedException('Please sign in with Google to continue.');
    }

    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in with Google again.');
    }

    if (payload?.type === 'reporter' && payload.email) {
      req.reporter = {
        email: String(payload.email).toLowerCase().trim(),
        name: String(payload.name || 'Device Owner'),
        source: 'GOOGLE_AUTH',
      } as VerifiedReporter;
      return true;
    }

    if (!payload?.type && payload?.sub) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { email: true, firstName: true, lastName: true },
      });
      if (user) {
        req.reporter = {
          email: user.email.toLowerCase().trim(),
          name: `${user.firstName} ${user.lastName}`.trim(),
          source: 'ACCOUNT_AUTH',
        } as VerifiedReporter;
        return true;
      }
    }

    throw new UnauthorizedException('Please sign in with Google to continue.');
  }
}
