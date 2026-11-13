import { Injectable } from '@nestjs/common';
import {
  IDeviceLookupProvider,
  DeviceLookupRequest,
  NormalizedLookupResponse,
} from '../interfaces/device-lookup-provider.interface';
import { TacSuggestionService, isValidImei } from '../tac-suggestion.service';

/**
 * Names a phone from its IMEI. There is no built-in list and nothing is guessed:
 * the only source is phones that stores have already registered on NoxGuarda
 * with the same first 8 digits (see TacSuggestionService).
 */
@Injectable()
export class ImeiProvider implements IDeviceLookupProvider {
  readonly providerName = 'noxguarda_records';

  constructor(private readonly tacSuggestions: TacSuggestionService) {}

  private clean(identifier: string): string {
    return String(identifier || '').replace(/[\s-]/g, '');
  }

  supports(request: DeviceLookupRequest): boolean {
    if (request.deviceType === 'laptop') return false;
    return /^\d{14,16}$/.test(this.clean(request.identifier)) || request.identifierType === 'imei';
  }

  async lookup(request: DeviceLookupRequest): Promise<NormalizedLookupResponse> {
    const imei = this.clean(request.identifier);

    if (!isValidImei(imei)) {
      return {
        status: 'not_found',
        source: this.providerName,
        confidence: 'low',
        message:
          'This IMEI does not look right. Please check the digits against the phone (dial *#06#).',
      };
    }

    const suggestion = await this.tacSuggestions.suggest(imei);
    if (!suggestion) {
      return {
        status: 'not_found',
        source: this.providerName,
        confidence: 'low',
        message: 'Enter the brand and model in the next step.',
      };
    }

    return {
      status: 'identified',
      source: this.providerName,
      confidence: suggestion.confidence,
      message: 'Suggested from phones already registered on NoxGuarda. Please confirm it is correct.',
      device: {
        deviceType: 'phone',
        manufacturer: suggestion.brand,
        productName: suggestion.model,
        serialNumber: imei,
        specs: null,
        warrantyStatus: 'unknown',
      },
    };
  }
}
