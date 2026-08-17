import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Plan, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    let slug = dto.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existingBusiness = await this.prisma.business.findUnique({ where: { slug } });
    if (existingBusiness) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const business = await this.prisma.business.create({
      data: {
        name: dto.businessName,
        slug,
        phone: dto.phone,
        plan: dto.plan || Plan.STARTER,
        users: {
          create: {
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: UserRole.OWNER,
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = business.users[0];
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          plan: business.plan,
        },
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { business: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        business: user.business,
      },
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'super-secret-verifyflow-refresh-key-change-in-production',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email address is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      // For security reasons, respond with success message
      return {
        message: 'If an account is associated with this email address, password reset instructions have been sent.',
      };
    }

    // Generate reset token signed with 1h expiry
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      { expiresIn: '1h' }
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Log reset token and return preview message for dev environment
    console.log(`[AUTH] Password Reset Link generated for ${user.email}: ${resetUrl}`);

    return {
      message: 'If an account is associated with this email address, password reset instructions have been sent.',
      resetUrl, // Provided for local developer testing
      resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Reset token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (payload.type !== 'password_reset' || !payload.sub) {
      throw new BadRequestException('Invalid reset token structure');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Your password has been reset successfully. You may now log in.',
    };
  }
}
