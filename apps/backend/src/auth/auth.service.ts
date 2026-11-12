import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt, createHash, timingSafeEqual } from 'crypto';
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';
import { frontendUrl } from '../common/config/env';
import { RateLimitService } from '../common/services/rate-limit.service';

// OAuth client IDs are public identifiers (they ship in the frontend), not secrets.
const DEFAULT_GOOGLE_CLIENT_ID = '380893447009-j1qb7s0ub6k7t4529s3fhemlakj5c92c.apps.googleusercontent.com';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private rateLimit: RateLimitService,
  ) {}

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  /** Emails were historically stored as typed, so look them up without regard to case. */
  private findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: this.normalizeEmail(email), mode: 'insensitive' } },
      include: { business: true },
    });
  }

  private hashOtp(email: string, code: string): string {
    return createHash('sha256').update(`${email}:${code}`).digest('hex');
  }

  /**
   * A plan MUST be chosen at signup, and only real, active, publicly offered
   * plans are accepted. There is no trial: every new store starts on the Free
   * plan (free forever, device cap from the FREE plan row). If a paid plan was
   * chosen it is returned as `pendingPlan` so the app can open checkout; the
   * paid plan only becomes active in PaymentsService.applySuccessfulPayment.
   */
  private async resolveSignupPlan(
    requested?: string,
  ): Promise<{ planId: string | null; pendingPlan: string | null }> {
    const code = String(requested || '').trim().toUpperCase();
    const plan = code
      ? await this.prisma.subscriptionPlan.findFirst({
          where: { code, isActive: true, isPublic: true },
          select: { id: true, code: true },
        })
      : null;

    if (!plan) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'PLAN_REQUIRED',
        message: code
          ? 'The selected plan is not available. Please choose one of the listed plans.'
          : 'Please choose a plan to create your account.',
      });
    }
    if (plan.code === 'FREE') {
      return { planId: plan.id, pendingPlan: null };
    }

    const freePlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: 'FREE' },
      select: { id: true },
    });
    return { planId: freePlan?.id ?? null, pendingPlan: plan.code };
  }

  /**
   * Verifies a Google ID token with Google and returns the profile it vouches for.
   * There is no fallback: if Google does not confirm the token, it is rejected.
   */
  async verifyGoogleCredential(credential: string): Promise<{
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    sub?: string;
  }> {
    if (!credential || typeof credential !== 'string') {
      throw new BadRequestException('Google credential token is required');
    }

    const expectedAudience = (process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID)
      .replace(/['"\s]/g, '')
      .trim();

    let data: any;
    try {
      // Google validates the signature and expiry before answering 200.
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      );
      if (!res.ok) {
        throw new UnauthorizedException('Invalid or expired Google authentication credential');
      }
      data = await res.json();
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.warn(`Google tokeninfo lookup failed: ${err?.message || err}`);
      throw new ServiceUnavailableException('Could not reach Google to verify your sign-in. Please try again.');
    }

    if (String(data.aud || '') !== expectedAudience) {
      this.logger.warn(`Google token audience mismatch (aud="${data.aud}")`);
      throw new UnauthorizedException('Google token was not issued for this application.');
    }

    const issuer = String(data.iss || '');
    if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
      throw new UnauthorizedException('Invalid Google token issuer.');
    }

    if (!data.email || String(data.email_verified) !== 'true') {
      throw new UnauthorizedException('Your Google account email is not verified.');
    }

    return {
      email: String(data.email).toLowerCase().trim(),
      firstName: data.given_name || (data.name ? data.name.split(' ')[0] : 'Store'),
      lastName: data.family_name || (data.name ? data.name.split(' ').slice(1).join(' ') : 'Owner'),
      picture: data.picture,
      sub: data.sub,
    };
  }

  async googleAuth(dto: GoogleAuthDto) {
    if (!dto.credential) {
      throw new BadRequestException('Google credential token is required');
    }

    const googleProfile = await this.verifyGoogleCredential(dto.credential);
    // The email comes only from the token Google verified, never from the request body.
    const email = googleProfile.email;
    const firstName = dto.firstName || googleProfile.firstName || 'Store';
    const lastName = dto.lastName || googleProfile.lastName || 'Owner';

    // Check if user already exists
    let user = await this.findUserByEmail(email);

    if (!user) {
      const signupPlan = await this.resolveSignupPlan(dto.plan);
      // Create new user and business workspace
      const storeName = dto.businessName?.trim() || `${firstName}'s Store`;
      let slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const existingBusiness = await this.prisma.business.findUnique({ where: { slug } });
      if (existingBusiness) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const randomPassword = randomBytes(24).toString('base64url');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const business = await this.prisma.business.create({
        data: {
          name: storeName,
          slug,
          phone: dto.phone,
          plan: 'FREE',
          planId: signupPlan.planId,
          subscriptionStatus: 'FREE',
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
        pendingPlan: signupPlan.pendingPlan,
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
    const email = this.normalizeEmail(dto.email);

    // The address must have been confirmed with a one-time code first.
    this.assertEmailVerified(email, dto.emailVerificationToken);

    const existingUser = await this.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const signupPlan = await this.resolveSignupPlan(dto.plan);

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
        plan: 'FREE',
        planId: signupPlan.planId,
        subscriptionStatus: 'FREE',
        users: {
          create: {
            email,
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
      pendingPlan: signupPlan.pendingPlan,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);

    // Per-account limit, on top of the per-IP limit on the route, so one account
    // cannot be guessed at from many addresses.
    await this.rateLimit.hit(`login:email:${email}`, 10, 15 * 60);

    const user = await this.findUserByEmail(email);

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
    // Refresh tokens were being stored on every login but nothing ever consumed
    // or revoked them, so only the access token is issued.
    return {
      accessToken: this.jwtService.sign({ sub: userId, email }),
    };
  }

  async forgotPassword(email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email address is required');
    }

    const cleanEmail = this.normalizeEmail(email);
    await this.rateLimit.hit(`forgot:email:${cleanEmail}`, 3, 60 * 60);

    const user = await this.findUserByEmail(cleanEmail);

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

    const resetUrl = `${frontendUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;

    // The link goes to the account's inbox only. It must never be returned in the
    // API response, otherwise anyone could reset anyone's password.
    try {
      await this.mailService.sendPasswordResetEmail(user.email, resetUrl, user.firstName);
    } catch (err: any) {
      this.logger.error(`Failed to send password reset email: ${err?.message || err}`);
    }

    return {
      message: 'If an account is associated with this email address, password reset instructions have been sent.',
    };
  }

  async sendOtp(email: string, fullName: string = 'Store Owner') {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email address is required');
    }

    const cleanEmail = this.normalizeEmail(email);
    await this.rateLimit.hit(`otp-send:email:${cleanEmail}`, 3, 10 * 60);

    const code = randomInt(100000, 1000000).toString();

    // Only a hash is stored; a new code replaces any earlier one for this address.
    await this.prisma.emailOtp.upsert({
      where: { email: cleanEmail },
      create: {
        email: cleanEmail,
        codeHash: this.hashOtp(cleanEmail, code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
      update: {
        codeHash: this.hashOtp(cleanEmail, code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
        createdAt: new Date(),
      },
    });

    await this.mailService.sendOtpEmail(cleanEmail, code, fullName);

    return {
      success: true,
      message: `6-digit verification code sent to ${cleanEmail}`,
    };
  }

  async verifyOtp(email: string, code: string) {
    if (!email || !code) {
      throw new BadRequestException('Email and verification code are required');
    }

    const cleanEmail = this.normalizeEmail(email);
    const cleanCode = String(code).trim();

    const pending = await this.prisma.emailOtp.findUnique({ where: { email: cleanEmail } });
    if (!pending) {
      throw new BadRequestException('Verification code has expired or was not requested. Please request a new code.');
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await this.prisma.emailOtp.delete({ where: { email: cleanEmail } }).catch(() => {});
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    if (pending.attempts >= OTP_MAX_ATTEMPTS) {
      await this.prisma.emailOtp.delete({ where: { email: cleanEmail } }).catch(() => {});
      throw new BadRequestException('Too many incorrect attempts. Please request a new code.');
    }

    const expected = Buffer.from(pending.codeHash, 'hex');
    const given = Buffer.from(this.hashOtp(cleanEmail, cleanCode), 'hex');
    const matches = expected.length === given.length && timingSafeEqual(expected, given);

    if (!matches) {
      await this.prisma.emailOtp.update({
        where: { email: cleanEmail },
        data: { attempts: { increment: 1 } },
      });
      const left = OTP_MAX_ATTEMPTS - (pending.attempts + 1);
      throw new BadRequestException(
        left > 0
          ? `Invalid verification code. ${left} attempt${left === 1 ? '' : 's'} left.`
          : 'Too many incorrect attempts. Please request a new code.',
      );
    }

    // A code works once.
    await this.prisma.emailOtp.delete({ where: { email: cleanEmail } }).catch(() => {});

    // Signup must present this token, proving the address was confirmed.
    const emailVerificationToken = this.jwtService.sign(
      { type: 'email_verified', email: cleanEmail },
      { expiresIn: '30m' },
    );

    return { success: true, verified: true, emailVerificationToken };
  }

  private assertEmailVerified(email: string, token?: string) {
    if (!token) {
      throw new BadRequestException('Please verify your email address with the code we sent you before creating an account.');
    }
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Your email verification has expired. Please request a new code.');
    }
    if (payload?.type !== 'email_verified' || payload.email !== email) {
      throw new BadRequestException('Email verification does not match this address. Please verify again.');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Reset token and new password are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
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

  async updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; password?: string }) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const updateData: any = {};
    if (data.firstName !== undefined && data.firstName.trim()) {
      updateData.firstName = data.firstName.trim();
    }
    if (data.lastName !== undefined && data.lastName.trim()) {
      updateData.lastName = data.lastName.trim();
    }
    if (data.password && data.password.trim()) {
      if (data.password.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters long');
      }
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { business: true },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return {
      success: true,
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    };
  }
}

