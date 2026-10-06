import { Injectable } from '@nestjs/common';
import {
  IDeviceLookupProvider,
  DeviceLookupRequest,
  NormalizedLookupResponse,
} from '../interfaces/device-lookup-provider.interface';

@Injectable()
export class AppleProvider implements IDeviceLookupProvider {
  readonly providerName = 'apple';

  private readonly appleMacDb: Record<string, { model: string; specs: string }> = {
    J5V6: { model: 'MacBook Pro 13" (M1, 2020)', specs: 'Apple M1 (8-core CPU, 8-core GPU) • Unified Memory • Retina Display' },
    Q05D: { model: 'MacBook Pro 14" (M1 Pro, 2021)', specs: 'Apple M1 Pro 8-Core/10-Core • Liquid Retina XDR (120Hz ProMotion)' },
    Q05F: { model: 'MacBook Pro 16" (M1 Pro, 2021)', specs: 'Apple M1 Pro 10-Core • 16.2" Liquid Retina XDR (120Hz ProMotion)' },
    G9MQ: { model: 'MacBook Air 13.6" (M2, 2022)', specs: 'Apple M2 (8-core CPU, 8/10-core GPU) • Liquid Retina • MagSafe 3' },
    R7Y1: { model: 'MacBook Pro 14" (M2 Pro, 2023)', specs: 'Apple M2 Pro 10/12-Core • 14.2" Liquid Retina XDR • HDMI 2.1' },
    W3Y6: { model: 'MacBook Pro 14" (M3 Pro, 2023)', specs: 'Apple M3 Pro 11/12-Core (3nm) • Liquid Retina XDR • Space Black' },
    W3Y8: { model: 'MacBook Pro 16" (M3 Max, 2023)', specs: 'Apple M3 Max 14/16-Core (3nm) • Liquid Retina XDR • Space Black' },
    F0V7: { model: 'MacBook Air 13" (M1, 2020)', specs: 'Apple M1 (8-core CPU, 7/8-core GPU) • Fanless Design • Retina Display' },
  };

  supports(request: DeviceLookupRequest): boolean {
    const id = (request.identifier || '').trim().toUpperCase();
    if (request.brandHint && request.brandHint.toUpperCase() === 'APPLE') return true;

    // Apple 12-character alphanumeric or 10-character modern serials
    return (
      /^[A-Z0-9]{12}$/i.test(id) &&
      /^(C02|C07|FVF|C17|G8W|H0V|DLX|W88|FMF|SG0|SG1|SG2)/i.test(id)
    );
  }

  async lookup(request: DeviceLookupRequest): Promise<NormalizedLookupResponse> {
    const serial = request.identifier.trim().toUpperCase();
    const last4 = serial.slice(-4);

    const match = this.appleMacDb[last4];
    if (match) {
      return {
        status: 'identified',
        source: 'apple_hardware_registry',
        confidence: 'high',
        device: {
          deviceType: 'laptop',
          manufacturer: 'Apple',
          productName: match.model,
          modelNumber: last4,
          serialNumber: serial,
          specs: match.specs,
          warrantyStatus: 'unknown',
        },
      };
    }

    return {
      status: 'identified',
      source: 'apple_hardware_registry',
      confidence: 'medium',
      device: {
        deviceType: 'laptop',
        manufacturer: 'Apple',
        productName: 'MacBook Pro / MacBook Air',
        modelNumber: null,
        serialNumber: serial,
        suggestedModels: ['MacBook Pro 14"', 'MacBook Pro 16"', 'MacBook Air 13"', 'MacBook Air 15"'],
        specs: 'Apple Silicon Architecture • Unified Memory • Liquid Retina Display',
        warrantyStatus: 'unknown',
      },
    };
  }
}
