import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { requireEnv } from '../common/config/env';
import { StaffAccessService } from '../common/staff/staff-access.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private staff: StaffAccessService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireEnv('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; type?: string }) {
    // Only plain access tokens may log in. Password-reset and theft-reporter
    // tokens are signed with the same key but carry a `type` and are rejected here.
    if (payload.type || !payload.sub) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        business: true,
        branch: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Staff switched off by the owner, or not covered by the store's plan, stop here.
    await this.staff.assertCanWork(user);

    const { password, ...result } = user;
    return result;
  }
}
