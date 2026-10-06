import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { DeviceType, IdentifierType } from '../interfaces/device-lookup-provider.interface';

export class LookupDeviceDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsOptional()
  @IsIn(['laptop', 'phone', 'item', 'accessory'])
  deviceType?: DeviceType;

  @IsOptional()
  @IsIn(['serial', 'imei', 'barcode', 'sku'])
  identifierType?: IdentifierType;

  @IsOptional()
  @IsString()
  productNumber?: string;

  @IsOptional()
  @IsString()
  brandHint?: string;
}
