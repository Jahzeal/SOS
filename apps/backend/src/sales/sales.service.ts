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

  async markInvoiceAsPaid(businessId: string, id: string, paymentMethod?: PaymentMethod) {
    const invoice = await this.findOneInvoice(businessId, id);

    const ref = Math.floor(100000 + Math.random() * 900000);
    const receiptNumber = invoice.receiptNumber || `VF-REC-${ref}`;

    const deviceItemIds = invoice.items
      .filter((i) => i.phoneRecordId)
      .map((i) => i.phoneRecordId as string);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.sale.update({
        where: { id: invoice.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod || invoice.paymentMethod || PaymentMethod.CASH,
          receiptNumber,
        },
        include: {
          customer: true,
          items: {
            include: {
              phoneRecord: true,
            },
          },
        },
      });

      if (deviceItemIds.length > 0) {
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
}
