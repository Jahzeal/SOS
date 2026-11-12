import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsPositive } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class RecordQuotePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  installmentId?: string;
}
