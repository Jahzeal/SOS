import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { PhoneCondition, PhoneStatus } from '@prisma/client';

export class RegisterPhoneDto {
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

  @IsString()
  @IsOptional()
  storageCapacity?: string;

  @IsEnum(PhoneCondition)
  @IsOptional()
  condition?: PhoneCondition;

  @IsEnum(PhoneStatus)
  @IsOptional()
  status?: PhoneStatus;

  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @IsNumber()
  @IsOptional()
  sellingPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  warrantyDurationMonths?: number;

  @IsString()
  @IsOptional()
  customerId?: string;
}

export class SearchPhoneQueryDto {
  @IsString()
  @IsOptional()
  query?: string; // Search IMEI, Serial, Brand, Model
}
