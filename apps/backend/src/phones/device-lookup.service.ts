import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

export interface DeviceLookupResult {
  found: boolean;
  brand?: string;
  model?: string;
  specs?: string;
  deviceCategory?: 'PHONE_TABLET' | 'LAPTOP' | 'ACCESSORY';
  source?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  rawDetails?: any;
}

@Injectable()
export class DeviceLookupService {
  private readonly logger = new Logger(DeviceLookupService.name);
  private cache = new Map<string, { data: DeviceLookupResult; timestamp: number }>();
  private readonly CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours in-memory cache

  /**
   * Main entry point to detect any laptop, phone, or gadget from 100% live cloud APIs
   */
  async lookup(rawIdentifier: string, categoryHint: 'LAPTOP' | 'PHONE' | 'ITEM' = 'LAPTOP'): Promise<DeviceLookupResult> {
    if (!rawIdentifier || typeof rawIdentifier !== 'string') {
      return { found: false };
    }

    const cleanId = rawIdentifier.trim().toUpperCase().replace(/[\s-_]/g, '');
    if (!cleanId || cleanId.length < 3) {
      return { found: false };
    }

    // Check cache
    const cached = this.cache.get(cleanId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    let result: DeviceLookupResult = { found: false };

    // 1. Live Apple Hardware Service (Queries official Apple support endpoint)
    if (this.isAppleFormat(cleanId)) {
      result = await this.lookupAppleLive(cleanId);
    }

    // 2. Live Lenovo Service API (Queries Lenovo official support endpoint)
    if (!result.found && this.isLenovoFormat(cleanId)) {
      result = await this.lookupLenovoLive(cleanId);
    }

    // 3. Live Dell Asset API
    if (!result.found && this.isDellFormat(cleanId)) {
      result = await this.lookupDellLive(cleanId);
    }

    // 4. Live Universal UPC / EAN Barcode Registry (12-14 digits)
    if (!result.found && /^\d{12,14}$/.test(cleanId)) {
      result = await this.lookupUniversalBarcodeLive(cleanId);
    }

    if (result.found) {
      this.cache.set(cleanId, { data: result, timestamp: Date.now() });
    }

    return result;
  }

  /* -------------------------------------------------------------------------- */
  /*                             APPLE LIVE ADAPTER                             */
  /* -------------------------------------------------------------------------- */

  private isAppleFormat(id: string): boolean {
    return /^[A-Z0-9]{10,12}$/.test(id) && !/^\d+$/.test(id);
  }

  private async lookupAppleLive(serial: string): Promise<DeviceLookupResult> {
    const suffixes = [serial.slice(-4), serial.slice(-3)];

    for (const suffix of suffixes) {
      try {
        const xml = await this.fetchText(`https://support-sp.apple.com/sp/product?cc=${suffix}`, 3500);
        const match = xml.match(/<configCode>(.*?)<\/configCode>/i);

        if (match && match[1] && match[1].trim()) {
          const rawModel = match[1].trim();
          const isLaptop = /MacBook|Mac\s*mini|iMac|Mac\s*Studio|Mac\s*Pro/i.test(rawModel);
          const isTablet = /iPad/i.test(rawModel);

          return {
            found: true,
            brand: 'Apple',
            model: rawModel,
            deviceCategory: isLaptop ? 'LAPTOP' : (isTablet ? 'PHONE_TABLET' : 'LAPTOP'),
            confidence: 'HIGH',
            source: 'APPLE_LIVE_CATALOG',
          };
        }
      } catch (err) {
        this.logger.debug(`Apple live query failed for suffix ${suffix}: ${err?.message}`);
      }
    }

    return { found: false };
  }

  /* -------------------------------------------------------------------------- */
  /*                            LENOVO LIVE ADAPTER                             */
  /* -------------------------------------------------------------------------- */

  private isLenovoFormat(id: string): boolean {
    return /^(20|21|80|81|82|83)[A-Z0-9]{2,8}/.test(id) || /^PF[A-Z0-9]{6}$/.test(id);
  }

  private async lookupLenovoLive(id: string): Promise<DeviceLookupResult> {
    try {
      const url = `https://pcsupport.lenovo.com/us/en/api/v4/mse/getproducts?productId=${encodeURIComponent(id)}`;
      const jsonStr = await this.fetchText(url, 4000);
      const data = JSON.parse(jsonStr);

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
          found: true,
          brand: 'Lenovo',
          model: model.slice(0, 60),
          deviceCategory: 'LAPTOP',
          confidence: 'HIGH',
          source: 'LENOVO_LIVE_API',
        };
      }
    } catch (err) {
      this.logger.debug(`Lenovo live lookup error for ${id}: ${err?.message}`);
    }

