import { Injectable } from '@nestjs/common';
import {
  IDeviceLookupProvider,
  DeviceLookupRequest,
  NormalizedLookupResponse,
} from '../interfaces/device-lookup-provider.interface';

@Injectable()
export class AppleProvider implements IDeviceLookupProvider {
  readonly providerName = 'apple';


  supports(request: DeviceLookupRequest): boolean {
    const id = (request.identifier || '').trim().toUpperCase();
    if (request.brandHint && request.brandHint.toUpperCase() === 'APPLE') return true;

    // Apple 12-character alphanumeric or 10-character modern serials
    return (
      /^[A-Z0-9]{12}$/i.test(id) &&
      /^(C02|C07|FVF|C17|G8W|H0V|DLX|W88|FMF|SG0|SG1|SG2)/i.test(id)
    );
  }

  /**
   * Apple has no public lookup, and Mac serial numbers have been random since 2021, so a
   * model cannot be read from the serial. We say so rather than guess.
   */
  async lookup(_request: DeviceLookupRequest): Promise<NormalizedLookupResponse> {
    return {
      status: 'not_found',
      source: 'apple',
      confidence: 'low',
      message: 'Apple serial numbers do not show the model. Pick the model yourself.',
    };
  }
}
