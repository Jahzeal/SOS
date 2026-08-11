import { IsEnum, IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';
import { RepairStatus } from '@prisma/client';

export class UpdateRepairStatusDto {
  @IsEnum(RepairStatus)
  @IsNotEmpty()
  status: RepairStatus;

  @IsString()
  @IsOptional()
  technicianNotes?: string;

  @IsNumber()
  @IsOptional()
  finalCost?: number;
}
