const PDFDocument = require('pdfkit');

/**
 * Generates a luxury-themed invoice PDF using PDFKit
 * @param {Object} invoice - Invoice document populated with customer, booking and agent details
 * @param {res} res - Express response stream
 */
const generateInvoicePDF = (invoice, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe to response
  doc.pipe(res);

  // Styling Constants (FilterNest luxury colors)
  const primaryColor = '#6c2f00';   // Premium Brown
  const secondaryColor = '#6a5e33'; // Refined Amber
  const textColor = '#2f312f';      // Off-black
  const lightBg = '#faf9f6';        // Off-white / Soft Beige
  const dividerColor = '#dac2b6';   // Border Color

  // --- HEADER SECTION ---
  doc.rect(0, 0, 595.28, 120)
     .fill(lightBg);

  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(28)
     .text('FilterNest', 50, 45);

  doc.fillColor(secondaryColor)
     .font('Helvetica-Oblique')
     .fontSize(10)
     .text('PURE WATER SANCTUARY', 50, 78);

  // Company Details (Top Right)
  doc.fillColor(textColor)
     .font('Helvetica')
     .fontSize(7.5)
     .text('FILTERNEST ENTERPRISE PVT. LTD.', 350, 36, { align: 'right' })
     .text('KMA Residency, Sri Sai Layout, Yelahanka,', 350, 48, { align: 'right' })
     .text('Bangalore, Karnataka - 560064', 350, 60, { align: 'right' })
     .text('Phone: 7483550914', 350, 72, { align: 'right' })
     .text('filternest.service@gmail.com', 350, 84, { align: 'right' })
     .text('GSTIN: 27AAFCN8812M1ZC', 350, 96, { align: 'right' });

  // Divider Line
  doc.strokeColor(dividerColor)
     .lineWidth(1)
     .moveTo(50, 120)
     .lineTo(545, 120)
     .stroke();

  // --- INVOICE & CUSTOMER INFO ---
  doc.fontSize(10)
     .fillColor(primaryColor)
     .font('Helvetica-Bold')
     .text('INVOICE TO:', 50, 145);

  const customerName = invoice.customer 
    ? `${invoice.customer.firstName} ${invoice.customer.lastName}`.toUpperCase() 
    : 'VALUED CUSTOMER';
  
  doc.fillColor(textColor)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text(customerName, 50, 160)
     .font('Helvetica')
     .fontSize(9)
     .text(`Phone: ${invoice.customer?.phone || 'N/A'}`, 50, 175)
     .text(`Email: ${invoice.customer?.email || 'N/A'}`, 50, 187);

  const street = invoice.booking?.serviceLocation?.address?.street || 'N/A';
  const city = invoice.booking?.serviceLocation?.address?.city || '';
  const state = invoice.booking?.serviceLocation?.address?.state || '';
  const pincode = invoice.booking?.serviceLocation?.address?.pincode || '';
  doc.text(`Address: ${street}`, 50, 199, { width: 220 })
     .text(`${city}, ${state} - ${pincode}`, 50, 211);

  // Invoice Details (Right Side)
  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('INVOICE DETAILS:', 350, 145);

  doc.fillColor(textColor)
     .font('Helvetica-Bold')
     .fontSize(9)
     .text(`Invoice No: `, 350, 160)
     .font('Helvetica')
     .text(invoice.invoiceNumber, 430, 160)
     
     .font('Helvetica-Bold')
     .text(`Issue Date: `, 350, 172)
     .font('Helvetica')
     .text(new Date(invoice.issueDate).toLocaleDateString(), 430, 172)

     .font('Helvetica-Bold')
     .text(`Booking Ref: `, 350, 184)
     .font('Helvetica')
     .text(invoice.booking?._id?.toString().slice(-8).toUpperCase() || 'N/A', 430, 184)

     .font('Helvetica-Bold')
     .text(`Payment: `, 350, 196)
     .font('Helvetica-Bold')
     .fillColor(invoice.paymentStatus === 'completed' ? 'green' : 'orange')
     .text(invoice.paymentStatus.toUpperCase(), 430, 196);

  // --- SERVICE & AGENT SUMMARY ---
  doc.rect(50, 240, 495, 45)
     .fill(lightBg);

  const agentName = invoice.agent 
    ? `${invoice.agent.firstName} ${invoice.agent.lastName}` 
    : 'Assigned Filter Specialist';
  
  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('ASSIGNED TECHNICIAN', 65, 250)
     .fillColor(textColor)
     .font('Helvetica')
     .text(agentName, 65, 265)
     .text(`ID: ${invoice.agent?.agentId || 'FN-TECH-8893'}`, 250, 265)
     .text(`Contact: ${invoice.agent?.phone || 'N/A'}`, 400, 265);

  // --- TABLE ITEMS ---
  const tableTop = 310;
  
  // Table Header
  doc.rect(50, tableTop, 495, 20)
     .fill(primaryColor);

  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('DESCRIPTION', 60, tableTop + 6)
     .text('QTY', 300, tableTop + 6, { width: 30, align: 'center' })
     .text('UNIT PRICE', 360, tableTop + 6, { width: 80, align: 'right' })
     .text('TOTAL', 460, tableTop + 6, { width: 75, align: 'right' });

  // Items Rows
  let currentY = tableTop + 20;
  
  // Construct items array from invoice
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    { description: `General Purifier Maintenance Service (${invoice.booking?.serviceType || 'Standard'})`, quantity: 1, unitPrice: invoice.subtotal || invoice.total * 0.82 }
  ];

  items.forEach((item, idx) => {
    // Alternate row styling
    if (idx % 2 === 1) {
      doc.rect(50, currentY, 495, 20).fill('#fcfbfa');
    }

    doc.fillColor(textColor)
       .font('Helvetica')
       .fontSize(9)
       .text(item.description, 60, currentY + 6, { width: 230 })
       .text(item.quantity.toString(), 300, currentY + 6, { width: 30, align: 'center' })
       .text(`INR ${item.unitPrice.toFixed(2)}`, 360, currentY + 6, { width: 80, align: 'right' })
       .text(`INR ${item.total.toFixed(2)}`, 460, currentY + 6, { width: 75, align: 'right' });

    currentY += 20;
  });

  // Table bottom border
  doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor(dividerColor).lineWidth(1).stroke();

  // --- PAYMENT / TOTALS SECTION ---
  const totalsY = currentY + 20;

  // Scan To Pay box placeholder
  doc.rect(50, totalsY, 150, 110)
     .fill(lightBg)
     .strokeColor(dividerColor)
     .lineWidth(1)
     .stroke();

  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(7)
     .text('SCAN TO VIEW & VERIFY', 60, totalsY + 12)
     .fillColor(textColor)
     .font('Helvetica')
     .text('Verified FilterNest Care+ Portal', 60, totalsY + 95, { width: 130 });

  // Simulating a QR Code block
  doc.rect(90, totalsY + 25, 60, 60)
     .fill('#444')
     .fillColor('#fff')
     .rect(100, totalsY + 35, 40, 40)
     .fill('#fff')
     .rect(110, totalsY + 45, 20, 20)
     .fill('#444');

  // Totals calculations
  const subtotal = invoice.subtotal || (invoice.total / 1.18);
  const tax = invoice.tax || (invoice.total - subtotal);
  const total = invoice.total;

  doc.fillColor(textColor)
     .font('Helvetica')
     .fontSize(9)
     .text('Subtotal:', 350, totalsY + 6)
     .text(`INR ${subtotal.toFixed(2)}`, 450, totalsY + 6, { align: 'right', width: 85 })
     
     .text('SGST (9%):', 350, totalsY + 20)
     .text(`INR ${(tax / 2).toFixed(2)}`, 450, totalsY + 20, { align: 'right', width: 85 })
     
     .text('CGST (9%):', 350, totalsY + 34)
     .text(`INR ${(tax / 2).toFixed(2)}`, 450, totalsY + 34, { align: 'right', width: 85 });

  if (invoice.discount > 0) {
    doc.text('Discount:', 350, totalsY + 48)
       .text(`- INR ${invoice.discount.toFixed(2)}`, 450, totalsY + 48, { align: 'right', width: 85 });
  }

  const finalRowY = totalsY + 65;
  doc.rect(340, finalRowY - 5, 205, 30)
     .fill(primaryColor);

  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(11)
     .text('Grand Total:', 350, finalRowY + 5)
     .text(`INR ${total.toFixed(2)}`, 450, finalRowY + 5, { align: 'right', width: 85 });

  // --- FOOTER & SIGN-OFF ---
  const footerY = 700;
  
  doc.strokeColor(dividerColor)
     .lineWidth(1)
     .moveTo(50, footerY)
     .lineTo(545, footerY)
     .stroke();

  doc.fillColor(textColor)
     .font('Helvetica')
     .fontSize(7)
     .text('TERMS AND CONDITIONS:', 50, footerY + 12)
     .text('1. Warranty valid for 90 days from maintenance completion.', 50, footerY + 24)
     .text('2. Spares replaced are genuine FilterNest premium OEM parts.', 50, footerY + 34)
     .text('3. This is an electronically generated receipt; no physical signature is required.', 50, footerY + 44);

  doc.fillColor(secondaryColor)
     .font('Helvetica-Bold')
     .fontSize(14)
     .text('THANK YOU FOR BEING A PREMIUM MEMBER', 50, footerY + 65, { align: 'center', width: 495 });

  // End stream
  doc.end();
};

module.exports = {
  generateInvoicePDF,
};
