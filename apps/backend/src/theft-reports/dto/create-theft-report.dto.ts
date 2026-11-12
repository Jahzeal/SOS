import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEmail, Min } from 'class-validator';

export class CreateTheftReportDto {
  // Optional: laptops and Wi-Fi tablets have no IMEI. The service requires an
  // IMEI or a serial number.
  @IsString()
  @IsOptional()
  imei1?: string;

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

  // Ignored by the server: the owner's email always comes from the verified sign-in.
  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsNotEmpty()
  ownerPhone: string;

  @IsString()
  @IsOptional()
  lostNote?: string;

  @IsNumber()
  @Min(0)
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

export class ReporterSessionDto {
  @IsString()
  @IsNotEmpty()
  credential: string;
}

export class ResolveTheftReportDto {
  // Ignored by the server: only the verified signed-in owner can resolve.
  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  @IsString()
  @IsOptional()
  resolvedNote?: string;
}
