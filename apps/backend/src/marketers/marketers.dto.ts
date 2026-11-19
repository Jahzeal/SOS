import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsBoolean } from 'class-validator';

export class CreateMarketerDto {
  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class SetMarketerActiveDto {
  @IsBoolean()
  active: boolean;
}

export class AcceptMarketerInviteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  storeName?: string;
}

export class AddReferralDto {
  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shopName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
