import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TacSuggestion {
  brand: string;
  model: string;
  /** How many registered phones agree on this brand and model. */
  matchingRecords: number;
  /** How many different stores those phones belong to. */
  matchingStores: number;
  confidence: 'high' | 'medium';
}

/** Standard check-digit test for a 15-digit IMEI. */
export function isValidImei(value: string): boolean {
  const clean = String(value || '').replace(/[\s-]/g, '');
  if (!/^\d{15}$/.test(clean) || /^(\d)\1{14}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = clean.charCodeAt(i) - 48;
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// Placeholder text the old guessing code used to put into Brand / Model. Records
// holding these say nothing about the real phone, so they are never learned from.
const PLACEHOLDER_BRANDS = new Set([
  'gsm smartphone',
  'generic smartphone',
  'android device',
  'android smartphone',
  'smartphone',
  'smartphone device',
  'hardware device',
  'tecno / infinix',
  'xiaomi / redmi',
]);
const PLACEHOLDER_MODELS = new Set([
  'gsm lte / 5g mobile device',
  '4g/5g lte smartphone',
  'global smartphone',
  'global mobile device',
  'global multi-sim smartphone',
  'mobile / pc device',
  'iphone (global model)',
  'iphone / gsm device',
  'iphone (gsm / global model)',
  'iphone (gsm / global edition)',
  // the ten unverified entries the old lookup table carried
  'iphone 13 pro max (a2484 / a2643)',
  'iphone 12 pro (a2341 / a2407)',
  'iphone 14 pro (a2650 / a2889)',
  'iphone 15 pro max (a2849 / a3106)',
  'galaxy s23 ultra (sm-s918b/ds)',
  'galaxy s22 ultra (sm-s908b)',
  'galaxy s21 5g (sm-g991b)',
  'pixel 7 pro (ge2ae / gp4bc)',
  'pixel 8 pro (gc3ve / g1mnw)',
  '13 pro (2210132g)',
]);

const norm = (value: string) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Names a phone from its IMEI using only what stores have already recorded.
 *
 * The first 8 digits of an IMEI (the TAC) are the same for every phone of one
 * model. So if phones with the same first 8 digits were registered before, their
 * brand and model can be suggested. Nothing is ever guessed: with no agreeing
 * records the answer is "not known".
 */
@Injectable()
export class TacSuggestionService {
  constructor(private readonly prisma: PrismaService) {}

  async suggest(imei: string): Promise<TacSuggestion | null> {
    const clean = String(imei || '').replace(/[\s-]/g, '');
    if (!isValidImei(clean)) return null;
    const tac = clean.slice(0, 8);

    const records = await this.prisma.phoneRecord.findMany({
      where: {
        deviceCategory: 'PHONE',
        OR: [{ imei1: { startsWith: tac } }, { imei2: { startsWith: tac } }],
      },
      select: {
        imei1: true,
        imei2: true,
        brand: true,
        model: true,
        businessId: true,
        business: { select: { plan: true, subscriptionStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    type Group = { brand: string; model: string; count: number; stores: Set<string>; paidStore: boolean };
    const groups = new Map<string, Group>();
    let usable = 0;

    for (const r of records) {
      // Only real 15-digit IMEIs count (not SKUs or serials that happen to start the same).
      const ownImei = [r.imei1, r.imei2].find((v) => v && v.startsWith(tac) && /^\d{15}$/.test(v));
      if (!ownImei) continue;
      const brandKey = norm(r.brand);
      const modelKey = norm(r.model);
      if (!brandKey || !modelKey) continue;
      if (PLACEHOLDER_BRANDS.has(brandKey) || PLACEHOLDER_MODELS.has(modelKey)) continue;

      usable++;
      const key = `${brandKey}|${modelKey}`;
      const group =
        groups.get(key) ||
        ({ brand: r.brand.trim(), model: r.model.trim(), count: 0, stores: new Set<string>(), paidStore: false } as Group);
      group.count++;
      group.stores.add(r.businessId);
      if (r.business?.subscriptionStatus === 'ACTIVE' && String(r.business?.plan || '').toUpperCase() !== 'FREE') {
        group.paidStore = true;
      }
      groups.set(key, group);
    }

    if (!usable) return null;
    const best = [...groups.values()].sort((a, b) => b.count - a.count)[0];

    // One seller's typo must not spread: at least two records must agree (or the
    // single record must come from a paying store), and they must be the clear majority.
    const enoughAgreement = best.count >= 2 || best.paidStore;
    const clearMajority = best.count / usable >= 0.6;
    if (!enoughAgreement || !clearMajority) return null;

    return {
      brand: best.brand,
      model: best.model,
      matchingRecords: best.count,
      matchingStores: best.stores.size,
      confidence: best.count >= 3 && best.stores.size >= 2 ? 'high' : 'medium',
    };
  }
}
