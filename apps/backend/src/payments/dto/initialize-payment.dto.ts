import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class InitializePaymentDto {
  @IsString()
  @IsNotEmpty()
  planCode: string;

  @IsString()
  @IsOptional()
  @IsIn(['MONTHLY', 'ANNUAL'])
  billingCycle?: 'MONTHLY' | 'ANNUAL';
}
