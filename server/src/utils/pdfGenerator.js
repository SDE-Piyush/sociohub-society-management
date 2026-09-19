import PDFDocument from 'pdfkit';

/**
 * Cleanly format society address from object or string into a single legible line
 */
const formatSocietyAddress = (addr) => {
  if (!addr) return 'Baner-Pashan Link Road, Pune, Maharashtra - 411045';
  if (typeof addr === 'string') return addr;
  const street = addr.street || '';
  const city = addr.city || '';
  const state = addr.state || '';
  const pincode = addr.pincode ? `- ${addr.pincode}` : '';
  const parts = [street, city, state].filter(Boolean);
  return `${parts.join(', ')} ${pincode}`.trim() || 'Baner-Pashan Link Road, Pune, Maharashtra - 411045';
};

/**
 * Generate a high-quality branded Maintenance Payment Receipt PDF
 */
export const generateReceiptPDF = (payment, society, res) => {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(res);

  const primaryColor = '#0F172A'; // Slate 900
  const accentColor = '#0D9488'; // Teal / Emerald
  const mutedColor = '#64748B'; // Slate 500
  const lightBg = '#F8FAFC'; // Slate 50

  // 1. Header Banner
  doc.rect(45, 45, 505, 70).fill('#0B0F19');

  doc
    .fillColor('#06B6D4')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('SocioHub', 60, 58);

  doc
    .fillColor('#94A3B8')
    .font('Helvetica')
    .fontSize(9)
    .text('Smart Society Management Cloud Platform', 60, 84);

  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('OFFICIAL PAYMENT RECEIPT', 320, 60, { align: 'right', width: 215 });

  doc
    .fillColor('#10B981')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('STATUS: VERIFIED & COMPLETED', 320, 80, { align: 'right', width: 215 });

  // 2. Society & Receipt Info
  const infoY = 135;
  const formattedAddress = formatSocietyAddress(society?.address);
  const upiId = society?.settings?.upiId || 'emeraldheights@upi';

  // Left Column: Society Info
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(society?.name || 'Emerald Heights Residency Co-operative Housing Society', 45, infoY, { width: 285 });

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8.5)
    .text(`Reg No: ${society?.registrationNumber || 'MAH/PUN/SOC/2022/4491'}`, 45, infoY + 16, { width: 285 })
    .text(formattedAddress, 45, infoY + 28, { width: 285 })
    .text(`UPI VPA: ${upiId}`, 45, infoY + 42, { width: 285 });

  // Right Column: Receipt Meta Box
  doc
    .rect(345, infoY - 5, 205, 65)
    .fillAndStroke(lightBg, '#E2E8F0');

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(9)
    .text('Receipt Number:', 355, infoY + 4)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text(payment.receiptNumber || 'RCP-2026-0000', 435, infoY + 4, { width: 105, align: 'right' });

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(9)
    .text('Date of Payment:', 355, infoY + 18)
    .fillColor(primaryColor)
    .font('Helvetica')
    .text(
      new Date(payment.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      435,
      infoY + 18,
      { width: 105, align: 'right' }
    );

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(9)
    .text('Payment Mode:', 355, infoY + 32)
    .fillColor(accentColor)
    .font('Helvetica-Bold')
    .text(payment.paymentMethod || 'UPI', 435, infoY + 32, { width: 105, align: 'right' });

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8)
    .text('Transaction Ref:', 355, infoY + 46)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text((payment.transactionRef || 'N/A').slice(0, 18), 435, infoY + 46, { width: 105, align: 'right' });

  // 3. Resident / Billed Flat Details
  const residentY = 215;
  doc
    .rect(45, residentY, 505, 52)
    .fillAndStroke('#F8FAFC', '#CBD5E1');

  doc
    .fillColor(mutedColor)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('BILLED TO RESIDENT & FLAT', 58, residentY + 8);

  const flatNum = payment.flatId?.flatNumber || 'Flat';
  const wingName = payment.buildingId?.name || 'Wing A';
  const residentName = payment.userId?.name || 'Resident';
  const phone = payment.userId?.phone || '—';
  const email = payment.userId?.email || '—';

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .text(`${residentName}  |  Flat ${flatNum} (${wingName})`, 58, residentY + 21, { width: 480 });

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8.5)
    .text(`Email: ${email}    |    Phone: ${phone}`, 58, residentY + 35, { width: 480 });

  // 4. Line Items Table
  const tableY = 282;
  doc
    .rect(45, tableY, 505, 24)
    .fill('#1E293B');

  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('SL', 55, tableY + 7)
    .text('DESCRIPTION / PARTICULARS', 85, tableY + 7, { width: 240 })
    .text('BILLING PERIOD', 335, tableY + 7, { width: 95 })
    .text('AMOUNT (INR)', 435, tableY + 7, { align: 'right', width: 105 });

  // Table Row
  const rowY = tableY + 24;
  doc
    .rect(45, rowY, 505, 42)
    .fillAndStroke(lightBg, '#E2E8F0');

  doc
    .fillColor(primaryColor)
    .font('Helvetica')
    .fontSize(9)
    .text('1', 55, rowY + 10)
    .font('Helvetica-Bold')
    .text('Monthly Society Maintenance & Operational Dues', 85, rowY + 10, { width: 240 })
    .font('Helvetica')
    .fillColor(mutedColor)
    .fontSize(8)
    .text('Includes 24/7 Security, Lifts, Genset Backup & Common Utilities', 85, rowY + 23, { width: 240 })
    .fillColor(primaryColor)
    .fontSize(9)
    .text(payment.month || 'Current Month', 335, rowY + 10, { width: 95 })
    .font('Helvetica-Bold')
    .text(`Rs. ${payment.amount.toLocaleString('en-IN')}.00`, 435, rowY + 10, { align: 'right', width: 105 });

  // Table Total Row
  const totalY = rowY + 42;
  doc
    .rect(45, totalY, 505, 28)
    .fillAndStroke('#E2E8F0', '#CBD5E1');

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .text('TOTAL AMOUNT PAID:', 250, totalY + 9, { width: 180, align: 'right' })
    .fillColor(accentColor)
    .fontSize(11)
    .text(`Rs. ${payment.amount.toLocaleString('en-IN')}.00`, 435, totalY + 8, { align: 'right', width: 105 });

  // 5. Verification Badge & Notes
  const notesY = totalY + 35;
  doc
    .rect(45, notesY, 320, 65)
    .fillAndStroke(lightBg, '#E2E8F0');

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('PAYMENT VERIFICATION & AUDIT NOTES:', 55, notesY + 8);

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8)
    .text(
      payment.notes || `Received via ${payment.paymentMethod}. Transaction recorded in SocioHub ledger.`,
      55,
      notesY + 22,
      { width: 300 }
    )
    .text(
      payment.verifiedBy
        ? `Verified By Admin: ${payment.verifiedBy.name || 'Office Admin'}`
        : 'System Auto-Verified via Digital Gateway',
      55,
      notesY + 46,
      { width: 300 }
    );

  // Signatory Stamp
  doc
    .rect(385, notesY, 165, 65)
    .fillAndStroke(lightBg, '#CBD5E1');

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8)
    .text('For Emerald Heights Residency', 395, notesY + 8)
    .fillColor(accentColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('AUTHORIZED SIGNATORY', 395, notesY + 45);

  // 6. Footer
  doc
    .moveTo(45, 750)
    .lineTo(550, 750)
    .stroke('#E2E8F0');

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8)
    .text('This is a computer-generated digital receipt and requires no physical signature under IT Act 2000.', 45, 758, { align: 'center', width: 505 })
    .text('Generated by SocioHub Society Management Platform', 45, 770, { align: 'center', width: 505 });

  doc.end();
};

