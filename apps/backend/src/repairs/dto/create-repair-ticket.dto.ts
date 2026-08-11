import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { RepairStatus } from '@prisma/client';

export class CreateRepairTicketDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  phoneRecordId?: string;

  @IsString()
  @IsNotEmpty()
  deviceModel: string;

  @IsString()
  @IsNotEmpty()
  issueDescription: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @IsEnum(RepairStatus)
  @IsOptional()
  status?: RepairStatus;

  @IsString()
  @IsOptional()
  technicianNotes?: string;
}
