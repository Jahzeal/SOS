import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DeviceHardwareProfile {
  isValidImei: boolean;
  tac: string;
  brand: string | null;
  model: string | null;
  hardwareVariant: string | null;
  defaultCarrierStatus: 'UNLOCKED' | 'CARRIER_LOCKED' | null;
  likelyCarrier: string | null;
  defaultActivationStatus: 'READY_FOR_SETUP' | 'ACTIVATED' | 'NOT_ACTIVATED' | null;
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

    // The leading digits of an IMEI do not reliably say which brand made the phone,
    // or whether it is locked or activated, so none of that is guessed here.
    return {
      isValidImei: isValid,
      tac,
      brand: null,
      model: null,
      hardwareVariant: null,
      defaultCarrierStatus: null,
      likelyCarrier: null,
      defaultActivationStatus: null,
    };
  }
}
