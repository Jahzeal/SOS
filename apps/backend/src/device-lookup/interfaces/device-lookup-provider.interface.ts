export type DeviceType = 'laptop' | 'phone' | 'item' | 'accessory';
export type IdentifierType = 'serial' | 'imei' | 'barcode' | 'sku';
export type IdentificationStatus =
  | 'identified'
  | 'additional_information_required'
  | 'not_found'
  | 'provider_unavailable';

export interface DeviceLookupRequest {
  deviceType?: DeviceType;
  identifierType?: IdentifierType;
  identifier: string;
  productNumber?: string;
  brandHint?: string;
}

export interface NormalizedDevice {
  deviceType: DeviceType;
  manufacturer: string;
  productName: string;
  modelNumber?: string | null;
  productNumber?: string | null;
  serialNumber: string;
  specs?: string | null;
  warrantyStatus?: 'active' | 'expired' | 'unknown' | null;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  suggestedModels?: string[];
  rawDetails?: Record<string, any>;
}

export interface NormalizedLookupResponse {
  status: IdentificationStatus;
  device?: NormalizedDevice | null;
  requiredFields?: string[];
  message?: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface IDeviceLookupProvider {
  readonly providerName: string;
  supports(request: DeviceLookupRequest): boolean;
  lookup(request: DeviceLookupRequest): Promise<NormalizedLookupResponse>;
}
