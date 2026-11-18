import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsEmail,
  IsBoolean,
  IsArray,
  IsIn,
  Min,
  Max,
  MaxLength,
  MinLength,
  ArrayMaxSize,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PhoneCondition } from '@prisma/client';
import { SaleItemDto } from '../../sales/dto/checkout-sale.dto';

const MAX_MONEY = 1_000_000_000_000;

/** The device the customer is giving the store. */
export class IncomingDeviceDto {
  @IsIn(['PHONE', 'LAPTOP'])
  category: 'PHONE' | 'LAPTOP';

  @IsString()
  @IsOptional()
  @MaxLength(40)
  imei1?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  imei2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  serialNumber?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  brand: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  storageCapacity?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  color?: string;

  @IsEnum(PhoneCondition)
  condition: PhoneCondition;

  /** What the store gives the customer for it, in naira. */
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY)
  tradeInValue: number;
}

export class CreateTradeInDto {
  @ValidateNested()
  @Type(() => IncomingDeviceDto)
  incoming: IncomingDeviceDto;

  /** What the customer receives. Empty means the store is buying the device for cash. */
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items?: SaleItemDto[];

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  customerName: string;

  @IsString()
  @MinLength(5)
  @MaxLength(40)
  customerPhone: string;

  @ValidateIf((o) => !!o.customerEmail)
  @IsEmail()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  idType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  idNumber?: string;

  @IsBoolean()
  ownershipConfirmed: boolean;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}