    return { found: false };
  }

  /* -------------------------------------------------------------------------- */
  /*                              DELL LIVE ADAPTER                             */
  /* -------------------------------------------------------------------------- */

  private isDellFormat(id: string): boolean {
    return /^[A-Z0-9]{7}$/.test(id) || /^\d{10,11}$/.test(id);
  }

  private async lookupDellLive(serviceTagOrExpress: string): Promise<DeviceLookupResult> {
    let serviceTag = serviceTagOrExpress;
    if (/^\d{10,11}$/.test(serviceTagOrExpress)) {
      try {
        serviceTag = this.expressCodeToServiceTag(serviceTagOrExpress);
      } catch (e) {
        // keep as is
      }
    }

    try {
      const url = `https://apigtwb2c.us.dell.com/PROD/sbil/eapi/v5/assets?servicetag=${serviceTag}`;
      const jsonStr = await this.fetchText(url, 3500);
      const data = JSON.parse(jsonStr);

      if (Array.isArray(data) && data.length > 0 && data[0]?.productLineDescription) {
        const item = data[0];
        return {
          found: true,
          brand: 'Dell',
          model: item.productLineDescription,
          deviceCategory: 'LAPTOP',
          confidence: 'HIGH',
          source: 'DELL_LIVE_API',
        };
      }
    } catch (err) {
      this.logger.debug(`Dell live API error for ${serviceTag}: ${err?.message}`);
    }

    return { found: false };
  }

  private expressCodeToServiceTag(expressCode: string): string {
    const num = BigInt(expressCode);
    return num.toString(36).toUpperCase().padStart(7, '0');
  }

  /* -------------------------------------------------------------------------- */
  /*                       UNIVERSAL LIVE BARCODE ADAPTER                       */
  /* -------------------------------------------------------------------------- */

  private async lookupUniversalBarcodeLive(barcode: string): Promise<DeviceLookupResult> {
    try {
      const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
      const jsonStr = await this.fetchText(url, 3500);
      const data = JSON.parse(jsonStr);

      if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        const item = data.items[0];
        const title = item.title || item.description || '';
        const brand = item.brand || this.extractBrand(title) || 'Generic';

        let model = title
          .replace(new RegExp(`^${brand}\\s*`, 'i'), '')
          .replace(/\b(Laptop|Notebook|PC|Computer)\b/gi, '')
          .trim();

        if (model.length > 50) {
          model = model.slice(0, 50).trim();
        }

        const specs = this.extractSpecs(title) || undefined;

        return {
          found: true,
          brand,
          model: model || `${brand} Device`,
          specs,
          deviceCategory: /Laptop|MacBook|Notebook/i.test(title) ? 'LAPTOP' : 'ACCESSORY',
          confidence: 'HIGH',
          source: 'UNIVERSAL_BARCODE_LIVE',
        };
      }
    } catch (err) {
      this.logger.debug(`Universal live barcode error for ${barcode}: ${err?.message}`);
    }

    return { found: false };
  }

  /* -------------------------------------------------------------------------- */
  /*                               HELPERS & UTILS                              */
  /* -------------------------------------------------------------------------- */

  private extractBrand(text: string): string | null {
    const brands = ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Toshiba', 'MSI', 'Samsung', 'Huawei', 'Razer', 'Oraimo', 'Anker', 'Baseus'];
    for (const b of brands) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(text)) {
        return b;
      }
    }
    return null;
  }

  private extractSpecs(text: string): string | null {
    const ramMatch = text.match(/(\d{1,2}\s*GB)\s*(RAM|Memory|DDR\d)?/i);
    const ssdMatch = text.match(/(\d{3,4}\s*GB|\d\s*TB)\s*(SSD|NVMe|PCIe|Storage|Hard Drive)?/i);
    if (ramMatch && ssdMatch) {
      return `${ramMatch[1].replace(/\s+/g, '')} RAM / ${ssdMatch[1].replace(/\s+/g, '')} SSD`;
    }
    return null;
  }

  private fetchText(url: string, timeoutMs: number = 3500): Promise<string> {
    return new Promise((resolve, reject) => {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
      };

      const req = https.get(url, { headers, timeout: timeoutMs }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith('http')) {
            const parsed = new URL(url);
            redirectUrl = `${parsed.origin}${redirectUrl.startsWith('/') ? '' : '/'}${redirectUrl}`;
          }
          return this.fetchText(redirectUrl, timeoutMs).then(resolve).catch(reject);
        }

        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve(raw));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.on('error', reject);
    });
  }
}
