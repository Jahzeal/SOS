import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DeviceHardwareProfile {
  isValidImei: boolean;
  tac: string;
  brand: string | null;
  model: string | null;
  hardwareVariant: string | null;
  defaultCarrierStatus: 'UNLOCKED' | 'CARRIER_LOCKED';
  likelyCarrier: string | null;
  defaultActivationStatus: 'READY_FOR_SETUP' | 'ACTIVATED' | 'NOT_ACTIVATED';
}

@Injectable()
export class DeviceIntelligenceService {
  constructor(private prisma: PrismaService) {}

  // Luhn Algorithm check for 15-digit IMEI
  validateLuhn(imei: string): boolean {
    const clean = imei.replace(/\D/g, '');
    if (clean.length !== 15) return false;

    let sum = 0;
    for (let i = 0; i < 15; i++) {
      let digit = parseInt(clean[i], 10);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  }

  // Parse TAC (Type Allocation Code - first 8 digits of IMEI)
  parseTac(imei: string): DeviceHardwareProfile {
    const clean = imei.replace(/\D/g, '');
    const isValid = clean.length === 15 ? this.validateLuhn(clean) : false;
    const tac = clean.slice(0, 8);

    // Well-known TAC patterns for modern devices
    let brand: string | null = null;
    let model: string | null = null;
    let hardwareVariant: string | null = null;
    let defaultCarrierStatus: 'UNLOCKED' | 'CARRIER_LOCKED' = 'UNLOCKED';
    let likelyCarrier: string | null = null;
    let defaultActivationStatus: 'READY_FOR_SETUP' | 'ACTIVATED' | 'NOT_ACTIVATED' = 'ACTIVATED';

    if (tac.startsWith('35')) {
      // Apple / Standard GSM range
      if (['35687910', '35687911', '35687912', '35687913'].includes(tac) || tac.startsWith('3568')) {
        brand = 'Apple';
        model = 'iPhone 14 Pro Max';
        hardwareVariant = 'Global Dual-eSIM / Nano-SIM';
      } else if (tac.startsWith('3520') || tac.startsWith('3530')) {
        brand = 'Apple';
        model = 'iPhone 13 / 13 Pro';
        hardwareVariant = 'Global Model';
      } else if (tac.startsWith('3540') || tac.startsWith('3550')) {
        brand = 'Apple';
        model = 'iPhone 15 / 15 Pro Max';
        hardwareVariant = 'Global Model (USB-C)';
      } else if (tac.startsWith('3580') || tac.startsWith('3590')) {
        brand = 'Samsung';
        model = 'Galaxy S23 / S24 Series';
        hardwareVariant = 'Global 5G Model';
      } else {
        brand = 'Apple';
        model = 'iPhone (GSM / Global Model)';
        hardwareVariant = 'Factory Unlocked Global Variant';
      }
    } else if (tac.startsWith('86') || tac.startsWith('87')) {
      // Asian / Transsion / Xiaomi / BBK range
      if (tac.startsWith('8640') || tac.startsWith('8650')) {
        brand = 'Tecno / Infinix';
        model = 'Camon / Note Series';
        hardwareVariant = 'Dual Nano-SIM (Unlocked)';
      } else if (tac.startsWith('8680') || tac.startsWith('8690')) {
        brand = 'Xiaomi';
        model = 'Redmi / Xiaomi Series';
        hardwareVariant = 'Global Dual-SIM (Unlocked)';
      } else {
        brand = 'Android Device';
        model = 'Global Multi-SIM Smartphone';
        hardwareVariant = 'Factory Unlocked';
      }
    } else if (tac.startsWith('99')) {
      // US CDMA / Carrier Specific (Verizon / Sprint / AT&T)
      brand = 'Smartphone';
      model = 'North American Carrier Model';
      hardwareVariant = 'US Carrier Allocated Variant';
      defaultCarrierStatus = 'CARRIER_LOCKED';
      likelyCarrier = 'US Carrier Network';
    }

    return {
      isValidImei: isValid,
      tac,
      brand,
      model,
      hardwareVariant,
      defaultCarrierStatus,
      likelyCarrier,
      defaultActivationStatus,
    };
  }

  // Check or retrieve cached device profile
  async getDeviceProfile(imei: string) {
    const clean = imei.replace(/\D/g, '');
    if (!clean) return null;

    // Check DB cache first
    const cached = await this.prisma.deviceCheckCache.findUnique({
      where: { imei: clean },
    }).catch(() => null);

    if (cached) {
      return {
        brand: cached.brand,
        model: cached.model,
        carrierStatus: cached.carrierStatus,
        lockedCarrier: cached.lockedCarrier,
        activationStatus: cached.activationStatus,
        source: cached.source,
      };
    }

    // Offline TAC parsing
    const tacInfo = this.parseTac(clean);

    // Save to cache asynchronously
    this.prisma.deviceCheckCache.create({
      data: {
        imei: clean,
        brand: tacInfo.brand,
        model: tacInfo.model,
        carrierStatus: tacInfo.defaultCarrierStatus,
        lockedCarrier: tacInfo.likelyCarrier,
        activationStatus: tacInfo.defaultActivationStatus,
        source: 'TAC_PARSER',
      },
    }).catch(() => {});

    return {
      brand: tacInfo.brand,
      model: tacInfo.model,
      carrierStatus: tacInfo.defaultCarrierStatus,
      lockedCarrier: tacInfo.likelyCarrier,
      activationStatus: tacInfo.defaultActivationStatus,
      source: 'TAC_PARSER',
    };
  }
}
