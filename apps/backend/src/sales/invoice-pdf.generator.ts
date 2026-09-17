import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoicePdfData {
  invoiceNumber: string;
  receiptNumber?: string | null;
  isInvoice: boolean;
  createdAt: Date | string;
  dueDate?: string | null;
  paymentStatus: string;
  paymentMethod?: string | null;
  totalAmount: number;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  storeName: string;
  storeAddress?: string | null;
  storePhone?: string | null;
  storeEmail?: string | null;
  logoUrl?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  notes?: string | null;
  items: Array<{
    description: string;
    imei?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export function generateInvoicePdfBuffer(data: InvoicePdfData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const docTitle = data.isInvoice ? 'COMMERCIAL INVOICE' : 'SALES RECEIPT';
  const docNum = data.invoiceNumber || data.receiptNumber || 'VF-INV-001';
  const issueDateStr = new Date(data.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const dueDateStr = data.dueDate || issueDateStr;

  // 1. Header Bar (Dark Slate Banner)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Render Custom Logo or Branded Initials Badge
  let textLeft = 14;
  if (data.logoUrl) {
    try {
      if (data.logoUrl.startsWith('data:image/')) {
        const isPng = data.logoUrl.includes('image/png');
        doc.addImage(data.logoUrl, isPng ? 'PNG' : 'JPEG', 14, 4, 18, 18, undefined, 'FAST');
        textLeft = 36;
      }
    } catch {
      textLeft = 14;
    }
  }

  if (textLeft === 14) {
    // Elegant Store Monogram Box
    doc.setFillColor(37, 99, 235); // blue-600
    doc.roundedRect(14, 5, 16, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const initials = data.storeName.slice(0, 2).toUpperCase() || 'VF';
    doc.text(initials, 22, 15, { align: 'center' });
    textLeft = 34;
  }

  // Store Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(data.storeName.toUpperCase(), textLeft, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('VERIFIED DEVICE & ELECTRONICS RETAIL LEDGER', textLeft, 19);

  // Document Type Header on Right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(docTitle, pageWidth - 14, 13, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(docNum, pageWidth - 14, 19, { align: 'right' });

  // 2. Dual Info Boxes (Store Info Left, Invoice & Customer Meta Right)
  const boxTop = 32;
  const boxWidth = (pageWidth - 36) / 2;
  const boxHeight = 50;

  // Left Box: Store & Remittance Info
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, boxTop, boxWidth, boxHeight, 3, 3, 'FD');

  // Header banner in Left Box
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(14, boxTop, boxWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ISSUED BY / STORE DETAILS', 18, boxTop + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(data.storeName, 18, boxTop + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let storeY = boxTop + 18;
  if (data.storeAddress) {
    doc.text(data.storeAddress, 18, storeY);
    storeY += 4.5;
  }
  if (data.storePhone) {
    doc.text(`Phone: ${data.storePhone}`, 18, storeY);
    storeY += 4.5;
  }
  if (data.storeEmail) {
    doc.text(`Email: ${data.storeEmail}`, 18, storeY);
    storeY += 4.5;
  }

  // Right Box: Customer & Billing Meta
  const rightBoxLeft = 14 + boxWidth + 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxLeft, boxTop, boxWidth, boxHeight, 3, 3, 'FD');

  // Header banner in Right Box
  doc.setFillColor(37, 99, 235);
  doc.rect(rightBoxLeft, boxTop, boxWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('BILLED TO / STATEMENT DETAILS', rightBoxLeft + 4, boxTop + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(data.customerName || 'Valued Corporate Buyer', rightBoxLeft + 4, boxTop + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Address: ${data.customerAddress || 'Client Billing Address'}`, rightBoxLeft + 4, boxTop + 18);
  doc.text(`Contact: ${data.customerPhone || 'N/A'} • ${data.customerEmail || 'N/A'}`, rightBoxLeft + 4, boxTop + 23);
  doc.text(`Issue Date: ${issueDateStr} | Due: ${dueDateStr}`, rightBoxLeft + 4, boxTop + 28);
  
  // Status Pill
  const statusColor = data.paymentStatus === 'PAID' ? [16, 185, 129] : [245, 158, 11];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Status: ${data.paymentStatus.toUpperCase()}`, rightBoxLeft + 4, boxTop + 37);

  // 3. Line Items Table with Blue Header
  const tableRows = data.items.map((item, index) => [
    index + 1,
    `${item.description}${item.imei ? `\nIMEI/SN: ${item.imei}` : ''}`,
    item.quantity.toString(),
    `NGN ${item.unitPrice.toLocaleString()}`,
    `NGN ${item.totalPrice.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: boxTop + boxHeight + 8,
    margin: { left: 14, right: 14 },
    head: [['#', 'Item Description & Hardware Specs', 'Qty', 'Unit Price', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Solid Blue 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 36, halign: 'right' },
      4: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Financial Summary Card on Right & Terms Notes + Bank Wire Card on Left
  const summaryWidth = 80;
  const summaryLeft = pageWidth - 14 - summaryWidth;

  // Bank Remittance Box on Left (if bank info is available)
  if (data.bankName && data.accountNumber) {
    doc.setFillColor(239, 246, 255); // blue-50
    doc.setDrawColor(191, 219, 254); // blue-200
    doc.roundedRect(14, finalY, summaryLeft - 20, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text('DIRECT BANK REMITTANCE INSTRUCTIONS:', 18, finalY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 64, 175);
    doc.text(`Bank: ${data.bankName}   |   Account #: ${data.accountNumber}`, 18, finalY + 10.5);
    doc.text(`Account Name: ${data.accountName || data.storeName}   |   Payment Ref: ${docNum}`, 18, finalY + 15.5);
  }

  // Notes & Policy Remarks
  const notesY = data.bankName && data.accountNumber ? finalY + 24 : finalY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Policy Remarks & Guarantee:', 14, notesY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('• All serial & IMEI numbers are permanently verified in store ledger.', 14, notesY + 5);
  doc.text('• Store warranty is valid for 12 months from original issue date.', 14, notesY + 9.5);

  // Financial Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryLeft, finalY, summaryWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', summaryLeft + 6, finalY + 8);
  doc.text(`NGN ${data.totalAmount.toLocaleString()}`, summaryLeft + summaryWidth - 6, finalY + 8, { align: 'right' });

  doc.text('Tax / VAT (0%):', summaryLeft + 6, finalY + 14);
  doc.text('NGN 0.00', summaryLeft + summaryWidth - 6, finalY + 14, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryLeft + 6, finalY + 18, summaryLeft + summaryWidth - 6, finalY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('TOTAL DUE:', summaryLeft + 6, finalY + 25);
  doc.text(`NGN ${data.totalAmount.toLocaleString()}`, summaryLeft + summaryWidth - 6, finalY + 25, { align: 'right' });

  // 5. Bottom Verified Stamp & Footer
  const footerY = 275;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official commercial statement generated by ${data.storeName} via VerifyFlow Retail OS. Scannable security verified.`,
    pageWidth / 2,
    footerY + 6,
    { align: 'center' },
  );

  return Buffer.from(doc.output('arraybuffer'));
}
