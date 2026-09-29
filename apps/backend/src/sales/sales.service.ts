import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutSaleDto } from './dto/checkout-sale.dto';
import { PhoneStatus, PaymentMethod } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { generateInvoicePdfBuffer } from './invoice-pdf.generator';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async checkout(businessId: string, userId: string, dto: CheckoutSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required for checkout.');
    }

    const isInvoice = dto.type === 'INVOICE' || dto.paymentStatus === 'DRAFT' || dto.paymentStatus === 'PENDING';

    // 1. Separate inventory devices and custom items
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

      const soldDevice = phones.find((p) => p.status === PhoneStatus.SOLD);
      if (soldDevice) {
        throw new BadRequestException(`Device ${soldDevice.brand} ${soldDevice.model} (IMEI: ${soldDevice.imei1}) is already marked as SOLD.`);
      }
    }

    // 2. Link or Create Customer
    let customerId: string | undefined = undefined;
    if (dto.customerPhone || dto.customerName || dto.customerEmail) {
      let customer = dto.customerPhone ? await this.prisma.customer.findFirst({
        where: {
          businessId,
          phone: dto.customerPhone.trim(),
        },
      }) : null;

      if (!customer && (dto.customerPhone || dto.customerName)) {
        customer = await this.prisma.customer.create({
          data: {
            businessId,
            name: dto.customerName?.trim() || 'Retail Buyer',
            phone: dto.customerPhone?.trim() || 'N/A',
            email: dto.customerEmail?.trim(),
            address: dto.billingAddress?.trim(),
          },
        });
      }
      customerId = customer?.id;
    }

    // 3. Compute Totals & Generate Invoice / Receipt Numbers
    const totalAmount = dto.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const ref = Math.floor(100000 + Math.random() * 900000);
    const invoiceNumber = `NG-INV-${ref}`;
    // Commercial Invoices do not have receipt numbers; POS checkouts have receipt numbers
    const receiptNumber = isInvoice ? null : `NG-REC-${ref}`;

    // Pack metadata into notes if invoice
    let combinedNotes = dto.notes?.trim() || '';
    if (isInvoice) {
      const customBank = (dto as any).bankName ? `[BANK:${(dto as any).bankName}]` : '';
      const customAcc = (dto as any).accountNumber ? `[ACC:${(dto as any).accountNumber}]` : '';
      const customAccName = (dto as any).accountName ? `[ACCNAME:${(dto as any).accountName}]` : '';

      const metaTags = [
        '[TYPE:INVOICE]',
        dto.dueDate ? `[DUE:${dto.dueDate}]` : '',
        dto.paymentTerms ? `[TERMS:${dto.paymentTerms}]` : '',
        dto.billingAddress ? `[ADDR:${dto.billingAddress}]` : '',
        customBank,
        customAcc,
        customAccName,
      ].filter(Boolean).join(' ');
      combinedNotes = `${metaTags} ${combinedNotes}`.trim();
    }

    // 4. Run Prisma Transaction to create sale & mark any devices as SOLD if paid
    const sale = await this.prisma.$transaction(async (tx) => {
      // Create Sale Record
      const newSale = await tx.sale.create({
        data: {
          businessId,
          customerId,
          soldById: userId,
          invoiceNumber,
          receiptNumber,
          totalAmount,
          paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
          paymentStatus: dto.paymentStatus || (isInvoice ? 'PENDING' : 'PAID'),
          notes: combinedNotes || null,
          items: {
            create: dto.items.map((item) => {
              if (item.phoneRecordId) {
                const phone = phones.find((p) => p.id === item.phoneRecordId)!;
                return {
                  phoneRecordId: item.phoneRecordId,
                  description: item.description || `${phone.brand} ${phone.model} (IMEI: ${phone.imei1})`,
                  unitPrice: item.price,
                  quantity: item.quantity || 1,
                  totalPrice: item.price * (item.quantity || 1),
                };
              }
              return {
                phoneRecordId: null,
                description: item.description || 'Custom Item / Appliance',
                unitPrice: item.price,
                quantity: item.quantity || 1,
                totalPrice: item.price * (item.quantity || 1),
              };
            }),
          },
        },
        include: {
          customer: true,
          business: {
            select: {
              name: true,
              phone: true,
              address: true,
              warrantyTerms: true,
              customSuccessMessage: true,
              bankName: true,
              accountNumber: true,
              accountName: true,
            },
          },
          items: {
            include: {
              phoneRecord: true,
            },
          },
        },
      });

      // Update phone statuses to SOLD ONLY if payment has been received (PAID or PARTIALLY_PAID)
      const effectivePaymentStatus = dto.paymentStatus || (isInvoice ? 'PENDING' : 'PAID');
      if (deviceItemIds.length > 0 && (effectivePaymentStatus === 'PAID' || effectivePaymentStatus === 'PARTIALLY_PAID')) {
        await tx.phoneRecord.updateMany({
          where: { id: { in: deviceItemIds } },
          data: {
            status: PhoneStatus.SOLD,
            customerId,
          },
        });
      }

      return newSale;
    });

    return sale;
  }

  async findAllInvoices(businessId: string, search?: string, status?: string) {
    const where: any = {
      businessId,
      OR: [
        { receiptNumber: null },
        { notes: { contains: '[TYPE:INVOICE]' } },
        { paymentStatus: { in: ['PENDING', 'DRAFT', 'OVERDUE'] } },
      ],
    };

    if (status && status !== 'ALL') {
      where.paymentStatus = status;
    }

    if (search) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { invoiceNumber: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
            { customer: { phone: { contains: q, mode: 'insensitive' } } },
            { customer: { email: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        customer: true,
        business: {
          select: {
            name: true,
            phone: true,
            email: true,
            address: true,
            logoUrl: true,
            warrantyTerms: true,
            bankName: true,
            accountNumber: true,
            accountName: true,
          },
        },
        items: {
          include: {
            phoneRecord: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInvoice(businessId: string, id: string) {
    const invoice = await this.prisma.sale.findFirst({
      where: {
        businessId,
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        customer: true,
        business: {
          include: {
            users: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        items: {
          include: {
            phoneRecord: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found.`);
    }

    return invoice;
  }

  async deleteInvoice(businessId: string, id: string) {
    const invoice = await this.findOneInvoice(businessId, id);

    const deviceItemIds = invoice.items
      .filter((i) => i.phoneRecordId)
      .map((i) => i.phoneRecordId as string);

    await this.prisma.$transaction(async (tx) => {
      // Return any linked devices back to IN_STOCK if they were marked SOLD
      if (deviceItemIds.length > 0) {
        await tx.phoneRecord.updateMany({
          where: {
            id: { in: deviceItemIds },
            businessId,
          },
          data: {
            status: PhoneStatus.IN_STOCK,
          },
        });
      }

      // Delete the invoice (sale) and cascading items/installments/payments
      await tx.sale.delete({
        where: { id: invoice.id },
      });
    });

    return { success: true, message: `Invoice ${invoice.invoiceNumber} deleted successfully.` };
  }

  async updateInvoice(businessId: string, id: string, dto: any) {
    const existing = await this.findOneInvoice(businessId, id);

    let customerId = existing.customerId;
    if (dto.customerName) {
      if (dto.customerPhone) {
        let customer = await this.prisma.customer.findFirst({
          where: { businessId, phone: dto.customerPhone.trim() },
        });
        if (!customer) {
          customer = await this.prisma.customer.create({
            data: {
              businessId,
              name: dto.customerName.trim(),
              phone: dto.customerPhone.trim(),
              email: dto.customerEmail?.trim(),
              address: dto.billingAddress?.trim(),
            },
          });
        } else {
          customer = await this.prisma.customer.update({
            where: { id: customer.id },
            data: {
              name: dto.customerName.trim(),
              email: dto.customerEmail?.trim() || customer.email,
              address: dto.billingAddress?.trim() || customer.address,
            },
          });
        }
        customerId = customer.id;
      } else if (existing.customer) {
        await this.prisma.customer.update({
          where: { id: existing.customer.id },
          data: {
            name: dto.customerName.trim(),
            email: dto.customerEmail?.trim() || existing.customer.email,
            address: dto.billingAddress?.trim() || existing.customer.address,
          },
        });
      }
    }

    // Process updated items if provided
    let updatedTotalAmount = existing.totalAmount;
    const oldDeviceIds = existing.items
      .filter((i) => i.phoneRecordId)
      .map((i) => i.phoneRecordId as string);
    let newDeviceIds: string[] = [];

    const itemsToCreate = dto.items && Array.isArray(dto.items) ? dto.items : null;

    if (itemsToCreate) {
      updatedTotalAmount = itemsToCreate.reduce(
        (sum: number, it: any) => sum + (Number(it.price || it.unitPrice || 0) * (Number(it.quantity) || 1)),
        0,
      );
      newDeviceIds = itemsToCreate
        .filter((it: any) => it.phoneRecordId)
        .map((it: any) => it.phoneRecordId as string);
    }

    // Build notes metadata if custom terms/bank/due date provided
    let combinedNotes = dto.notes !== undefined ? dto.notes : (existing.notes || '');
    const metaTags = [
      '[TYPE:INVOICE]',
      dto.billingAddress ? `[ADDR:${dto.billingAddress}]` : '',
      dto.paymentTerms ? `[TERMS:${dto.paymentTerms}]` : '',
      dto.dueDate ? `[DUE:${dto.dueDate}]` : '',
      dto.bankName ? `[BANK:${dto.bankName}]` : '',
      dto.accountNumber ? `[ACC:${dto.accountNumber}]` : '',
      dto.accountName ? `[NAME:${dto.accountName}]` : '',
    ]
      .filter(Boolean)
      .join(' ');
    
    if (metaTags) {
      const rawUserNotes = (dto.notes || existing.notes || '').replace(/\[TYPE:.*?\]|\[ADDR:.*?\]|\[TERMS:.*?\]|\[DUE:.*?\]|\[BANK:.*?\]|\[ACC:.*?\]|\[NAME:.*?\]/g, '').trim();
      combinedNotes = `${metaTags} ${rawUserNotes}`.trim();
    }

    const currentPaid = Number(existing.amountPaid || 0);
    const newBalanceDue = Math.max(0, updatedTotalAmount - currentPaid);
    const updatedPaymentStatus = dto.paymentStatus || (newBalanceDue <= 0 && updatedTotalAmount > 0 ? 'PAID' : (currentPaid > 0 ? 'PARTIALLY_PAID' : existing.paymentStatus));

    return this.prisma.$transaction(async (tx) => {
      // Manage device inventory statuses
      if (itemsToCreate) {
        // Devices removed from invoice -> return to IN_STOCK
        const removedDeviceIds = oldDeviceIds.filter((dId) => !newDeviceIds.includes(dId));
        if (removedDeviceIds.length > 0) {
          await tx.phoneRecord.updateMany({
            where: { id: { in: removedDeviceIds }, businessId },
            data: { status: PhoneStatus.IN_STOCK },
          });
        }

        // Newly added devices: if invoice is PAID/PARTIALLY_PAID, mark SOLD; else remain IN_STOCK
        const addedDeviceIds = newDeviceIds.filter((dId) => !oldDeviceIds.includes(dId));
        if (addedDeviceIds.length > 0 && (updatedPaymentStatus === 'PAID' || updatedPaymentStatus === 'PARTIALLY_PAID')) {
          await tx.phoneRecord.updateMany({
            where: { id: { in: addedDeviceIds }, businessId },
            data: { status: PhoneStatus.SOLD, customerId },
          });
        }

        // Delete old items and insert updated items
        await tx.saleItem.deleteMany({ where: { saleId: existing.id } });
        await tx.saleItem.createMany({
          data: itemsToCreate.map((it: any) => ({
            saleId: existing.id,
            phoneRecordId: it.phoneRecordId || null,
            description: it.description || 'Invoice Item',
            unitPrice: Number(it.price || it.unitPrice || 0),
            quantity: Number(it.quantity) || 1,
            totalPrice: (Number(it.price || it.unitPrice || 0)) * (Number(it.quantity) || 1),
          })),
        });
      }

      // Update sale record
      const updated = await tx.sale.update({
        where: { id: existing.id },
        data: {
          customerId,
          totalAmount: updatedTotalAmount,
          paymentStatus: updatedPaymentStatus,
          notes: combinedNotes,
        },
        include: {
          customer: true,
          items: {
            include: {
              phoneRecord: true,
            },
          },
          business: true,
        },
      });

      return updated;
    });
  }

  async markInvoiceAsPaid(
    businessId: string,
    id: string,
    payload?: { paymentMethod?: any; amount?: number; reference?: string; notes?: string },
    userId?: string,
  ) {
    const invoice = await this.findOneInvoice(businessId, id);

    const ref = Math.floor(100000 + Math.random() * 900000);
    const receiptNumber = invoice.receiptNumber || `VF-REC-${ref}`;

    const deviceItemIds = invoice.items
      .filter((i) => i.phoneRecordId)
      .map((i) => i.phoneRecordId as string);

    // Normalize payment method safely
    let payMethod: PaymentMethod = PaymentMethod.CASH;
    const rawMethod = payload?.paymentMethod || invoice.paymentMethod;
    if (rawMethod) {
      const upper = String(rawMethod).toUpperCase().trim();
      if (upper === 'TRANSFER' || upper === 'BANK_TRANSFER' || upper === 'BANK' || upper === 'WIRE') {
        payMethod = PaymentMethod.BANK_TRANSFER;
      } else if (upper === 'CARD' || upper === 'DEBIT_CARD' || upper === 'CREDIT_CARD') {
        payMethod = PaymentMethod.CARD;
      } else if (upper === 'POS' || upper === 'TERMINAL') {
        payMethod = PaymentMethod.POS;
      } else if (upper === 'SPLIT') {
        payMethod = PaymentMethod.SPLIT;
      } else {
        payMethod = PaymentMethod.CASH;
      }
    }

    const currentPaid = Number(invoice.amountPaid || 0);
    const totalAmount = Number(invoice.totalAmount || 0);
    const remainingBalance = Math.max(0, totalAmount - currentPaid);

    // If amount is specified and > 0, pay that amount up to remaining; otherwise pay full remaining balance
    const amountToPay = (payload?.amount !== undefined && Number(payload.amount) > 0)
      ? Math.min(Number(payload.amount), remainingBalance || totalAmount)
      : (remainingBalance || totalAmount);

    const newAmountPaid = Math.min(totalAmount, currentPaid + amountToPay);
    const newBalanceDue = Math.max(0, totalAmount - newAmountPaid);
    const newStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    return this.prisma.$transaction(async (tx) => {
      // Record payment audit entry
      if (amountToPay > 0) {
        await tx.salePayment.create({
          data: {
            saleId: invoice.id,
            amount: amountToPay,
            paymentMethod: payMethod,
            reference: payload?.reference?.trim() || null,
            notes: payload?.notes?.trim() || null,
            receivedById: userId || null,
          },
        });
      }

      const updated = await tx.sale.update({
        where: { id: invoice.id },
        data: {
          paymentStatus: newStatus,
          paymentMethod: payMethod,
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          receiptNumber: newStatus === 'PAID' ? receiptNumber : invoice.receiptNumber,
        },
        include: {
          customer: true,
          payments: {
            orderBy: { createdAt: 'desc' },
          },
          items: {
            include: {
              phoneRecord: true,
            },
          },
        },
      });

      if ((newStatus === 'PAID' || newStatus === 'PARTIALLY_PAID') && deviceItemIds.length > 0) {
        await tx.phoneRecord.updateMany({
          where: { id: { in: deviceItemIds } },
          data: {
            status: PhoneStatus.SOLD,
            customerId: invoice.customerId,
          },
        });
      }

      return updated;
    });
  }

  async findAllReceipts(businessId: string, search?: string) {
    const where: any = {
      businessId,
      paymentStatus: 'PAID',
      receiptNumber: { not: null },
      OR: [
        { notes: null },
        { NOT: { notes: { contains: '[TYPE:INVOICE]' } } },
      ],
    };

    if (search) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { receiptNumber: { contains: q, mode: 'insensitive' } },
            { invoiceNumber: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
            { customer: { phone: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        customer: true,
        business: {
          select: {
            name: true,
            phone: true,
            email: true,
            address: true,
            logoUrl: true,
            warrantyTerms: true,
            bankName: true,
            accountNumber: true,
            accountName: true,
          },
        },
        items: {
          include: {
            phoneRecord: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneReceipt(businessId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        businessId,
        OR: [{ id }, { receiptNumber: id }, { invoiceNumber: id }],
      },
      include: {
        customer: true,
        business: {
          include: {
            users: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        items: {
          include: {
            phoneRecord: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Receipt ${id} not found.`);
    }

    return sale;
  }

  async sendSaleEmail(businessId: string, id: string, recipientEmail?: string) {
    const sale = await this.findOneReceipt(businessId, id);
    const toEmail = recipientEmail?.trim() || sale.customer?.email?.trim();
    if (!toEmail) {
      throw new BadRequestException('No recipient email address provided.');
    }

    const isInvoice =
      !sale.receiptNumber ||
      sale.notes?.includes('[TYPE:INVOICE]') ||
      ['PENDING', 'DRAFT', 'OVERDUE'].includes(sale.paymentStatus);

    const docTitle = isInvoice ? 'Commercial Invoice Statement' : 'POS Sales Receipt';
    const docNum = isInvoice ? sale.invoiceNumber : sale.receiptNumber || sale.invoiceNumber;
    const storeName = sale.business?.name || 'NoxGuarda Verified Retailer';
    const storeEmail =
      sale.business?.email?.trim() ||
      (sale.business as any)?.users?.[0]?.email?.trim() ||
      '';
    const bankName = sale.business?.bankName?.trim();
    const accountNumber = sale.business?.accountNumber?.trim();
    const accountName = sale.business?.accountName?.trim() || storeName;
    const hasBankDetails = Boolean(bankName && accountNumber);

    const customerName = sale.customer?.name || 'Valued Corporate Buyer';
    const totalFormatted = `₦${Number(sale.totalAmount || 0).toLocaleString()}`;
    const dateFormatted = new Date(sale.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // Extract optional metadata from notes
    const dueMatch = sale.notes?.match(/\[DUE:([^\]]+)\]/);
    const dueDate = dueMatch ? dueMatch[1] : dateFormatted;

    const addrMatch = sale.notes?.match(/\[ADDR:([^\]]+)\]/);
    const customerAddress = sale.customer?.address || (addrMatch ? addrMatch[1] : 'Client Billing Address');

    // Generate Official PDF Statement Buffer
    const pdfBuffer = generateInvoicePdfBuffer({
      invoiceNumber: sale.invoiceNumber,
      receiptNumber: sale.receiptNumber,
      isInvoice,
      createdAt: sale.createdAt,
      dueDate,
      paymentStatus: sale.paymentStatus || 'PAID',
      paymentMethod: sale.paymentMethod,
      totalAmount: sale.totalAmount || 0,
      customerName: sale.customer?.name,
      customerEmail: sale.customer?.email,
      customerPhone: sale.customer?.phone,
      customerAddress,
      storeName,
      storeAddress: sale.business?.address,
      storePhone: sale.business?.phone,
      storeEmail,
      logoUrl: sale.business?.logoUrl,
      bankName: sale.business?.bankName,
      accountNumber: sale.business?.accountNumber,
      accountName: sale.business?.accountName,
      notes: sale.notes,
      items: sale.items.map((it: any) => ({
        description: it.description,
        imei: it.phoneRecord?.imei1,
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        totalPrice: it.totalPrice || (it.unitPrice * (it.quantity || 1)),
      })),
    });

    const pdfFilename = `${isInvoice ? 'Invoice' : 'Receipt'}-${docNum}.pdf`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px 20px; background-color: #ffffff; color: #1e293b; line-height: 1.6; font-size: 14px;">
        <p style="margin-top: 0; font-size: 15px;">Hello <strong>${customerName}</strong>,</p>
        
        <p>Please find attached your official ${isInvoice ? 'invoice statement' : 'sales receipt'} (<strong>${docNum}</strong>) from <strong>${storeName}</strong>.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin: 20px 0; font-size: 13px;">
          <div style="margin-bottom: 8px;"><strong>Statement #:</strong> <span style="font-family: monospace; font-weight: 700;">${docNum}</span></div>
          <div style="margin-bottom: 8px;"><strong>Total Amount:</strong> <span style="font-weight: 800; color: #2563eb; font-size: 15px;">${totalFormatted}</span></div>
          ${isInvoice ? `<div style="margin-bottom: 8px;"><strong>Due Date:</strong> ${dueDate}</div>` : ''}
          <div><strong>Payment Status:</strong> <span style="font-weight: 800; color: ${sale.paymentStatus === 'PAID' ? '#16a34a' : '#d97706'}; text-transform: uppercase;">${sale.paymentStatus}</span></div>
        </div>

        ${
          hasBankDetails
            ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin: 18px 0; font-size: 13px;">
          <div style="font-weight: 800; color: #166534; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Bank Payment / Remittance Details:</div>
          <div style="margin-bottom: 4px; color: #1e293b;"><strong>Bank Name:</strong> ${bankName}</div>
          <div style="margin-bottom: 4px; color: #1e293b;"><strong>Account Number:</strong> <span style="font-family: monospace; font-weight: 700;">${accountNumber}</span></div>
          <div style="margin-bottom: 4px; color: #1e293b;"><strong>Account Name:</strong> ${accountName}</div>
          <div style="color: #64748b; font-size: 12px; margin-top: 4px;"><strong>Payment Reference:</strong> ${docNum}</div>
        </div>
        `
            : ''
        }

        <p style="font-size: 13px; color: #475569;">
          Your detailed invoice breakdown with device specs and warranty terms is attached as a PDF document (<strong>${pdfFilename}</strong>).
        </p>

        <p style="margin-top: 20px; margin-bottom: 0;">Thank you for your business!</p>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
          <strong>${storeName}</strong><br/>
          ${sale.business?.address ? `${sale.business.address}<br/>` : ''}
          ${sale.business?.phone ? `Tel: ${sale.business.phone}<br/>` : ''}
          ${storeEmail ? `Email: ${storeEmail}<br/>` : ''}
          <span style="font-size: 11px; color: #94a3b8;">Secured by NoxGuarda Electronics Ledger</span>
        </div>
      </div>
    `;

    const subject = `[${storeName}] ${docTitle} #${docNum}`;
    let plainText = `Hello ${customerName},\n\nPlease find attached your ${isInvoice ? 'invoice statement' : 'sales receipt'} #${docNum} from ${storeName}.\n\nTotal Amount: ${totalFormatted}\nDue Date: ${dueDate}\nStatus: ${sale.paymentStatus}\n\n`;
    if (hasBankDetails) {
      plainText += `BANK REMITTANCE DETAILS:\nBank: ${bankName}\nAccount Number: ${accountNumber}\nAccount Name: ${accountName}\nPayment Ref: ${docNum}\n\n`;
    }
    plainText += `Attached: ${pdfFilename}\n\nThank you for your business!\n${storeName}\n`;
    if (storeEmail) plainText += `Email: ${storeEmail}\n`;
    if (sale.business?.phone) plainText += `Tel: ${sale.business.phone}\n`;

    const result = await this.mailService.dispatchEmail({
      to: toEmail,
      subject,
      html,
      text: plainText,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return {
      success: true,
      recipient: toEmail,
      subject,
      filename: pdfFilename,
      messageId: (result as any)?.messageId,
      dispatched: result?.success ?? false,
    };
  }

  async generatePdf(businessId: string, id: string): Promise<{ buffer: Buffer; filename: string }> {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        customer: true,
        items: {
          include: {
            phoneRecord: true,
          },
        },
        business: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Transaction record not found.');
    }

    const isInvoice = (sale as any).type === 'INVOICE' || Boolean(sale.invoiceNumber);
    const docNum = sale.invoiceNumber || sale.receiptNumber || `DOC-${sale.id.slice(-6)}`;
    const storeName = sale.business?.name || 'NoxGuarda Retail Store';

    const dateFormatted = new Date(sale.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const dueMatch = sale.notes?.match(/\[DUE:([^\]]+)\]/);
    const dueDate = dueMatch ? dueMatch[1] : dateFormatted;

    const addrMatch = sale.notes?.match(/\[ADDR:([^\]]+)\]/);
    const customerAddress = sale.customer?.address || (addrMatch ? addrMatch[1] : 'Client Billing Address');

    const pdfBuffer = generateInvoicePdfBuffer({
      invoiceNumber: sale.invoiceNumber,
      receiptNumber: sale.receiptNumber,
      isInvoice,
      createdAt: sale.createdAt,
      dueDate,
      paymentStatus: sale.paymentStatus || 'PAID',
      paymentMethod: sale.paymentMethod,
      totalAmount: sale.totalAmount || 0,
      customerName: sale.customer?.name,
      customerEmail: sale.customer?.email,
      customerPhone: sale.customer?.phone,
      customerAddress,
      storeName,
      storeAddress: sale.business?.address,
      storePhone: sale.business?.phone,
      storeEmail: sale.business?.email,
      logoUrl: sale.business?.logoUrl,
      bankName: sale.business?.bankName,
      accountNumber: sale.business?.accountNumber,
      accountName: sale.business?.accountName,
      notes: sale.notes,
      items: sale.items.map((it: any) => ({
        description: it.description,
        imei: it.phoneRecord?.imei1,
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        totalPrice: it.totalPrice || (it.unitPrice * (it.quantity || 1)),
      })),
    });

    const filename = `${isInvoice ? 'Invoice' : 'Receipt'}-${docNum}.pdf`;
    return { buffer: pdfBuffer, filename };
  }
}
