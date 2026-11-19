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
import { StaffAccessService } from '../common/staff/staff-access.service';

// OAuth client IDs are public identifiers (they ship in the frontend), not secrets.
const DEFAULT_GOOGLE_CLIENT_ID = '380893447009-j1qb7s0ub6k7t4529s3fhemlakj5c92c.apps.googleusercontent.com';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

// Sign-in sessions. Each sign-in is one row in the RefreshToken table; signing out,
// "sign out other devices" and password changes end sessions by marking rows revoked.
const HOUR_MS = 60 * 60 * 1000;
const SHORT_SESSION_MS = 24 * HOUR_MS; // box not ticked: same as before, one day
const REMEMBER_SESSION_MS = 30 * 24 * HOUR_MS; // "Keep me signed in": 30 days, renewed on every use
const SHORT_ACCESS_TTL = '24h';
const REMEMBER_ACCESS_TTL = '1h'; // short, because the app renews it quietly with the refresh token

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private rateLimit: RateLimitService,
    private staff: StaffAccessService,
  ) {}

  /** The parts of an account the app needs after signing in. */
  private publicUser(user: any, business: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      storeRole: user.storeRole || 'OWNER',
      branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null,
      business,
    };
  }

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  /** Emails were historically stored as typed, so look them up without regard to case. */
  private findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: this.normalizeEmail(email), mode: 'insensitive' } },
      include: { business: true, branch: { select: { id: true, name: true } } },
    });
  }

  private hashOtp(email: string, code: string): string {
    return createHash('sha256').update(`${email}:${code}`).digest('hex');
  }

  /**
   * Builds the store's web name from its name. Always returns something usable
   * (a name made only of symbols becomes "store") and never one already taken.
   */
  private async uniqueSlug(name: string): Promise<string> {
    const base =
      String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'store';

    let slug = base;
    for (let attempt = 0; attempt < 5; attempt++) {
      const taken = await this.prisma.business.findUnique({ where: { slug }, select: { id: true } });
      if (!taken) return slug;
      slug = `${base}-${randomBytes(3).toString('hex')}`;
    }
    return `${base}-${randomBytes(6).toString('hex')}`;
  }

  /**
   * Creates the store and its owner. Two sign-ups can still land at the same
   * moment, so a clash reported by the database is turned into a clear answer:
   * a taken email is refused, a taken store web name is retried with a new one.
   */
  private async createStoreWithOwner(build: (slug: string) => any, storeName: string) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = await this.uniqueSlug(storeName);
      try {
        return await this.prisma.business.create({ data: build(slug), include: { users: true } });
      } catch (err: any) {
        if (err?.code !== 'P2002') throw err;
        const target = [err?.meta?.target].flat().join(',');
        if (target.includes('email')) {
          throw new ConflictException('This email already has an account. Please sign in instead.');
        }
        // Otherwise the store web name was taken a moment ago: try again with a new one.
      }
    }
    throw new ConflictException('We could not set up your store just now. Please try again.');
  }

  /** A shop a marketer added by this email is linked to the new store. Never blocks sign-up. */
  private async linkMarketerReferral(email: string, businessId: string) {
    await this.prisma.marketerReferral
      .updateMany({
        where: { email: this.normalizeEmail(email), businessId: null, alreadyCustomer: false },
        data: { businessId, linkedAt: new Date() },
      })
      .catch((err) => console.error('Could not link marketer referral:', err?.message));
  }

  /**
   * A paid plan MUST be chosen at signup; there is no free plan and no trial.
   * The store is saved on the chosen plan with status PENDING_PAYMENT, which keeps
   * it locked until Paystack confirms payment (PaymentsService.applySuccessfulPayment).
   * The plan code is returned as `pendingPlan` so the app opens checkout straight away.
   */
  private async resolveSignupPlan(
    requested?: string,
  ): Promise<{ planId: string; planCode: string; pendingPlan: string }> {
    const code = String(requested || '').trim().toUpperCase();
    const plan = code
      ? await this.prisma.subscriptionPlan.findFirst({
          where: { code, isActive: true, isPublic: true },
          select: { id: true, code: true, monthlyPriceNgn: true, annualPriceNgn: true },
        })
      : null;

    if (!plan || plan.code === 'FREE' || (!plan.monthlyPriceNgn && !plan.annualPriceNgn)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'PLAN_REQUIRED',
        message: code
          ? 'The selected plan is not available. Please choose one of the listed plans.'
          : 'Please choose a plan to create your account.',
      });
    }
    return { planId: plan.id, planCode: plan.code, pendingPlan: plan.code };
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

    // Accept NoxGuarda's own Google app ID as well as the configured one, so a
    // mistyped GOOGLE_CLIENT_ID on the server cannot lock everyone out. Both are
    // exact matches; a token made for any other app is still refused.
    const tokenAudience = String(data.aud || '').trim();
    if (tokenAudience !== expectedAudience && tokenAudience !== DEFAULT_GOOGLE_CLIENT_ID) {
      this.logger.warn(
        `Google token audience mismatch (aud="${data.aud}", expected="${expectedAudience}")`,
      );
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

      const randomPassword = randomBytes(24).toString('base64url');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const business = await this.createStoreWithOwner(
        (slug) => ({
          name: storeName,
          slug,
          email,
          phone: dto.phone,
          plan: signupPlan.planCode,
          planId: signupPlan.planId,
          subscriptionStatus: 'PENDING_PAYMENT',
          users: {
            create: {
              email,
              password: hashedPassword,
              firstName,
              lastName,
              role: UserRole.BUSINESS,
            },
          },
        }),
        storeName,
      );

      const createdUser = business.users[0];
      await this.linkMarketerReferral(email, business.id);
      const tokens = await this.generateTokens(createdUser.id, createdUser.email, !!dto.rememberMe);

      // Asynchronously send welcome email
      this.mailService
        .sendWelcomeEmail(createdUser.email, createdUser.firstName || 'Store Owner', business.name, business.plan)
        .catch((err) => console.error('Failed to send welcome email for Google user:', err));

      return {
        user: this.publicUser(createdUser, {
          id: business.id,
          name: business.name,
          slug: business.slug,
          plan: business.plan,
        }),
        isNewUser: true,
        pendingPlan: signupPlan.pendingPlan,
        ...tokens,
      };
    }

    await this.staff.assertCanWork(user);
    const tokens = await this.generateTokens(user.id, user.email, !!dto.rememberMe);

    return {
      user: this.publicUser(user, user.business),
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
      throw new ConflictException('This email already has an account. Please sign in instead.');
    }

    const signupPlan = await this.resolveSignupPlan(dto.plan);

    const storeName = dto.businessName.trim();
    if (!storeName) {
      throw new BadRequestException('Please enter your store name.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const business = await this.createStoreWithOwner(
      (slug) => ({
        name: storeName,
        slug,
        email,
        phone: dto.phone,
        plan: signupPlan.planCode,
        planId: signupPlan.planId,
        subscriptionStatus: 'PENDING_PAYMENT',
        users: {
          create: {
            email,
            password: hashedPassword,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            role: UserRole.BUSINESS,
          },
        },
      }),
      storeName,
    );

    const user = business.users[0];
    await this.linkMarketerReferral(email, business.id);
    const tokens = await this.generateTokens(user.id, user.email);

    // Send Welcome Email asynchronously in background
    this.mailService
      .sendWelcomeEmail(user.email, user.firstName || 'Store Owner', business.name, business.plan)
      .catch((err) => console.error('Failed to send welcome email:', err));

    return {
      user: this.publicUser(user, {
        id: business.id,
        name: business.name,
        slug: business.slug,
        plan: business.plan,
      }),
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

    // Right password, but switched off or not covered by the store's plan.
    await this.staff.assertCanWork(user);

    const tokens = await this.generateTokens(user.id, user.email, !!dto.rememberMe);

    return {
      user: this.publicUser(user, user.business),
      ...tokens,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * A short fingerprint of the stored password hash. Put inside a reset link, it makes the
   * link single-use: once the password changes, the fingerprint no longer matches.
   */
  private passwordFingerprint(passwordHash: string): string {
    return createHash('sha256').update(String(passwordHash || '')).digest('hex').slice(0, 16);
  }

  /**
   * Starts a sign-in session. The access token carries the session id (`sid`), so the
   * session can be ended from the server. Only "Keep me signed in" gets a refresh token;
   * the database keeps a hash of it, never the token itself.
   */
  async generateTokens(userId: string, email: string, rememberMe = false) {
    const now = Date.now();

    // Tidy this person's finished sessions (also clears old rows from before sessions existed).
    await this.prisma.refreshToken
      .deleteMany({ where: { userId, OR: [{ expiresAt: { lt: new Date(now) } }, { revoked: true }] } })
      .catch(() => undefined);

    const refreshToken = randomBytes(32).toString('base64url');
    const session = await this.prisma.refreshToken.create({
      data: {
        userId,
        token: this.hashToken(refreshToken),
        expiresAt: new Date(now + (rememberMe ? REMEMBER_SESSION_MS : SHORT_SESSION_MS)),
      },
      select: { id: true },
    });

    const accessToken = this.jwtService.sign(
      { sub: userId, email, sid: session.id },
      { expiresIn: rememberMe ? REMEMBER_ACCESS_TTL : SHORT_ACCESS_TTL },
    );

    return rememberMe ? { accessToken, refreshToken, rememberMe: true } : { accessToken, rememberMe: false };
  }

  /**
   * "Keep me signed in": swaps a refresh token for a new access token and a new refresh
   * token (the old one stops working), and pushes the session's end 30 days out again.
   */
  async refreshSession(refreshToken: string) {
    const ended = () => new UnauthorizedException('Your session has ended. Please sign in again.');
    if (!refreshToken) throw ended();

    const hash = this.hashToken(refreshToken);
    const session = await this.prisma.refreshToken.findUnique({
      where: { token: hash },
      include: { user: { include: { business: true, branch: { select: { id: true, name: true } } } } },
    });
    if (!session || session.revoked || session.expiresAt.getTime() <= Date.now()) throw ended();

    // Switched off by the owner, or no longer covered by the plan.
    await this.staff.assertCanWork(session.user);

    const next = randomBytes(32).toString('base64url');
    // Conditional update: if two requests race with the same token, only one wins.
    const rotated = await this.prisma.refreshToken.updateMany({
      where: { id: session.id, token: hash, revoked: false },
      data: { token: this.hashToken(next), expiresAt: new Date(Date.now() + REMEMBER_SESSION_MS) },
    });
    if (rotated.count !== 1) throw ended();

    const accessToken = this.jwtService.sign(
      { sub: session.userId, email: session.user.email, sid: session.id },
      { expiresIn: REMEMBER_ACCESS_TTL },
    );

    return {
      accessToken,
      refreshToken: next,
      rememberMe: true,
      user: this.publicUser(session.user, session.user.business),
    };
  }

  /**
   * Ends the session behind an access token and/or a refresh token. Works with an expired
   * access token too (its signature is still checked), so signing out always ends the session.
   */
  async logout(bearerToken?: string, refreshToken?: string) {
    if (bearerToken) {
      try {
        const payload: any = this.jwtService.verify(bearerToken, { ignoreExpiration: true });
        if (payload?.sid && payload?.sub && !payload.type) {
          await this.prisma.refreshToken.updateMany({
            where: { id: payload.sid, userId: payload.sub },
            data: { revoked: true },
          });
        }
      } catch {
        // A token that is not ours: nothing to end.
      }
    }
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: this.hashToken(refreshToken) },
        data: { revoked: true },
      });
    }
    return { success: true };
  }

  /** Ends every session of this person except the one making the request. */
  async logoutOtherSessions(userId: string, currentSessionId?: string | null) {
    const result = await this.revokeSessions(userId, currentSessionId);
    return { success: true, signedOut: result };
  }

  private async revokeSessions(userId: string, keepSessionId?: string | null): Promise<number> {
    const res = await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false, ...(keepSessionId ? { NOT: { id: keepSessionId } } : {}) },
      data: { revoked: true },
    });
    return res.count;
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

    // Reset link valid for 1 hour and for one use only: `pwf` stops matching once the
    // password has been changed with it.
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset', pwf: this.passwordFingerprint(user.password) },
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

    // Say so now, not after the store details and plan have been filled in. This is
    // only revealed to someone who has just proved the address is theirs.
    if (await this.findUserByEmail(cleanEmail)) {
      throw new ConflictException('This email already has an account. Please sign in instead.');
    }

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

    // One use only: the link carries a fingerprint of the password it was made for.
    // Links sent before this check existed have no fingerprint and are refused too.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, password: true },
    });
    if (!user || !payload.pwf || payload.pwf !== this.passwordFingerprint(user.password)) {
      throw new BadRequestException(
        'This reset link has already been used or is no longer valid. Please request a new one.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // A reset usually means the password may be known to someone else: sign out everywhere.
    await this.revokeSessions(user.id);

    return {
      success: true,
      message: 'Your password has been reset successfully. You may now log in.',
    };
  }

  async updateUserProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; password?: string; currentPassword?: string },
    currentSessionId?: string | null,
  ) {
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
    const changingPassword = !!(data.password && data.password.trim());
    if (changingPassword) {
      if (data.password!.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters long');
      }
      // Someone holding an unlocked phone must not be able to take over the account.
      // (400, not 401: a wrong answer here must not sign the person out.)
      if (!data.currentPassword) {
        throw new BadRequestException(
          'Enter your current password to set a new one. If you sign in with Google and never set a password, use "Forgot password" on the sign-in page.',
        );
      }
      await this.rateLimit.hit(`password-change:user:${userId}`, 10, 15 * 60);
      const existing = await this.prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
      if (!existing || !(await bcrypt.compare(data.currentPassword, existing.password))) {
        throw new BadRequestException('Your current password is not correct.');
      }
      updateData.password = await bcrypt.hash(data.password!, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { business: true },
    });

    // New password: every other phone or computer is signed out; this one stays in.
    const signedOutOthers = changingPassword ? await this.revokeSessions(userId, currentSessionId) : 0;

    const { password: _, ...userWithoutPassword } = updatedUser;
    return {
      success: true,
      message: changingPassword
        ? 'Password changed. You have been signed out on your other devices.'
        : 'Profile updated successfully',
      user: userWithoutPassword,
      signedOutOthers,
    };
  }
}

