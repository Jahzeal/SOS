import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEmail,
  IsIn,
  Min,
  Max,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';

// Logos are stored inline, so allow room for a small image but not an unbounded one.
const MAX_LOGO_LENGTH = 1_500_000;

export class UpdateBusinessSettingsDto {
  @IsString()
  @IsOptional()
  @MaxLength(160)
  name?: string;

  @ValidateIf((o) => !!o.logoUrl)
  @IsString()
  @MaxLength(MAX_LOGO_LENGTH)
  logoUrl?: string | null;

  @ValidateIf((o) => !!o.address)
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ValidateIf((o) => !!o.phone)
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @ValidateIf((o) => !!o.email)
  @IsEmail()
  email?: string | null;

  @ValidateIf((o) => !!o.bankName)
  @IsString()
  @MaxLength(120)
  bankName?: string | null;

  @ValidateIf((o) => !!o.accountNumber)
  @IsString()
  @MaxLength(40)
  accountNumber?: string | null;

  @ValidateIf((o) => !!o.accountName)
  @IsString()
  @MaxLength(160)
  accountName?: string | null;

  @ValidateIf((o) => !!o.taxId)
  @IsString()
  @MaxLength(60)
  taxId?: string | null;

  @IsBoolean()
  @IsOptional()
  publicVerificationEnabled?: boolean;

  @ValidateIf((o) => !!o.customSuccessMessage)
  @IsString()
  @MaxLength(500)
  customSuccessMessage?: string | null;

  @ValidateIf((o) => !!o.warrantyTerms)
  @IsString()
  @MaxLength(4000)
  warrantyTerms?: string | null;

  @ValidateIf((o) => !!o.receiptFooter)
  @IsString()
  @MaxLength(1000)
  receiptFooter?: string | null;

  @ValidateIf((o) => !!o.receiptTerms)
  @IsString()
  @MaxLength(4000)
  receiptTerms?: string | null;

  @IsIn(['58mm', '80mm', 'A4', 'A5'])
  @IsOptional()
  receiptPaperSize?: string;
}

export class UpdateTemplateSettingsDto extends UpdateBusinessSettingsDto {
  @ValidateIf((o) => !!o.quoteTitle)
  @IsString()
  @MaxLength(120)
  quoteTitle?: string | null;

  @ValidateIf((o) => !!o.quoteTerms)
  @IsString()
  @MaxLength(4000)
  quoteTerms?: string | null;

  @ValidateIf((o) => !!o.quoteNotes)
  @IsString()
  @MaxLength(4000)
  quoteNotes?: string | null;

  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  quoteValidityDays?: number;

  @ValidateIf((o) => !!o.quoteAccentColor)
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'quoteAccentColor must be a hex colour like #2563EB' })
  quoteAccentColor?: string | null;

  @IsBoolean()
  @IsOptional()
  quoteShowBankDetails?: boolean;

  @IsBoolean()
  @IsOptional()
  quoteShowSignature?: boolean;
}

export class UpdatePlanDto {
  @IsString()
  @MaxLength(40)
  plan: string;
}
