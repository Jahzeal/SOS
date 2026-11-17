import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, Length, IsBoolean } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  businessName: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  /** Proof that the email address was confirmed with a one-time code (from /auth/verify-otp). */
  @IsString()
  @IsOptional()
  emailVerificationToken?: string;
}

export class SendOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  fullName?: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  /** Required whenever `password` is being changed. */
  @IsString()
  @IsOptional()
  @MaxLength(128)
  currentPassword?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  /** "Keep me signed in": a 30-day session that renews itself while it is used. */
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}

export class RefreshSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  refreshToken?: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  credential: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  businessName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

