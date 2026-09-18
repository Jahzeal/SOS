import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEmail } from 'class-validator';

export class CreateTheftReportDto {
  @IsString()
  @IsNotEmpty()
  imei1: string;

  @IsString()
  @IsOptional()
  imei2?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsString()
  @IsNotEmpty()
  ownerPhone: string;

  @IsString()
  @IsOptional()
  lostNote?: string;

  @IsNumber()
  @IsOptional()
  bountyAmount?: number;

  @IsString()
  @IsOptional()
  verificationSource?: string;

  @IsString()
  @IsOptional()
  proofUrl?: string;

  @IsString()
  @IsOptional()
  policeCaseNo?: string;
}

export class ResolveTheftReportDto {
  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @IsString()
  @IsOptional()
  resolvedNote?: string;
}
