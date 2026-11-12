import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsInt,
  IsIn,
  IsEnum,
  IsEmail,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

const MAX_MONEY = 1_000_000_000_000; // sanity ceiling for a single line, in naira

export class SaleItemDto {
  @IsString()
  @IsOptional()
  phoneRecordId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY)
  price: number;

  @IsInt()
  @Min(1)
  @Max(100000)
  @IsOptional()
  quantity?: number;
}

export class CheckoutSaleDto {
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

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsIn(['PAID', 'PARTIALLY_PAID', 'PENDING', 'DRAFT', 'CREDIT', 'OVERDUE'])
  @IsOptional()
  paymentStatus?: string;

  @IsIn(['RECEIPT', 'INVOICE'])
  @IsOptional()
  type?: 'RECEIPT' | 'INVOICE';

  @IsString()
  @IsOptional()
  @MaxLength(40)
  dueDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  paymentTerms?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  billingAddress?: string;

  // Bank details printed on an invoice
  @IsString()
  @IsOptional()
  @MaxLength(120)
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  accountNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  accountName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}

export class UpdateInvoiceItemDto {
  @IsString()
  @IsOptional()
  phoneRecordId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY)
  @IsOptional()
  price?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY)
  @IsOptional()
  unitPrice?: number;

  @IsInt()
  @Min(1)
  @Max(100000)
  @IsOptional()
  quantity?: number;
}

export class UpdateInvoiceDto {
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

  @IsString()
  @IsOptional()
  @MaxLength(500)
  billingAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  dueDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  paymentTerms?: string;

  @IsIn(['PAID', 'PARTIALLY_PAID', 'PENDING', 'DRAFT', 'CREDIT', 'OVERDUE'])
  @IsOptional()
  paymentStatus?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  accountNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  accountName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  notes?: string;

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => UpdateInvoiceItemDto)
  @IsOptional()
  items?: UpdateInvoiceItemDto[];
}

export class PayInvoiceDto {
  // The screen sends labels such as "TRANSFER"; the service maps them to a method.
  @IsString()
  @IsOptional()
  @MaxLength(40)
  paymentMethod?: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_MONEY)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  reference?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class SendDocumentEmailDto {
  @ValidateIf((o) => !!o.email)
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  id?: string;
}
