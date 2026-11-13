import { Injectable, Logger } from '@nestjs/common';
import {
  IDeviceLookupProvider,
  DeviceLookupRequest,
  NormalizedLookupResponse,
} from './interfaces/device-lookup-provider.interface';
import { HPProvider } from './providers/hp.provider';
import { LenovoProvider } from './providers/lenovo.provider';
import { DellProvider } from './providers/dell.provider';
import { AppleProvider } from './providers/apple.provider';
import { ImeiProvider } from './providers/imei.provider';

@Injectable()
export class DeviceLookupService {
  private readonly logger = new Logger(DeviceLookupService.name);
  private readonly providers: IDeviceLookupProvider[];
  private cache = new Map<string, { data: NormalizedLookupResponse; timestamp: number }>();
  private readonly CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

  constructor(
    private readonly hpProvider: HPProvider,
    private readonly lenovoProvider: LenovoProvider,
    private readonly dellProvider: DellProvider,
    private readonly appleProvider: AppleProvider,
    private readonly imeiProvider: ImeiProvider,
  ) {
    this.providers = [
      this.imeiProvider,
      this.hpProvider,
      this.lenovoProvider,
      this.dellProvider,
      this.appleProvider,
    ];
  }

  async identifyDevice(request: DeviceLookupRequest): Promise<NormalizedLookupResponse> {
    if (!request?.identifier || typeof request.identifier !== 'string') {
      return {
        status: 'not_found',
        source: 'system',
        confidence: 'low',
        message: 'No identifier provided',
      };
    }

    const cleanId = request.identifier.trim().toUpperCase().replace(/[\s-_]/g, '');
    const cacheKey = `${cleanId}_${request.productNumber || ''}_${request.deviceType || ''}`;

    // Check in-memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    // Find supporting provider
    let notFoundMessage: string | undefined;
    for (const provider of this.providers) {
      if (provider.supports(request)) {
        try {
          const result = await provider.lookup(request);
          if (result && result.status !== 'not_found') {
            // Phone answers come from stores' own records, which change as phones
            // are registered, so they are looked up fresh every time.
            if (provider !== this.imeiProvider) {
              this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
            }
            return result;
          }
          if (result?.message && !notFoundMessage) notFoundMessage = result.message;
        } catch (err: any) {
          this.logger.warn(`Provider ${provider.providerName} threw an error: ${err?.message}`);
        }
      }
    }

    // Default response if no provider matched
    const notFoundResult: NormalizedLookupResponse = {
      status: 'not_found',
      source: 'device_lookup_engine',
      confidence: 'low',
      message: notFoundMessage || "We couldn't identify this device automatically. You can enter details manually.",
    };

    return notFoundResult;
  }
}
