import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface QuotePdfData {
  quoteNumber: string;
  quoteTitle?: string;
  quoteDate: Date | string;
  expiryDate?: Date | string | null;
  status: string;
  subject?: string | null;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid?: number;
  balanceDue?: number;
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
  terms?: string | null;
  accentColorHex?: string | null;
  showBankDetails?: boolean;
  showSignature?: boolean;
  items: Array<{
    description: string;
    imei?: string | null;
    quantity: number;
    unitPrice: number;
    discount?: number;
    totalPrice: number;
  }>;
  installments?: Array<{
    installmentNo: number;
    amountDue: number;
    amountPaid?: number;
    dueDate: Date | string;
    status: string;
  }>;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 6) {
    const num = parseInt(cleanHex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  return [37, 99, 235]; // fallback blue-600
}

export function generateQuotePdfBuffer(data: QuotePdfData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const docTitle = data.quoteTitle || 'PRICE QUOTATION';
  const docNum = data.quoteNumber || 'QT-001';
  const quoteDateStr = new Date(data.quoteDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const expiryDateStr = data.expiryDate
    ? new Date(data.expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '14 Days from Issue';

  const accentRgb = hexToRgb(data.accentColorHex || '#2563EB');

  // 1. Header Area (Clean Light Theme with Slim Brand Accent Line)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Top slim brand accent bar
  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.rect(0, 0, pageWidth, 3, 'F');

  let textLeft = 14;
  if (data.logoUrl) {
    try {
      if (data.logoUrl.startsWith('data:image/')) {
        const isPng = data.logoUrl.includes('image/png');
        doc.addImage(data.logoUrl, isPng ? 'PNG' : 'JPEG', 14, 6, 18, 18, undefined, 'FAST');
        textLeft = 36;
      }
    } catch {
      textLeft = 14;
    }
  }

  if (textLeft === 14) {
    // Branded Monogram Box
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(14, 6, 16, 16, 2, 2, 'FD');
    doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const initials = data.storeName.slice(0, 2).toUpperCase() || 'QT';
    doc.text(initials, 22, 16.5, { align: 'center' });
    textLeft = 34;
  }

  // Store Name & Subtitle
  doc.setTextColor(15, 23, 42); // slate-900 (crisp high contrast)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(data.storeName.toUpperCase(), textLeft, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('FORMAL COMMERCIAL & DEVICE PROPOSAL', textLeft, 19.5);

  // Document Title & Number on Top Right
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(docTitle, pageWidth - 14, 14, { align: 'right' });

  doc.setFontSize(9.5);
  doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.text(docNum, pageWidth - 14, 20, { align: 'right' });

  // Dividing Rule
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 26, pageWidth - 14, 26);

  // 2. Info Boxes: Store Details Left, Customer & Quotation Meta Right
  const boxTop = 32;
  const boxWidth = (pageWidth - 36) / 2;
  const boxHeight = 50;

  // Left Box: Store Info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, boxTop, boxWidth, boxHeight, 3, 3, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(14, boxTop, boxWidth, 7, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PROPOSED BY / ISSUED BY', 18, boxTop + 5);

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

  // Right Box: Customer & Quote Validity Meta
  const rightBoxLeft = 14 + boxWidth + 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxLeft, boxTop, boxWidth, boxHeight, 3, 3, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(rightBoxLeft, boxTop, boxWidth, 7, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('QUOTATION FOR / PROSPECTIVE CLIENT', rightBoxLeft + 4, boxTop + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(data.customerName || 'Valued Prospective Client', rightBoxLeft + 4, boxTop + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Address: ${data.customerAddress || 'Client Address / N/A'}`, rightBoxLeft + 4, boxTop + 18);
  doc.text(`Contact: ${data.customerPhone || 'N/A'} • ${data.customerEmail || 'N/A'}`, rightBoxLeft + 4, boxTop + 23);
  doc.text(`Quote Date: ${quoteDateStr} | Valid Until: ${expiryDateStr}`, rightBoxLeft + 4, boxTop + 28);

  // Status Badge in Right Box
  let statusColor = [59, 130, 246]; // Blue for draft/sent
  if (data.status === 'ACCEPTED' || data.status === 'CONVERTED') statusColor = [16, 185, 129];
  if (data.status === 'DECLINED' || data.status === 'EXPIRED') statusColor = [239, 68, 68];

  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${data.status.toUpperCase()}`, rightBoxLeft + 4, boxTop + 37);

  // Optional Subject Note Bar
  let currentY = boxTop + boxHeight + 6;
  if (data.subject) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, currentY, pageWidth - 28, 8, 1.5, 1.5, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Subject: ${data.subject}`, 18, currentY + 5.5);
    currentY += 12;
  }

  // 3. Line Items Table
  const tableRows = data.items.map((item, index) => [
    index + 1,
    `${item.description}${item.imei ? `\nIMEI / SN: ${item.imei}` : ''}`,
    item.quantity.toString(),
    `NGN ${item.unitPrice.toLocaleString()}`,
    item.discount ? `${item.discount}%` : '-',
    `NGN ${item.totalPrice.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [['#', 'Item Description / Device Specs', 'Qty', 'Unit Price', 'Disc.', 'Total Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // Slate 100 (clean & readable)
      textColor: [15, 23, 42], // Slate 900
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Bottom Section: Notes & Terms Left, Totals Calculation Right
  const bottomBoxWidth = (pageWidth - 36) / 2;

  // Totals Box (Right Side)
  const totalsLeft = 14 + bottomBoxWidth + 8;
  const hasPartPayment = (data.amountPaid || 0) > 0 || (data.balanceDue !== undefined && data.balanceDue < data.totalAmount);
  const totalsBoxHeight = hasPartPayment ? 58 : 42;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsLeft, finalTableY, bottomBoxWidth, totalsBoxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  let totY = finalTableY + 7;
  doc.text('Subtotal:', totalsLeft + 6, totY);
  doc.text(`NGN ${data.subtotal.toLocaleString()}`, pageWidth - 18, totY, { align: 'right' });

  if (data.discount > 0) {
    totY += 6;
    doc.text('Discount:', totalsLeft + 6, totY);
    doc.setTextColor(220, 38, 38);
    doc.text(`- NGN ${data.discount.toLocaleString()}`, pageWidth - 18, totY, { align: 'right' });
    doc.setTextColor(71, 85, 105);
  }

  if (data.taxAmount > 0) {
    totY += 6;
    doc.text(`Tax / VAT (${data.taxRate}%):`, totalsLeft + 6, totY);
    doc.text(`+ NGN ${data.taxAmount.toLocaleString()}`, pageWidth - 18, totY, { align: 'right' });
  }

  // Grand Total Banner
  totY += 7;
  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.roundedRect(totalsLeft + 4, totY, bottomBoxWidth - 8, 9, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ESTIMATED TOTAL:', totalsLeft + 8, totY + 6);
  doc.text(`NGN ${data.totalAmount.toLocaleString()}`, pageWidth - 18, totY + 6, { align: 'right' });

  if (hasPartPayment) {
    totY += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129); // green
    doc.text('Initial Deposit Received:', totalsLeft + 6, totY);
    doc.setFont('helvetica', 'bold');
    doc.text(`NGN ${(data.amountPaid || 0).toLocaleString()}`, pageWidth - 18, totY, { align: 'right' });

    totY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(217, 119, 6); // amber
    doc.text('Remaining Balance Due:', totalsLeft + 6, totY);
    doc.setFont('helvetica', 'bold');
    const remaining = data.balanceDue !== undefined ? data.balanceDue : Math.max(0, data.totalAmount - (data.amountPaid || 0));
    doc.text(`NGN ${remaining.toLocaleString()}`, pageWidth - 18, totY, { align: 'right' });
  }

  // Bank & Terms (Left Side)
  let leftY = finalTableY;
  if (data.showBankDetails !== false && (data.bankName || data.accountNumber)) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, leftY, bottomBoxWidth, 24, 2.5, 2.5, 'FD');

    doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('REMITTANCE & PAYMENT INSTRUCTIONS', 18, leftY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    let bankLineY = leftY + 11;
    if (data.bankName) {
      doc.text(`Bank: ${data.bankName}`, 18, bankLineY);
      bankLineY += 4.5;
    }
    if (data.accountNumber) {
      doc.text(`Account No: ${data.accountNumber} (${data.accountName || data.storeName})`, 18, bankLineY);
    }
    leftY += 28;
  }

  // Installment Schedule Table (if installments are configured)
  let nextSectionY = Math.max(leftY, finalTableY + totalsBoxHeight + 6);
  if (data.installments && data.installments.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('AGREED INSTALLMENT PAYMENT SCHEDULE', 14, nextSectionY + 2);

    const instRows = data.installments.map((inst) => {
      const dueStr = new Date(inst.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return [
        `Installment #${inst.installmentNo}`,
        dueStr,
        `NGN ${inst.amountDue.toLocaleString()}`,
        `NGN ${(inst.amountPaid || 0).toLocaleString()}`,
        inst.status.toUpperCase(),
      ];
    });

    autoTable(doc, {
      startY: nextSectionY + 4,
      margin: { left: 14, right: 14 },
      head: [['Installment', 'Due Date', 'Amount Due', 'Amount Paid', 'Status']],
      body: instRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 'auto', halign: 'center', fontStyle: 'bold' },
      },
    });

    nextSectionY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Customer Notes & Terms
  if (data.terms || data.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Terms & Conditions / Disclaimers:', 14, nextSectionY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const termsText = data.terms || data.notes || 'This price quotation is valid until the expiry date shown above.';
    const splitTerms = doc.splitTextToSize(termsText, pageWidth - 28);
    doc.text(splitTerms, 14, nextSectionY + 4);
    nextSectionY += 12;
  }

  // Signature Section (if enabled)
  if (data.showSignature !== false) {
    const sigY = Math.max(leftY + 28, finalTableY + 48);
    if (sigY < pageHeight - 24) {
      doc.setDrawColor(203, 213, 225);
      doc.line(pageWidth - 70, sigY + 10, pageWidth - 14, sigY + 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Authorized Representative Signature / Stamp', pageWidth - 42, sigY + 14, { align: 'center' });
    }
  }

  // Footer Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by ${data.storeName} via NoxGuarda Retail OS • Quotation #${docNum} • Subject to stock availability`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' },
  );

  return Buffer.from(doc.output('arraybuffer'));
}
