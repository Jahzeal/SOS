import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DeviceCategory, DeviceSource, PaymentMethod, PhoneStatus, Prisma, TradeInKind, TradeInStatus } from '@prisma/client';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { SalesService } from '../sales/sales.service';
import { SubscriptionService } from '../common/services/subscription.service';
import { requestContext } from '../common/staff/request-context';
import { frontendUrl } from '../common/config/env';
import { CreateTradeInDto, IncomingDeviceDto } from './dto/create-trade-in.dto';

export interface Viewer {
  id: string;
  businessId: string;
  storeRole?: string | null;
}

/** Statuses that mean the device is with the store right now, so it cannot be taken in again. */
const IN_STORE: PhoneStatus[] = [PhoneStatus.IN_STOCK, PhoneStatus.RESERVED, PhoneStatus.IN_REPAIR];

const STOLEN_MESSAGE =
  'This device is reported STOLEN on NoxGuarda. Do not accept it. The attempt has been recorded for the store owner.';

/** Owners and managers see costs and every swap in their scope; sales staff see their own. */
function seesEverything(viewer: Viewer) {
  const role = String(viewer.storeRole || 'OWNER').toUpperCase();
  return role === 'OWNER' || role === 'MANAGER';
}

function clean(v?: string | null) {
  const t = (v || '').trim();
  return t || null;
}

function identifiersOf(d: { imei1?: string | null; imei2?: string | null; serialNumber?: string | null }) {
  return [d.imei1, d.imei2, d.serialNumber].map(clean).filter((x): x is string => !!x);
}

@Injectable()
export class TradeInsService {
  constructor(
    private prisma: PrismaService,
    private sales: SalesService,
    private subscriptions: SubscriptionService,
  ) {}

  // ---------------------------------------------------------------------------
  // Checks
  // ---------------------------------------------------------------------------

  /** Is any of these identifiers in an active stolen report, or flagged stolen by a store? */
  private async findStolen(ids: string[]) {
    if (ids.length === 0) return null;
    const report = await this.prisma.theftReport.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { imei1: { in: ids } },
          { imei2: { in: ids } },
          ...ids.map((id) => ({ serialNumber: { equals: id, mode: 'insensitive' as const } })),
        ],
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    if (report) return { since: report.createdAt };

