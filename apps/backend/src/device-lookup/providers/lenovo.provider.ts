import { Injectable, Logger } from '@nestjs/common';
import {
  IDeviceLookupProvider,
  DeviceLookupRequest,
  NormalizedLookupResponse,
} from '../interfaces/device-lookup-provider.interface';

@Injectable()
export class LenovoProvider implements IDeviceLookupProvider {
  readonly providerName = 'lenovo';
  private readonly logger = new Logger(LenovoProvider.name);

  supports(request: DeviceLookupRequest): boolean {
    const id = (request.identifier || '').trim().toUpperCase();
    if (request.brandHint && request.brandHint.toUpperCase() === 'LENOVO') return true;

    return (
      /^(20|21|80|81|82|83|MP|PC|YX|PW|10|11|12)[A-Z0-9]{6,10}/i.test(id) ||
      /^PF[A-Z0-9]{6}$/i.test(id)
    );
  }

  async lookup(request: DeviceLookupRequest): Promise<NormalizedLookupResponse> {
    const id = request.identifier.trim().toUpperCase();

    try {
      const url = `https://pcsupport.lenovo.com/us/en/api/v4/mse/getproducts?productId=${encodeURIComponent(id)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'VerifyFlow/1.0' } });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0]?.Name) {
          const name = data[0].Name;
          let model = name;
          if (name.includes('ThinkPad') && !name.startsWith('ThinkPad')) {
            model = `ThinkPad ${name.replace(/\s*\(ThinkPad\).*/i, '').replace(/\s*Laptop.*/i, '').trim()}`;
          } else if (name.includes('IdeaPad') && !name.startsWith('IdeaPad')) {
            model = `IdeaPad ${name.replace(/\s*\(IdeaPad\).*/i, '').replace(/\s*Laptop.*/i, '').trim()}`;
          } else if (name.includes('Legion') && !name.startsWith('Legion')) {
            model = `Legion ${name.replace(/\s*\(Legion\).*/i, '').replace(/\s*Laptop.*/i, '').trim()}`;
          }

          return {
            status: 'identified',
            source: 'lenovo_live_api',
            confidence: 'high',
            device: {
              deviceType: 'laptop',
              manufacturer: 'Lenovo',
              productName: model.slice(0, 60),
              modelNumber: data[0]?.MachineType || null,
              serialNumber: id,
              specs: null,
              warrantyStatus: 'unknown',
            },
          };
        }
      }
    } catch (err: any) {
      this.logger.debug(`Lenovo API lookup failed for ${id}: ${err?.message}`);
    }

    // No real answer from Lenovo: say so instead of guessing a model.
    return {
      status: 'not_found',
      source: 'lenovo_live_api',
      confidence: 'low',
      message: 'Could not identify this Lenovo device. Pick the brand and model yourself.',
    };
  }
}
