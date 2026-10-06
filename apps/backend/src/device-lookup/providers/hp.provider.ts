import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IDeviceLookupProvider,
  DeviceLookupRequest,
  NormalizedLookupResponse,
} from '../interfaces/device-lookup-provider.interface';

@Injectable()
export class HPProvider implements IDeviceLookupProvider {
  readonly providerName = 'hp';
  private readonly logger = new Logger(HPProvider.name);

  constructor(private readonly configService: ConfigService) {}

  supports(request: DeviceLookupRequest): boolean {
    const id = (request.identifier || '').trim().toUpperCase();
    if (request.brandHint && request.brandHint.toUpperCase() === 'HP') return true;

    // Standard HP 10-char serial format (e.g. 5CG..., 5CD..., CND..., CNU..., CZC..., 2NA...)
    return (
      /^(5CG|5CD|6CD|8CG|CND|CNU|CZC|2NA|3CA|4CE|7CE|NX)[A-Z0-9]{7}$/i.test(id) ||
      (/^[A-Z0-9]{10}$/i.test(id) && /^(5CG|5CD|6CD|8CG|CND|CNU|CZC|2NA|4CE|7CE|3CA)/i.test(id))
    );
  }

  async lookup(request: DeviceLookupRequest): Promise<NormalizedLookupResponse> {
    const serial = request.identifier.trim().toUpperCase();
    const productNumber = (request.productNumber || '').trim().toUpperCase();

    const apiKey = this.configService.get<string>('HP_API_KEY');
    const apiSecret = this.configService.get<string>('HP_API_SECRET');
    const baseUrl = this.configService.get<string>('HP_API_BASE_URL') || 'https://api.hp.com';

    // Check if HP API credentials are configured in backend environment
    if (!apiKey || !apiSecret) {
      this.logger.warn(`HP API credentials (HP_API_KEY, HP_API_SECRET) not found in environment.`);
      return {
        status: 'provider_unavailable',
        source: 'hp_authorized_api',
        confidence: 'low',
        message: 'HP API credentials are not configured. Please add HP_API_KEY and HP_API_SECRET to your backend environment or enter specifications manually.',
      };
    }

    // Query Authorized HP API
    try {
      const apiResult = await this.callAuthorizedHpApi(serial, productNumber, apiKey, apiSecret, baseUrl);
      if (apiResult) {
        return apiResult;
      }

      return {
        status: 'not_found',
        source: 'hp_authorized_api',
        confidence: 'high',
        message: 'No HP hardware records found for this serial number on the authorized HP database.',
      };
    } catch (err: any) {
      this.logger.error(`Authorized HP API call failed for serial ${serial}: ${err?.message}`);
      return {
        status: 'provider_unavailable',
        source: 'hp_authorized_api',
        confidence: 'low',
        message: `HP API request failed (${err?.message || 'Network error'}). Please enter specifications manually.`,
      };
    }
  }

  /**
   * Authorized HP API Caller (OAuth 2.0 Client Credentials Grant)
   */
  private async callAuthorizedHpApi(
    serial: string,
    productNumber: string,
    apiKey: string,
    apiSecret: string,
    baseUrl: string,
  ): Promise<NormalizedLookupResponse | null> {
    // 1. Exchange client credentials for access token
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: apiSecret,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`HP Auth token exchange failed (HTTP ${tokenRes.status})`);
    }

    const tokenData = (await tokenRes.json()) as any;
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error('HP OAuth response did not contain an access_token');
    }

    // 2. Query HP Product Warranty & Specifications API
    const queryPayload: Record<string, any> = {
      serialNumber: serial,
    };
    if (productNumber) {
      queryPayload.productNumber = productNumber;
    }

    const lookupRes = await fetch(`${baseUrl}/product-warranty/v1/queries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryPayload),
    });

    // Check if HP explicitly requires productNumber to disambiguate
    if (lookupRes.status === 400 || lookupRes.status === 422) {
      const errorData = (await lookupRes.json().catch(() => ({}))) as any;
      if (
        errorData?.message?.toLowerCase().includes('productnumber') ||
        errorData?.requiredFields?.includes('productNumber') ||
        errorData?.errorDescription?.toLowerCase().includes('product number')
      ) {
        return {
          status: 'additional_information_required',
          requiredFields: ['productNumber'],
          source: 'hp_authorized_api',
          confidence: 'medium',
          message: 'HP requires the Product Number (ProdID) to pinpoint this exact configuration.',
        };
      }
    }

    if (lookupRes.status === 404) {
      return {
        status: 'not_found',
        source: 'hp_authorized_api',
        confidence: 'high',
        message: 'No record found on HP for this serial number.',
      };
    }

    if (!lookupRes.ok) {
      throw new Error(`HP Device Query failed with HTTP ${lookupRes.status}`);
    }

    const data = (await lookupRes.json()) as any;
    const product = data?.product || (Array.isArray(data) ? data[0] : data);

    if (!product || (!product.productName && !product.modelName && !product.description)) {
      return {
        status: 'not_found',
        source: 'hp_authorized_api',
        confidence: 'high',
        message: 'HP API did not return valid device specifications for this serial number.',
      };
    }

    return {
      status: 'identified',
      source: 'hp_authorized_api',
      confidence: 'high',
      device: {
        deviceType: 'laptop',
        manufacturer: 'HP',
        productName: product.productName || product.modelName || product.description || 'HP Laptop',
        modelNumber: product.modelNumber || null,
        productNumber: product.productNumber || productNumber || null,
        serialNumber: serial,
        specs: product.specs || product.description || product.hardwareSpecs || null,
        warrantyStatus: product.warrantyStatus?.toLowerCase() || 'unknown',
        warrantyStartDate: product.warrantyStartDate || null,
        warrantyEndDate: product.warrantyEndDate || null,
        rawDetails: product,
      },
    };
  }
}
