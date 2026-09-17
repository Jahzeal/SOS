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
    const invoiceNumber = `VF-INV-${ref}`;
    // Commercial Invoices do not have receipt numbers; POS checkouts have receipt numbers
    const receiptNumber = isInvoice ? null : `VF-REC-${ref}`;

    // Pack metadata into notes if invoice
    let combinedNotes = dto.notes?.trim() || '';
    if (isInvoice) {
      const metaTags = [
        '[TYPE:INVOICE]',
        dto.dueDate ? `[DUE:${dto.dueDate}]` : '',
        dto.paymentTerms ? `[TERMS:${dto.paymentTerms}]` : '',
        dto.billingAddress ? `[ADDR:${dto.billingAddress}]` : '',
      ].filter(Boolean).join(' ');
      combinedNotes = `${metaTags} ${combinedNotes}`.trim();
    }

    // 4. Run Prisma Transaction to create sale & mark any devices as SOLD
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

      // Update phone statuses to SOLD & link customerId if any devices were included and not draft
      if (deviceItemIds.length > 0 && dto.paymentStatus !== 'DRAFT') {
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

  async findAllInvoices(businessId: string, search?: string) {
    const where: any = {
      businessId,
      OR: [
        { receiptNumber: null },
        { notes: { contains: '[TYPE:INVOICE]' } },
        { paymentStatus: { in: ['PENDING', 'DRAFT', 'OVERDUE'] } },
      ],
    };

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
            address: true,
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

  async findAllReceipts(businessId: string, search?: string) {
    const where: any = {
      businessId,
      receiptNumber: { not: null },
      NOT: {
        notes: { contains: '[TYPE:INVOICE]' },
      },
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
            address: true,
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
        OR: [{ id }, { invoiceNumber: id }, { receiptNumber: id }],
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

    if (!sale) {
      throw new NotFoundException(`Sales record ${id} not found.`);
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
    const storeName = sale.business?.name || 'VerifyFlow Verified Retailer';
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

    const itemsRows = sale.items
      .map(
        (it: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 10px; font-size: 13px; color: #0f172a; font-weight: 600;">
          ${it.description}
          ${it.phoneRecord?.imei1 ? `<div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px;">IMEI / SN: ${it.phoneRecord.imei1}</div>` : ''}
        </td>
        <td style="padding: 12px 10px; font-size: 13px; color: #475569; text-align: center; font-weight: 600;">${it.quantity || 1}</td>
        <td style="padding: 12px 10px; font-size: 13px; color: #0f172a; text-align: right; font-weight: 600;">₦${Number(it.unitPrice || 0).toLocaleString()}</td>
        <td style="padding: 12px 10px; font-size: 13px; color: #0f172a; text-align: right; font-weight: 700;">₦${Number(it.totalPrice || (it.unitPrice * (it.quantity || 1))).toLocaleString()}</td>
      </tr>
    `,
      )
      .join('');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 18px; border: 1px solid #e2e8f0;">
        
        <!-- Top Store Branding & Statement Title -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 18px; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.5px;">${storeName}</h1>
            <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">${sale.business?.address || 'Verified Electronics & Retail HQ'}</p>
            ${sale.business?.phone ? `<p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Tel: ${sale.business.phone}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px;">${docTitle}</div>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; font-family: monospace; margin: 2px 0;">${docNum}</div>
            <div style="font-size: 11px; color: #64748b;">Issued: ${dateFormatted}</div>
          </div>
        </div>

        <!-- Attached PDF Banner -->
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #1e40af; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <strong>📎 Official PDF Attached:</strong> <span style="font-family: monospace; font-weight: 700;">${pdfFilename}</span>
          </div>
          <span style="font-size: 11px; background-color: #dbeafe; padding: 2px 8px; border-radius: 6px; font-weight: 700;">PDF Document</span>
        </div>

        <!-- Dual Information Cards (Solid Blue Top Banner) -->
        <div style="display: table; width: 100%; margin-bottom: 20px;">
          <!-- Left: Store / Remittance Info -->
          <div style="display: table-cell; width: 48%; vertical-align: top; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; color: #ffffff; font-size: 10px; font-weight: 800; padding: 6px 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              Issued By / Store Details
            </div>
            <div style="padding: 12px; font-size: 12px; color: #475569; line-height: 1.5;">
              <strong style="color: #0f172a; font-size: 13px;">${storeName}</strong><br/>
              ${sale.business?.address || 'Store Address'}<br/>
              ${sale.business?.phone ? `Phone: ${sale.business.phone}<br/>` : ''}
              ${sale.business?.bankName && sale.business?.accountNumber ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #1e3a8a;"><strong>Wire Bank:</strong> ${sale.business.bankName}<br/><strong>Account:</strong> ${sale.business.accountNumber}</div>` : ''}
            </div>
          </div>

          <div style="display: table-cell; width: 4%;"></div>

          <!-- Right: Billed Customer Details -->
          <div style="display: table-cell; width: 48%; vertical-align: top; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; color: #ffffff; font-size: 10px; font-weight: 800; padding: 6px 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              Billed To / Statement Details
            </div>
            <div style="padding: 12px; font-size: 12px; color: #475569; line-height: 1.5;">
              <strong style="color: #0f172a; font-size: 13px;">${customerName}</strong><br/>
              ${customerAddress}<br/>
              ${sale.customer?.phone ? `Phone: ${sale.customer.phone}<br/>` : ''}
              ${sale.customer?.email ? `Email: ${sale.customer.email}<br/>` : ''}
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-size: 11px;">
                <strong>Due Date:</strong> <span style="color: #0f172a; font-weight: 700;">${dueDate}</span> | 
                <strong>Status:</strong> <span style="color: ${sale.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b'}; font-weight: 800;">${sale.paymentStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background-color: #2563eb; color: #ffffff; font-size: 11px; text-transform: uppercase; font-weight: 800;">
                <th style="padding: 10px 12px;">Item Description & Hardware Specs</th>
                <th style="padding: 10px 12px; text-align: center;">Qty</th>
                <th style="padding: 10px 12px; text-align: right;">Unit Price</th>
                <th style="padding: 10px 12px; text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Financial Breakdown Card -->
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; color: #64748b;">
              Total Items: <strong style="color: #0f172a;">${sale.items.length}</strong> • Currency: <strong>NGN (₦)</strong>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Balance Due</div>
              <div style="font-size: 22px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px;">${totalFormatted}</div>
            </div>
          </div>
        </div>

        <!-- Terms & Warranty Disclaimers -->
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; font-size: 11px; color: #64748b; line-height: 1.6;">
          <strong style="color: #0f172a; font-size: 12px;">Store Policy & Remittance Remarks:</strong><br/>
          • All serial & IMEI numbers are permanently verified in store database.<br/>
          • 12-Month hardware warranty applies from original issue date.<br/>
          • For wire transfers, please quote reference <strong>${docNum}</strong> on deposit slips.
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Thank you for your business with ${storeName}.<br/>
          Secured & verified by VerifyFlow Electronics Ledger.
        </div>
      </div>
    `;

    const subject = `[${storeName}] ${docTitle} #${docNum}`;
    const result = await this.mailService.dispatchEmail({
      to: toEmail,
      subject,
      html,
      text: `${docTitle} #${docNum}\nStore: ${storeName}\nTotal: ${totalFormatted}\nCustomer: ${customerName}\n(Official PDF attached: ${pdfFilename})`,
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
}
