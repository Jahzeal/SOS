import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  // In-memory OTP cache (or database model)
  private otpCache = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private async verifyGoogleCredential(credential: string): Promise<{
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    sub?: string;
  }> {
    const rawExpected = process.env.GOOGLE_CLIENT_ID || '380893447009-j1qb7s0ub6k7t4529s3fhemlakj5c92c.apps.googleusercontent.com';
    const cleanExpected = rawExpected.replace(/['"\s]/g, '').trim();

    const isAudienceValid = (aud: any, azp?: any): boolean => {
      if (!cleanExpected) return true;
      const audStr = String(aud || '').replace(/['"\s]/g, '').trim();
      const azpStr = String(azp || '').replace(/['"\s]/g, '').trim();

      return (
        audStr === cleanExpected ||
        azpStr === cleanExpected ||
        audStr.startsWith('380893447009-j1qb7s0ub6k7t4529s3fhemlakj5c92c') ||
        azpStr.startsWith('380893447009-j1qb7s0ub6k7t4529s3fhemlakj5c92c')
      );
    };

    // 1. Attempt verifying with Google's tokeninfo API
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (res.ok) {
        const data = await res.json();
        
        // Security check: Validate audience
        if (!isAudienceValid(data.aud, data.azp)) {
          console.error(`Google token audience mismatch. Received aud="${data.aud}", azp="${data.azp}", expected="${cleanExpected}"`);
          throw new BadRequestException('Google token audience mismatch. Unauthorized application.');
        }

        if (data.email) {
          return {
            email: data.email.toLowerCase().trim(),
            firstName: data.given_name || (data.name ? data.name.split(' ')[0] : 'Store'),
            lastName: data.family_name || (data.name ? data.name.split(' ').slice(1).join(' ') : 'Owner'),
            picture: data.picture,
            sub: data.sub,
          };
        }
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      console.warn('Google tokeninfo API lookup failed, trying fallback decode:', err);
    }

    // 2. Fallback: Parse standard JWT payload if base64 encoded
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);

        if (!isAudienceValid(payload.aud, payload.azp)) {
          throw new BadRequestException('Google token audience mismatch.');
        }

        if (payload.email) {
          return {
            email: payload.email.toLowerCase().trim(),
            firstName: payload.given_name || (payload.name ? payload.name.split(' ')[0] : 'Store'),
            lastName: payload.family_name || (payload.name ? payload.name.split(' ').slice(1).join(' ') : 'Owner'),
            picture: payload.picture,
            sub: payload.sub,
          };
        }
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      console.warn('Failed to parse JWT payload:', err);
    }

    throw new BadRequestException('Invalid or expired Google authentication credential');
  }

  async googleAuth(dto: GoogleAuthDto) {
    if (!dto.credential) {
      throw new BadRequestException('Google credential token is required');
    }

    const googleProfile = await this.verifyGoogleCredential(dto.credential);
    const email = (dto.email || googleProfile.email).toLowerCase();
    const firstName = dto.firstName || googleProfile.firstName || 'Store';
    const lastName = dto.lastName || googleProfile.lastName || 'Owner';

    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      // Create new user and business workspace
      const storeName = dto.businessName?.trim() || `${firstName}'s Store`;
      let slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const existingBusiness = await this.prisma.business.findUnique({ where: { slug } });
      if (existingBusiness) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const randomPassword = Math.random().toString(36).slice(-12) + '!A1';
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const business = await this.prisma.business.create({
        data: {
          name: storeName,
          slug,
          phone: dto.phone,
          plan: (dto.plan || 'STARTER').toUpperCase(),
          subscriptionStatus: 'TRIAL',
          trialEndsAt,
          users: {
            create: {
              email,
              password: hashedPassword,
              firstName,
              lastName,
              role: UserRole.BUSINESS,
            },
          },
        },
        include: {
          users: true,
        },
      });

      const createdUser = business.users[0];
      const tokens = await this.generateTokens(createdUser.id, createdUser.email);

      // Asynchronously send welcome email
      this.mailService
        .sendWelcomeEmail(createdUser.email, createdUser.firstName || 'Store Owner', business.name, business.plan)
        .catch((err) => console.error('Failed to send welcome email for Google user:', err));

      return {
        user: {
          id: createdUser.id,
          email: createdUser.email,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          role: createdUser.role,
          business: {
            id: business.id,
            name: business.name,
            slug: business.slug,
            plan: business.plan,
          },
        },
        isNewUser: true,
        ...tokens,
      };
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
      isNewUser: false,
      ...tokens,
    };
  }

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

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const business = await this.prisma.business.create({
      data: {
        name: dto.businessName,
        slug,
        phone: dto.phone,
        plan: (dto.plan || 'STARTER').toUpperCase(),
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
        users: {
          create: {
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: UserRole.BUSINESS,
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = business.users[0];
    const tokens = await this.generateTokens(user.id, user.email);

    // Send Welcome Email asynchronously in background
    this.mailService
      .sendWelcomeEmail(user.email, user.firstName || 'Store Owner', business.name, business.plan)
      .catch((err) => console.error('Failed to send welcome email:', err));

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

    // Dispatch real email via Resend
    await this.mailService.sendPasswordResetEmail(user.email, resetUrl, user.firstName);

    return {
      message: 'If an account is associated with this email address, password reset instructions have been sent.',
      resetUrl, // Provided for developer preview
      resetToken,
    };
  }

  async sendOtp(email: string, fullName: string = 'Store Owner') {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email address is required');
    }

    const cleanEmail = email.trim().toLowerCase();
    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.otpCache.set(cleanEmail, { code, expiresAt });

    // Send email via Resend
    const res = await this.mailService.sendOtpEmail(cleanEmail, code, fullName);

    return {
      success: true,
      message: `6-digit verification code sent to ${cleanEmail}`,
    };
  }

  async verifyOtp(email: string, code: string) {
    if (!email || !code) {
      throw new BadRequestException('Email and verification code are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const cached = this.otpCache.get(cleanEmail);
    if (!cached) {
      throw new BadRequestException('Verification code has expired or was not requested. Please request a new code.');
    }

    if (Date.now() > cached.expiresAt) {
      this.otpCache.delete(cleanEmail);
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    if (cached.code !== cleanCode) {
      throw new BadRequestException('Invalid 6-digit verification code. Please check your email and try again.');
    }

    // OTP Verified successfully
    this.otpCache.delete(cleanEmail);
    return { success: true, verified: true };
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

