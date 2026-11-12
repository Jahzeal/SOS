import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsEnum,
  IsEmail,
  Min,
  Max,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PhoneCondition, PhoneStatus } from '@prisma/client';

export class UpdatePhoneDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  brand?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  model?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  storageCapacity?: string;

  @IsEnum(PhoneCondition)
  @IsOptional()
  condition?: PhoneCondition;

  @IsEnum(PhoneStatus)
  @IsOptional()
  status?: PhoneStatus;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @IsOptional()
  purchasePrice?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @IsOptional()
  sellingPrice?: number;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  serialNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  imei2?: string;

  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  warrantyDurationMonths?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  customerName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  customerPhone?: string;

  @ValidateIf((o) => !!o.customerEmail)
  @IsEmail()
  customerEmail?: string;
}

export class FlagStolenDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  theftReason?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  lostNote?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  contactPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  policeCaseNo?: string;
}