/**
 * Generate a branded Maintenance Invoice / Bill PDF
 */
export const generateInvoicePDF = (bill, society, res) => {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(res);

  const primaryColor = '#0F172A';
  const accentColor = '#4F46E5'; // Indigo
  const mutedColor = '#64748B';
  const lightBg = '#F8FAFC';

  // 1. Header Banner
  doc.rect(45, 45, 505, 70).fill('#0B0F19');

  doc
    .fillColor('#06B6D4')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('SocioHub', 60, 58);

  doc
    .fillColor('#94A3B8')
    .font('Helvetica')
    .fontSize(9)
    .text('Smart Society Management Cloud Platform', 60, 84);

  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('MAINTENANCE INVOICE', 320, 60, { align: 'right', width: 215 });

  const isPaid = bill.status === 'PAID';
  doc
    .fillColor(isPaid ? '#10B981' : '#F59E0B')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(`STATUS: ${bill.status}`, 320, 80, { align: 'right', width: 215 });

  // 2. Society & Invoice Info
  const infoY = 135;
  const formattedAddress = formatSocietyAddress(society?.address);
  const upiId = society?.settings?.upiId || 'emeraldheights@upi';

  // Left Column: Society Info
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(society?.name || 'Emerald Heights Residency', 45, infoY, { width: 285 });

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8.5)
    .text(`Reg No: ${society?.registrationNumber || 'MAH/PUN/SOC/2022/4491'}`, 45, infoY + 16, { width: 285 })
    .text(formattedAddress, 45, infoY + 28, { width: 285 })
    .text(`UPI VPA: ${upiId}`, 45, infoY + 42, { width: 285 });

  // Right Column: Bill Meta
  doc
    .rect(345, infoY - 5, 205, 65)
    .fillAndStroke(lightBg, '#E2E8F0');

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(9)
    .text('Invoice Number:', 355, infoY + 5)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text(bill.billNumber || 'INV-2026-0000', 435, infoY + 5, { width: 105, align: 'right' });

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(9)
    .text('Billing Month:', 355, infoY + 20)
    .fillColor(primaryColor)
    .font('Helvetica')
    .text(bill.month || 'November 2026', 435, infoY + 20, { width: 105, align: 'right' });

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(9)
    .text('Due Date:', 355, infoY + 36)
    .fillColor('#DC2626')
    .font('Helvetica-Bold')
    .text(
      new Date(bill.dueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      435,
      infoY + 36,
      { width: 105, align: 'right' }
    );

  // 3. Resident info
  const residentY = 215;
  doc
    .rect(45, residentY, 505, 52)
    .fillAndStroke('#F8FAFC', '#CBD5E1');

  doc
    .fillColor(mutedColor)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('BILLED TO', 58, residentY + 8);

  const flatNum = bill.flatId?.flatNumber || 'Flat';
  const wingName = bill.buildingId?.name || 'Wing A';
  const resident = bill.flatId?.ownerId || bill.flatId?.tenantId;
  const residentName = resident?.name || 'Resident';
  const residentType = bill.flatId?.ownerId ? 'Owner' : bill.flatId?.tenantId ? 'Tenant' : 'Resident';

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .text(`${residentName}  |  Flat ${flatNum} (${wingName}) — ${residentType}`, 58, residentY + 21, { width: 480 });

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8.5)
    .text(`Type: ${bill.flatId?.type || 'Apartment'}    |    Floor: ${bill.flatId?.floor || 1}`, 58, residentY + 35, { width: 480 });

  // 4. Line Items Table
  const tableY = 282;
  doc
    .rect(45, tableY, 505, 24)
    .fill('#1E293B');

  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('SL', 55, tableY + 7)
    .text('PARTICULARS', 85, tableY + 7, { width: 240 })
    .text('RATE / CHARGES', 335, tableY + 7, { width: 95 })
    .text('TOTAL (INR)', 435, tableY + 7, { align: 'right', width: 105 });

  // Rows
  let curY = tableY + 24;

  // Base Maintenance
  doc
    .rect(45, curY, 505, 28)
    .fillAndStroke(lightBg, '#E2E8F0');
  doc
    .fillColor(primaryColor)
    .font('Helvetica')
    .fontSize(9)
    .text('1', 55, curY + 9)
    .font('Helvetica-Bold')
    .text('Monthly Flat Maintenance Charges', 85, curY + 9, { width: 240 })
    .font('Helvetica')
    .text('Standard Flat Rate', 335, curY + 9, { width: 95 })
    .font('Helvetica-Bold')
    .text(`Rs. ${(bill.baseAmount || 0).toLocaleString('en-IN')}.00`, 435, curY + 9, { align: 'right', width: 105 });

  curY += 28;

  // Common Utilities
  if (bill.utilityCharges > 0) {
    doc
      .rect(45, curY, 505, 28)
      .fillAndStroke('#FFFFFF', '#E2E8F0');
    doc
      .fillColor(primaryColor)
      .font('Helvetica')
      .fontSize(9)
      .text('2', 55, curY + 9)
      .font('Helvetica-Bold')
      .text('Common Utilities & Water Fund Sinking Contribution', 85, curY + 9, { width: 240 })
      .font('Helvetica')
      .text('Shared Utility', 335, curY + 9, { width: 95 })
      .font('Helvetica-Bold')
      .text(`Rs. ${bill.utilityCharges.toLocaleString('en-IN')}.00`, 435, curY + 9, { align: 'right', width: 105 });
    curY += 28;
  }

  // Late fine if any
  if (bill.lateFine > 0) {
    doc
      .rect(45, curY, 505, 28)
      .fillAndStroke('#FEF2F2', '#FCA5A5');
    doc
      .fillColor('#991B1B')
      .font('Helvetica')
      .fontSize(9)
      .text('3', 55, curY + 9)
      .font('Helvetica-Bold')
      .text('Late Payment Penalty', 85, curY + 9, { width: 240 })
      .font('Helvetica')
      .text('Overdue Fine', 335, curY + 9, { width: 95 })
      .text(`Rs. ${bill.lateFine.toLocaleString('en-IN')}.00`, 435, curY + 9, { align: 'right', width: 105 });
    curY += 28;
  }

  // Net Payable Total
  doc
    .rect(45, curY, 505, 28)
    .fillAndStroke('#E2E8F0', '#CBD5E1');

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .text('NET PAYABLE AMOUNT:', 250, curY + 9, { width: 180, align: 'right' })
    .fillColor(accentColor)
    .fontSize(11)
    .text(`Rs. ${(bill.totalAmount || 0).toLocaleString('en-IN')}.00`, 435, curY + 8, { align: 'right', width: 105 });

  // Bank / UPI payment instructions
  const instructY = curY + 22;
  doc
    .rect(45, instructY, 505, 75)
    .fillAndStroke(lightBg, '#E2E8F0');

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('HOW TO PAY:', 55, instructY + 9);

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8)
    .text(`1. UPI Payment: Scan QR code on SocioHub Portal or transfer directly to VPA: ${upiId}`, 55, instructY + 22, { width: 485 })
    .text('2. Card / NetBanking: Click "Pay Maintenance" on SocioHub to pay securely via Razorpay.', 55, instructY + 36, { width: 485 })
    .text(`3. Cash Payment: Deposit at Society Management Office, ${formattedAddress} (Mon-Sat 9 AM - 6 PM).`, 55, instructY + 50, { width: 485 });

  // Footer
  doc
    .moveTo(45, 750)
    .lineTo(550, 750)
    .stroke('#E2E8F0');

  doc
    .fillColor(mutedColor)
    .font('Helvetica')
    .fontSize(8)
    .text('SocioHub Cloud Platform — Automated Resident Billing Engine', 45, 758, { align: 'center', width: 505 });

  doc.end();
};
