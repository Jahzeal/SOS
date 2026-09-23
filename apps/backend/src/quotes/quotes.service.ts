import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteStatus, PhoneStatus, PaymentMethod } from '@prisma/client';
import { generateQuotePdfBuffer } from './quote-pdf.generator';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(businessId: string, userId: string, dto: CreateQuoteDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required to create a quotation.');
    }

    // 1. Validate device records if any are specified
    const deviceItemIds = dto.items
      .filter((i) => i.phoneRecordId)
      .map((i) => i.phoneRecordId as string);

    let phones: any[] = [];
    if (deviceItemIds.length > 0) {
      phones = await this.prisma.phoneRecord.findMany({
        where: {
          id: { in: deviceItemIds },
          businessId,
        },
      });

      if (phones.length !== deviceItemIds.length) {
        throw new NotFoundException('One or more selected devices were not found in store inventory.');
      }
    }

    // 2. Link or Create Customer
    let customerId = dto.customerId;
    if (!customerId && (dto.customerPhone || dto.customerName || dto.customerEmail)) {
      let customer = dto.customerPhone
        ? await this.prisma.customer.findFirst({
            where: {
              businessId,
              phone: dto.customerPhone.trim(),
            },
          })
        : null;

      if (!customer && (dto.customerPhone || dto.customerName)) {
        customer = await this.prisma.customer.create({
          data: {
            businessId,
            name: dto.customerName?.trim() || 'Valued Client',
            phone: dto.customerPhone?.trim() || 'N/A',
            email: dto.customerEmail?.trim(),
            address: dto.billingAddress?.trim(),
          },
        });
      }
      customerId = customer?.id;
    }

    // 3. Compute Totals
    const subtotal = dto.items.reduce((sum, item) => {
      const lineTotal = item.unitPrice * (item.quantity || 1);
      const discountAmount = item.discount ? (lineTotal * item.discount) / 100 : 0;
      return sum + (lineTotal - discountAmount);
    }, 0);

    const globalDiscount = dto.discount || 0;
    const discountedSubtotal = Math.max(0, subtotal - globalDiscount);
    const taxRate = dto.taxRate || 0;
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const totalAmount = discountedSubtotal + taxAmount;

    // 4. Generate Quote Number
    const count = await this.prisma.quote.count({ where: { businessId } });
    const year = new Date().getFullYear();
    const quoteNumber = `QT-${year}-${String(count + 1).padStart(4, '0')}`;

    // 5. Fetch Business Defaults for terms/notes if not provided
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        quoteTitle: true,
        quoteTerms: true,
        quoteNotes: true,
        quoteValidityDays: true,
      },
    });

    const quoteDate = dto.quoteDate ? new Date(dto.quoteDate) : new Date();
    let expiryDate: Date | null = null;
    if (dto.expiryDate) {
      expiryDate = new Date(dto.expiryDate);
    } else {
      const validityDays = business?.quoteValidityDays || 14;
      expiryDate = new Date(quoteDate);
      expiryDate.setDate(expiryDate.getDate() + validityDays);
    }

    return this.prisma.quote.create({
      data: {
        quoteNumber,
        businessId,
        customerId,
        createdById: userId,
        quoteDate,
        expiryDate,
        subject: dto.subject?.trim() || null,
        subtotal,
        discount: globalDiscount,
        taxRate,
        taxAmount,
        totalAmount,
        status: dto.status || QuoteStatus.DRAFT,
        notes: dto.notes?.trim() || business?.quoteNotes || null,
        terms: dto.terms?.trim() || business?.quoteTerms || null,
        items: {
          create: dto.items.map((item) => {
            const phone = item.phoneRecordId ? phones.find((p) => p.id === item.phoneRecordId) : null;
            const lineTotal = item.unitPrice * (item.quantity || 1);
            const discAmount = item.discount ? (lineTotal * item.discount) / 100 : 0;
            const totalPrice = lineTotal - discAmount;

            return {
              phoneRecordId: item.phoneRecordId || null,
              description:
                item.description ||
                (phone ? `${phone.brand} ${phone.model} (${phone.storageCapacity || ''} ${phone.color || ''})` : 'Product / Service'),
              unitPrice: item.unitPrice,
              quantity: item.quantity || 1,
              discount: item.discount || 0,
              totalPrice,
            };
          }),
        },
      },
      include: {
        customer: true,
        business: true,
        items: {
          include: {
            phoneRecord: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(businessId: string, search?: string, status?: string) {
    const where: any = { businessId };

    if (status && status !== 'ALL') {
      where.status = status as QuoteStatus;
    }

    if (search) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { quoteNumber: { contains: q, mode: 'insensitive' } },
            { subject: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
            { customer: { phone: { contains: q, mode: 'insensitive' } } },
            { customer: { email: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    return this.prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: {
          include: {
            phoneRecord: true,
          },
        },
        convertedSale: {
          select: {
            id: true,
            invoiceNumber: true,
            receiptNumber: true,
          },
        },
      },
    });
  }

  async findOne(businessId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        business: true,
        items: {
          include: {
            phoneRecord: true,
          },
        },
        convertedSale: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quotation not found with ID ${id}`);
    }

    return quote;
  }

  async update(businessId: string, id: string, dto: UpdateQuoteDto) {
    const existing = await this.findOne(businessId, id);

    if (existing.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException('Cannot modify a quotation that has already been converted into a sale/invoice.');
    }

    let customerId = dto.customerId !== undefined ? dto.customerId : existing.customerId;
    if (!customerId && (dto.customerPhone || dto.customerName || dto.customerEmail)) {
      let customer = dto.customerPhone
        ? await this.prisma.customer.findFirst({
            where: {
              businessId,
              phone: dto.customerPhone.trim(),
            },
          })
        : null;

      if (!customer && (dto.customerPhone || dto.customerName)) {
        customer = await this.prisma.customer.create({
          data: {
            businessId,
            name: dto.customerName?.trim() || 'Valued Client',
            phone: dto.customerPhone?.trim() || 'N/A',
            email: dto.customerEmail?.trim(),
            address: dto.billingAddress?.trim(),
          },
        });
      }
      customerId = customer?.id;
    }

    // Recompute items if provided
    let itemsUpdate: any = undefined;
    let subtotal = existing.subtotal;
    let totalAmount = existing.totalAmount;
    let globalDiscount = dto.discount !== undefined ? dto.discount : existing.discount;
    let taxRate = dto.taxRate !== undefined ? dto.taxRate : existing.taxRate;
    let taxAmount = existing.taxAmount;

    if (dto.items && dto.items.length > 0) {
      subtotal = dto.items.reduce((sum, item) => {
        const lineTotal = item.unitPrice * (item.quantity || 1);
        const disc = item.discount ? (lineTotal * item.discount) / 100 : 0;
        return sum + (lineTotal - disc);
      }, 0);

      const discountedSubtotal = Math.max(0, subtotal - globalDiscount);
      taxAmount = (discountedSubtotal * taxRate) / 100;
      totalAmount = discountedSubtotal + taxAmount;

      itemsUpdate = {
        deleteMany: {},
        create: dto.items.map((item) => {
          const lineTotal = item.unitPrice * (item.quantity || 1);
          const disc = item.discount ? (lineTotal * item.discount) / 100 : 0;
          return {
            phoneRecordId: item.phoneRecordId || null,
            description: item.description,
            unitPrice: item.unitPrice,
            quantity: item.quantity || 1,
            discount: item.discount || 0,
            totalPrice: lineTotal - disc,
          };
        }),
      };
    } else if (dto.discount !== undefined || dto.taxRate !== undefined) {
      const discountedSubtotal = Math.max(0, subtotal - globalDiscount);
      taxAmount = (discountedSubtotal * taxRate) / 100;
      totalAmount = discountedSubtotal + taxAmount;
    }

    return this.prisma.quote.update({
      where: { id },
      data: {
        customerId,
        subject: dto.subject !== undefined ? dto.subject?.trim() || null : undefined,
        quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        subtotal,
        discount: globalDiscount,
        taxRate,
        taxAmount,
        totalAmount,
        status: dto.status,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
        terms: dto.terms !== undefined ? dto.terms?.trim() || null : undefined,
        items: itemsUpdate,
      },
      include: {
        customer: true,
        business: true,
        items: {
          include: {
            phoneRecord: true,
          },
        },
      },
    });
  }

  async delete(businessId: string, id: string) {
    const quote = await this.findOne(businessId, id);
    if (quote.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException('Cannot delete a quotation that was converted to a sale.');
    }
    return this.prisma.quote.delete({ where: { id } });
  }

  async getStats(businessId: string) {
    const quotes = await this.prisma.quote.findMany({
      where: { businessId },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        expiryDate: true,
      },
    });

    const now = new Date();
    let totalQuotedAmount = 0;
    let acceptedAmount = 0;
    let convertedCount = 0;
    let activeCount = 0;
    let acceptedCount = 0;

    quotes.forEach((q) => {
      totalQuotedAmount += q.totalAmount;
      if (q.status === QuoteStatus.ACCEPTED || q.status === QuoteStatus.CONVERTED) {
        acceptedAmount += q.totalAmount;
        acceptedCount++;
      }
      if (q.status === QuoteStatus.CONVERTED) {
        convertedCount++;
      }
      if (q.status === QuoteStatus.SENT || q.status === QuoteStatus.DRAFT) {
        if (!q.expiryDate || new Date(q.expiryDate) >= now) {
          activeCount++;
        }
      }
    });

    const totalQuotesCount = quotes.length;
    const conversionRate = totalQuotesCount > 0 ? (acceptedCount / totalQuotesCount) * 100 : 0;

    return {
      totalQuotesCount,
      totalQuotedAmount,
      acceptedAmount,
      acceptedCount,
      convertedCount,
      activeCount,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }

  async generatePdf(businessId: string, id: string): Promise<{ buffer: Buffer; filename: string }> {
    const quote = await this.findOne(businessId, id);

    const pdfBuffer = generateQuotePdfBuffer({
      quoteNumber: quote.quoteNumber,
      quoteTitle: quote.business.quoteTitle || 'PRICE QUOTATION',
      quoteDate: quote.quoteDate,
      expiryDate: quote.expiryDate,
      status: quote.status,
      subject: quote.subject,
      subtotal: quote.subtotal,
      discount: quote.discount,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      customerName: quote.customer?.name,
      customerEmail: quote.customer?.email,
      customerPhone: quote.customer?.phone,
      customerAddress: quote.customer?.address,
      storeName: quote.business.name,
      storeAddress: quote.business.address,
      storePhone: quote.business.phone,
      storeEmail: quote.business.email,
      logoUrl: quote.business.logoUrl,
      bankName: quote.business.bankName,
      accountNumber: quote.business.accountNumber,
      accountName: quote.business.accountName,
      notes: quote.notes,
      terms: quote.terms,
      accentColorHex: quote.business.quoteAccentColor || '#2563EB',
      showBankDetails: quote.business.quoteShowBankDetails ?? true,
      showSignature: quote.business.quoteShowSignature ?? true,
      items: quote.items.map((i) => ({
        description: i.description,
        imei: i.phoneRecord?.imei1 || null,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        totalPrice: i.totalPrice,
      })),
    });

    return {
      buffer: pdfBuffer,
      filename: `Quotation-${quote.quoteNumber}.pdf`,
    };
  }

  async sendQuoteEmail(businessId: string, id: string, overrideEmail?: string) {
    const quote = await this.findOne(businessId, id);
    const targetEmail = overrideEmail?.trim() || quote.customer?.email;

    if (!targetEmail) {
      throw new BadRequestException('No email address provided for customer.');
    }

    const { buffer } = await this.generatePdf(businessId, id);

    const expiryDateStr = quote.expiryDate
      ? new Date(quote.expiryDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : undefined;

    const res = await this.mailService.sendQuoteEmail({
      to: targetEmail,
      customerName: quote.customer?.name,
      storeName: quote.business.name,
      quoteNumber: quote.quoteNumber,
      quoteTitle: quote.business.quoteTitle || 'Price Quotation',
      totalAmount: quote.totalAmount,
      expiryDateStr,
      pdfBuffer: buffer,
    });

    // Update status to SENT if it was DRAFT
    if (quote.status === QuoteStatus.DRAFT) {
      await this.prisma.quote.update({
        where: { id },
        data: { status: QuoteStatus.SENT },
      });
    }

    return {
      success: res.success,
      messageId: res.messageId,
      sentTo: targetEmail,
    };
  }

  async convertToSale(
    businessId: string,
    userId: string,
    id: string,
    payload?: { paymentMethod?: PaymentMethod; notes?: string; asInvoice?: boolean },
  ) {
    const quote = await this.findOne(businessId, id);

    if (quote.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException('This quotation has already been converted into a sale.');
    }

    // Check availability of device items
    const deviceItemIds = quote.items
      .filter((i) => i.phoneRecordId)
      .map((i) => i.phoneRecordId as string);

    if (deviceItemIds.length > 0) {
      const soldDevice = await this.prisma.phoneRecord.findFirst({
        where: {
          id: { in: deviceItemIds },
          status: PhoneStatus.SOLD,
        },
      });

      if (soldDevice) {
        throw new BadRequestException(
          `Device ${soldDevice.brand} ${soldDevice.model} (IMEI: ${soldDevice.imei1}) has already been sold in another transaction.`,
        );
      }
    }

    const isInvoice = payload?.asInvoice !== false; // Default to Commercial Invoice
    const ref = Math.floor(100000 + Math.random() * 900000);
    const invoiceNumber = `VF-INV-${ref}`;
    const receiptNumber = isInvoice ? null : `VF-REC-${ref}`;

    let combinedNotes = payload?.notes || quote.notes || '';
    if (isInvoice) {
      const metaTags = [
        '[TYPE:INVOICE]',
        `[CONVERTED_FROM_QUOTE:${quote.quoteNumber}]`,
        quote.customer?.address ? `[ADDR:${quote.customer.address}]` : '',
      ]
        .filter(Boolean)
        .join(' ');
      combinedNotes = `${metaTags} ${combinedNotes}`.trim();
    } else {
      combinedNotes = `[CONVERTED_FROM_QUOTE:${quote.quoteNumber}] ${combinedNotes}`.trim();
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const newSale = await tx.sale.create({
        data: {
          businessId,
          customerId: quote.customerId,
          soldById: userId,
          invoiceNumber,
          receiptNumber,
          totalAmount: quote.totalAmount,
          discount: quote.discount,
          paymentMethod: payload?.paymentMethod || PaymentMethod.CASH,
          paymentStatus: isInvoice ? 'PENDING' : 'PAID',
          notes: combinedNotes || null,
          items: {
            create: quote.items.map((item) => ({
              phoneRecordId: item.phoneRecordId,
              description: item.description,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // 2. Mark devices as SOLD if completed/invoice
      if (deviceItemIds.length > 0) {
        await tx.phoneRecord.updateMany({
          where: { id: { in: deviceItemIds } },
          data: {
            status: PhoneStatus.SOLD,
            customerId: quote.customerId,
          },
        });
      }

      // 3. Mark Quote as CONVERTED & link to Sale
      const updatedQuote = await tx.quote.update({
        where: { id },
        data: {
          status: QuoteStatus.CONVERTED,
          convertedSaleId: newSale.id,
        },
      });

      return { sale: newSale, quote: updatedQuote };
    });

    return result;
  }
}
