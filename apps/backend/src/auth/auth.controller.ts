import { Controller, Post, Put, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  GoogleAuthDto,
  SendOtpDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

const MINUTE = 60;

@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @RateLimit({ name: 'auth-register', limit: 10, windowSeconds: 60 * MINUTE })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @RateLimit({ name: 'auth-login', limit: 30, windowSeconds: 15 * MINUTE })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @RateLimit({ name: 'auth-google', limit: 30, windowSeconds: 15 * MINUTE })
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @Post('send-otp')
  @RateLimit({ name: 'auth-send-otp', limit: 10, windowSeconds: 15 * MINUTE })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.email, dto.fullName);
  }

  @Post('verify-otp')
  @RateLimit({ name: 'auth-verify-otp', limit: 30, windowSeconds: 15 * MINUTE })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @Post('forgot-password')
  @RateLimit({ name: 'auth-forgot', limit: 10, windowSeconds: 15 * MINUTE })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @RateLimit({ name: 'auth-reset', limit: 10, windowSeconds: 15 * MINUTE })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@CurrentUser() user: any, @Body() body: UpdateProfileDto) {
    return this.authService.updateUserProfile(user.id, body);
  }
}
