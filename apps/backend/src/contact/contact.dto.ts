import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const CONTACT_TOPICS = ['general', 'sales', 'support', 'billing', 'stolen-device', 'partnership'] as const;

export class ContactMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  storeName?: string;

  @IsString()
  @IsIn(CONTACT_TOPICS as unknown as string[])
  topic: string;

  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  message: string;

  /** Hidden field that people never see. Bots fill it in; real messages leave it empty. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