    const flagged = await requestContext.outside(() =>
      this.prisma.phoneRecord.findFirst({
        where: {
          isStolen: true,
          OR: [{ imei1: { in: ids } }, { imei2: { in: ids } }, { serialNumber: { in: ids } }],
        },
        select: { stolenAt: true, updatedAt: true },
      }),
    );
    return flagged ? { since: flagged.stolenAt || flagged.updatedAt } : null;
  }

  /** This store's own record of the device, in any branch. */
  private findOwn(businessId: string, ids: string[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return requestContext.storeWide(() =>
      this.prisma.phoneRecord.findFirst({
        where: {
          businessId,
          OR: [{ imei1: { in: ids } }, { imei2: { in: ids } }, { serialNumber: { in: ids } }],
        },
        select: { id: true, status: true, brand: true, model: true, storageCapacity: true, color: true, deviceCategory: true },
      }),
    );
  }

  /** Another store that has the device on record. Only the store name and date are shown. */
  private async findOtherStore(businessId: string, ids: string[]) {
    if (ids.length === 0) return null;
    const other = await requestContext.outside(() =>
      this.prisma.phoneRecord.findFirst({
        where: {
          businessId: { not: businessId },
          OR: [{ imei1: { in: ids } }, { imei2: { in: ids } }, { serialNumber: { in: ids } }],
        },
        select: { createdAt: true, business: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    );
    return other ? { name: other.business?.name || 'Another store', since: other.createdAt } : null;
  }

  /** Keeps a record of an attempt to swap in a stolen device (once per device per day). */
  private async recordBlocked(
    businessId: string,
    userId: string,
    d: Partial<IncomingDeviceDto> & { imei1?: string | null; serialNumber?: string | null },
    customer?: { name?: string | null; phone?: string | null },
  ) {
    const ids = identifiersOf(d);
    if (ids.length === 0) return;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await this.prisma.tradeIn.findFirst({
      where: {
        businessId,
        status: TradeInStatus.BLOCKED,
        createdAt: { gte: since },
        OR: [{ imei1: { in: ids } }, { serialNumber: { in: ids } }],
      },
      select: { id: true },
    });
    if (existing) {
      if (customer?.name || customer?.phone) {
        await this.prisma.tradeIn.update({
          where: { id: existing.id },
          data: { customerName: clean(customer.name) ?? undefined, customerPhone: clean(customer.phone) ?? undefined },
        });
      }
      return;
    }
    await this.prisma.tradeIn.create({
      data: {
        businessId,
        kind: TradeInKind.SWAP,
        status: TradeInStatus.BLOCKED,
        deviceCategory: d.category === 'LAPTOP' ? DeviceCategory.LAPTOP : DeviceCategory.PHONE,
        imei1: clean(d.imei1),
        imei2: clean(d.imei2),
        serialNumber: clean(d.serialNumber),
        brand: clean(d.brand),
        model: clean(d.model),
        customerName: clean(customer?.name),
        customerPhone: clean(customer?.phone),
        blockedReason: 'Reported stolen',
        createdById: userId,
      },
    });
  }

  /**
   * Runs as soon as staff type or scan the IMEI / serial, before anything is saved.
   */
  async check(businessId: string, userId: string, identifier: string, category: 'PHONE' | 'LAPTOP') {
    const id = clean(identifier);
    if (!id || id.length < 4) throw new BadRequestException('Enter the IMEI or serial number.');
    const ids = [id];

    const [stolen, own, otherStore] = await Promise.all([
      this.findStolen(ids),
      this.findOwn(businessId, ids),
      this.findOtherStore(businessId, ids),
    ]);

    if (stolen) {
      await this.recordBlocked(businessId, userId, {
        category,
        imei1: category === 'PHONE' ? id : null,
        serialNumber: category === 'LAPTOP' ? id : null,
      });
    }

    return {
      identifier: id,
      stolen: !!stolen,
      stolenSince: stolen?.since ?? null,
      // Already with the store (in stock, reserved or in repair): it cannot be taken in again.
      alreadyInStock: !!own && IN_STORE.includes(own.status),
      // Sold by this store before and now coming back.
      soldByUsBefore: !!own && !IN_STORE.includes(own.status),
      ownDevice: own
        ? { brand: own.brand, model: own.model, storageCapacity: own.storageCapacity, color: own.color, status: own.status }
        : null,
      otherStore,
    };
  }

  // ---------------------------------------------------------------------------
  // Recording a swap or a purchase
  // ---------------------------------------------------------------------------

  async create(businessId: string, userId: string, dto: CreateTradeInDto) {
    const d = dto.incoming;
    const isLaptop = d.category === 'LAPTOP';

    const imei1 = clean(d.imei1)?.replace(/\s/g, '') || null;
    const imei2 = clean(d.imei2)?.replace(/\s/g, '') || null;
    const serialNumber = clean(d.serialNumber);

    if (!isLaptop && !imei1) throw new BadRequestException('Enter the IMEI of the phone the customer is giving you.');
    if (!isLaptop && imei1 && !/^\d{15}$/.test(imei1)) {
      throw new BadRequestException('A phone IMEI is 15 digits. Check the number and try again.');
    }
    if (isLaptop && !serialNumber) throw new BadRequestException('Enter the serial number of the laptop the customer is giving you.');
    if (!dto.ownershipConfirmed) {
      throw new BadRequestException('The customer must confirm the device is theirs before you take it in.');
    }

    const ids = identifiersOf({ imei1, imei2, serialNumber });
    const customerName = dto.customerName.trim();
    const customerPhone = dto.customerPhone.trim();

    if (await this.findStolen(ids)) {
      await this.recordBlocked(businessId, userId, { ...d, imei1, imei2, serialNumber }, { name: customerName, phone: customerPhone });
      throw new ConflictException(STOLEN_MESSAGE);
    }

    const own = await this.findOwn(businessId, ids);
    if (own && IN_STORE.includes(own.status)) {
      throw new ConflictException(`This ${own.brand} ${own.model} is already in your stock, so it cannot be taken in again.`);
    }
    if (!own) await this.subscriptions.assertCanAddDevice(businessId);

    const items = dto.items || [];
    if (items.some((i) => i.phoneRecordId && own && i.phoneRecordId === own.id)) {
      throw new BadRequestException('The device going out cannot be the same as the device coming in.');
    }

    const tradeInValue = Math.round(Number(d.tradeInValue) * 100) / 100;
    const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);
    const balance = subtotal - tradeInValue; // > 0 customer pays, < 0 store pays
    const kind = items.length > 0 ? TradeInKind.SWAP : TradeInKind.BUY;
    if (kind === TradeInKind.BUY && tradeInValue <= 0) {
      throw new BadRequestException('Enter how much you are paying the customer for the device.');
    }

    // The QR code is made before the transaction so the transaction stays short.
    const primaryId = isLaptop ? (imei1 || serialNumber)! : imei1!;
    const qrCodeUrl = await QRCode.toDataURL(`${frontendUrl()}/verify?imei=${encodeURIComponent(primaryId)}`).catch(() => null);

    let tradeInId = '';
    const takeIn = async (tx: Prisma.TransactionClient, saleId: string | null, saleCustomerId: string | null) => {
      let customerId = saleCustomerId;
      if (!customerId) {
        const existing = await tx.customer.findFirst({ where: { businessId, phone: customerPhone } });
        customerId = existing
          ? existing.id
          : (await tx.customer.create({
              data: { businessId, name: customerName, phone: customerPhone, email: clean(dto.customerEmail) },
            })).id;
      }

      const deviceData = {
        brand: d.brand.trim(),
        model: d.model.trim(),
        storageCapacity: clean(d.storageCapacity),
        color: clean(d.color),
        condition: d.condition,
        status: PhoneStatus.IN_STOCK,
        source: DeviceSource.TRADE_IN,
        purchasePrice: tradeInValue,
        isStolen: false,
        customerId: null,
        registeredById: userId,
      };

      let phoneRecordId: string;
      if (own) {
        // A device this store sold before is coming back: reuse its record and history.
        const ctx = requestContext.get();
        const updated = await tx.phoneRecord.update({
          where: { id: own.id },
          data: { ...deviceData, branchId: ctx?.writeBranchId ?? undefined },
        });
        phoneRecordId = updated.id;
      } else {
        const created = await tx.phoneRecord.create({
          data: {
            businessId,
            imei1: primaryId,
            imei2: isLaptop ? null : imei2,
            serialNumber,
            deviceCategory: isLaptop ? DeviceCategory.LAPTOP : DeviceCategory.PHONE,
            qrCodeUrl,
            ...deviceData,
          },
        });
        phoneRecordId = created.id;
      }

      const tradeIn = await tx.tradeIn.create({
        data: {
          businessId,
          kind,
          status: TradeInStatus.COMPLETED,
          saleId,
          phoneRecordId,
          customerId,
          deviceCategory: isLaptop ? DeviceCategory.LAPTOP : DeviceCategory.PHONE,
          imei1: isLaptop ? imei1 : primaryId,
          imei2: isLaptop ? null : imei2,
          serialNumber,
          brand: d.brand.trim(),
          model: d.model.trim(),
          condition: d.condition,
          customerName,
          customerPhone,
          idType: clean(dto.idType),
          idNumber: clean(dto.idNumber),
          ownershipConfirmed: true,
          tradeInValue,
          balance,
          paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
          createdById: userId,
        },
      });
      tradeInId = tradeIn.id;
    };

    let sale: any = null;
    try {
      if (kind === TradeInKind.SWAP) {
        sale = await this.sales.checkout(
          businessId,
          userId,
          {
            customerName,
            customerPhone,
            customerEmail: dto.customerEmail,
            paymentMethod: dto.paymentMethod,
            paymentStatus: 'PAID',
            type: 'RECEIPT',
            items,
          },
          { tradeInCredit: tradeInValue, inTransaction: (tx, s) => takeIn(tx, s.id, s.customerId) },
        );
      } else {
        await this.prisma.$transaction((tx) => takeIn(tx, null, null), { timeout: 20000 });
      }
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('A device with this IMEI or serial number is already registered in your store.');
      }
      throw err;
    }

    const tradeIn = await this.prisma.tradeIn.findFirst({ where: { id: tradeInId, businessId } });
    return { tradeIn, sale };
  }

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------

  private scope(viewer: Viewer): Prisma.TradeInWhereInput {
    const where: Prisma.TradeInWhereInput = { businessId: viewer.businessId };
    if (!seesEverything(viewer)) where.createdById = viewer.id;
    return where;
  }

  async list(viewer: Viewer, q: { filter?: string; search?: string }) {
    const base = this.scope(viewer);
    const where: Prisma.TradeInWhereInput = { ...base };

    const filter = String(q.filter || 'ALL').toUpperCase();
    if (filter === 'SWAP') Object.assign(where, { kind: TradeInKind.SWAP, status: TradeInStatus.COMPLETED });
    else if (filter === 'BUY') Object.assign(where, { kind: TradeInKind.BUY, status: TradeInStatus.COMPLETED });
    else if (filter === 'BLOCKED') where.status = TradeInStatus.BLOCKED;

    const search = clean(q.search);
    if (search) {
      where.OR = ['imei1', 'imei2', 'serialNumber', 'brand', 'model', 'customerName', 'customerPhone'].map((f) => ({
        [f]: { contains: search, mode: 'insensitive' },
      }));
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [rows, monthDone, monthBlocked] = await Promise.all([
      this.prisma.tradeIn.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 300,
        include: {
          phoneRecord: { select: { id: true, status: true } },
          sale: { select: { id: true, receiptNumber: true, invoiceNumber: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          branch: { select: { name: true } },
        },
      }),
      this.prisma.tradeIn.aggregate({
        where: { ...base, status: TradeInStatus.COMPLETED, createdAt: { gte: monthStart } },
        _count: { _all: true },
        _sum: { tradeInValue: true },
      }),
      this.prisma.tradeIn.count({ where: { ...base, status: TradeInStatus.BLOCKED, createdAt: { gte: monthStart } } }),
    ]);

    return {
      summary: {
        count: monthDone._count._all,
        totalValue: monthDone._sum.tradeInValue || 0,
        blocked: monthBlocked,
      },
      tradeIns: rows,
    };
  }

  async findOne(viewer: Viewer, id: string) {
    const tradeIn = await this.prisma.tradeIn.findFirst({
      where: { ...this.scope(viewer), id },
      include: {
        phoneRecord: {
          select: {
            id: true, status: true, brand: true, model: true, storageCapacity: true, color: true,
            imei1: true, imei2: true, serialNumber: true, sellingPrice: true, purchasePrice: true,
          },
        },
        sale: {
          select: {
            id: true, receiptNumber: true, invoiceNumber: true, totalAmount: true, tradeInCredit: true, createdAt: true,
            items: { select: { description: true, unitPrice: true, quantity: true, totalPrice: true } },
          },
        },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    });
    if (!tradeIn) throw new NotFoundException('Swap record not found.');

    // If the device has since been sold again, show who bought it and (for owners/managers) the profit.
    let resold: any = null;
    if (tradeIn.phoneRecordId) {
      const item = await requestContext.storeWide(() =>
        this.prisma.saleItem.findFirst({
          where: { phoneRecordId: tradeIn.phoneRecordId!, sale: { businessId: viewer.businessId, createdAt: { gt: tradeIn.createdAt } } },
          orderBy: { sale: { createdAt: 'desc' } },
          select: {
            totalPrice: true,
            sale: { select: { id: true, receiptNumber: true, createdAt: true, customer: { select: { name: true } } } },
          },
        }),
      );
      if (item) {
        resold = {
          saleId: item.sale.id,
          receiptNumber: item.sale.receiptNumber,
          date: item.sale.createdAt,
          customerName: item.sale.customer?.name || null,
          price: item.totalPrice,
          profit: seesEverything(viewer) ? item.totalPrice - tradeIn.tradeInValue : undefined,
        };
      }
    }

    if (!seesEverything(viewer) && tradeIn.phoneRecord) {
      (tradeIn.phoneRecord as any).purchasePrice = undefined;
    }

    return { ...tradeIn, resold };
  }
}
