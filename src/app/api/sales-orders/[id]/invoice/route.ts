// Sales Order Invoice Generation API
// GET /api/sales-orders/[id]/invoice - Generate invoice data for printing or sharing
// User Story 26: End-to-End Sales Workflow - Invoice Generation

import { NextRequest, NextResponse } from 'next/server';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { successResponse, errorResponse, notFoundResponse } from '@/utils/response';

/**
 * GET /api/sales-orders/[id]/invoice
 * Generate invoice data for a sales order
 * Returns structured invoice data that can be:
 * - Rendered in a print-friendly format
 * - Converted to PDF
 * - Shared via WhatsApp/Email (when implemented)
 * 
 * Query parameters:
 * - format: json (default) | html | pdf (future)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = request.nextUrl;
    const format = searchParams.get('format') || 'json';
    const salesOrderId = params.id;

    // Get sales order with all details
    const salesOrder = await salesOrderRepository.findById(salesOrderId);
    if (!salesOrder) {
      return NextResponse.json(notFoundResponse('Sales Order'), { status: 404 });
    }

    // Build invoice data structure
    const invoiceData = {
      // Invoice header
      invoice: {
        number: salesOrder.invoiceNumber,
        date: salesOrder.orderDate,
        status: salesOrder.status,
        type: salesOrder.orderType,
      },

      // Customer details
      customer: {
        id: salesOrder.customer.id,
        name: salesOrder.customer.name,
        phone: salesOrder.customer.phone,
        email: salesOrder.customer.email,
        whatsapp: salesOrder.customer.whatsapp,
        address: salesOrder.customer.address,
        city: salesOrder.customer.city,
        customerType: salesOrder.customer.customerType,
      },

      // Line items with full details
      items: salesOrder.lines.map((line) => ({
        lineNumber: line.id,
        product: {
          name: line.stockItem?.product.name || '',
          metalType: line.stockItem?.product.metalType || '',
          purity: line.stockItem?.product.purity || '',
          grossWeight: Number(line.stockItem?.product.grossWeight || 0),
          netWeight: Number(line.stockItem?.product.netWeight || 0),
          stoneWeight: line.stockItem?.product.stoneWeight
            ? Number(line.stockItem.product.stoneWeight)
            : null,
          stoneValue: line.stockItem?.product.stoneValue
            ? Number(line.stockItem.product.stoneValue)
            : null,
          makingCharges: Number(line.stockItem?.product.makingCharges || 0),
          wastagePercent: Number(line.stockItem?.product.wastagePercent || 0),
          huid: line.stockItem?.product.huid || '',
          hallmarkNumber: line.stockItem?.product.hallmarkNumber || '',
          tagNumber: line.stockItem?.product.tagNumber || '',
        },
        stockItem: {
          tagId: line.stockItem?.tagId || '',
          barcode: line.stockItem?.barcode || '',
        },
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
        lineTotal: Number(line.lineTotal),
      })),

      // Financial summary
      summary: {
        orderTotal: Number(salesOrder.orderTotal),
        discountAmount: Number(salesOrder.discountAmount),
        finalAmount: Number(salesOrder.finalAmount),
        paidAmount: Number(salesOrder.paidAmount),
        pendingAmount: Number(salesOrder.finalAmount) - Number(salesOrder.paidAmount),
        paymentMethod: salesOrder.paymentMethod,
        paymentStatus: salesOrder.paymentStatus,
      },

      // Payment history
      payments: salesOrder.payments?.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
      })) || [],

      // Additional notes
      notes: salesOrder.notes,

      // Metadata
      metadata: {
        createdAt: salesOrder.createdAt,
        updatedAt: salesOrder.updatedAt,
        totalItems: salesOrder.lines.length,
      },
    };

    if (format === 'json') {
      return NextResponse.json(successResponse(invoiceData), { status: 200 });
    } else if (format === 'html') {
      // Generate HTML invoice for printing
      const html = generateInvoiceHTML(invoiceData);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } else {
      return NextResponse.json(
        errorResponse('Invalid format. Supported formats: json, html'),
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

/**
 * Generate HTML invoice template - Elegant PDF-ready design
 */
function generateInvoiceHTML(data: any): string {
  const invoiceDate = new Date(data.invoice.date);
  const formattedDate = invoiceDate.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoice.number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.6;
    }
    
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
      background: white;
    }
    
    /* Header Section */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 3px solid #D4AF37;
    }
    
    .company-info h1 {
      font-size: 32px;
      font-weight: 700;
      color: #D4AF37;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    
    .company-info .tagline {
      font-size: 13px;
      color: #666;
      font-weight: 400;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    .invoice-meta {
      text-align: right;
    }
    
    .invoice-title {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    
    .invoice-number {
      font-size: 16px;
      color: #666;
      font-weight: 500;
      font-family: 'Courier New', monospace;
    }
    
    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .info-box {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #D4AF37;
    }
    
    .info-box h3 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 12px;
    }
    
    .info-box p {
      font-size: 14px;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    .info-box .highlight {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    /* Items Table */
    .items-section {
      margin-bottom: 30px;
    }
    
    .section-heading {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #1a1a1a;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    thead {
      background: #1a1a1a;
      color: white;
    }
    
    thead th {
      padding: 12px 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    tbody td {
      padding: 14px 10px;
      font-size: 13px;
      border-bottom: 1px solid #e8e8e8;
    }
    
    tbody tr:hover {
      background: #fafafa;
    }
    
    .item-name {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 14px;
    }
    
    .item-details {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }
    
    .item-badge {
      display: inline-block;
      background: #D4AF37;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 4px;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    /* Summary Section */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 30px;
    }
    
    .summary-box {
      width: 400px;
      background: #f9f9f9;
      padding: 25px;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    
    .summary-row.subtotal {
      color: #666;
    }
    
    .summary-row.discount {
      color: #28a745;
      font-weight: 500;
    }
    
    .summary-row.total {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 3px solid #D4AF37;
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .summary-row.paid {
      color: #28a745;
      font-weight: 600;
      font-size: 15px;
    }
    
    .summary-row.balance {
      color: #dc3545;
      font-weight: 700;
      font-size: 16px;
      background: #fff3cd;
      padding: 12px;
      margin: 10px -10px 0;
      border-radius: 6px;
    }
    
    /* Payment History */
    .payment-history {
      margin-top: 30px;
      padding: 20px;
      background: #f0f8ff;
      border-radius: 8px;
      border-left: 4px solid #0070f3;
    }
    
    .payment-history h3 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0070f3;
      margin-bottom: 15px;
    }
    
    .payment-history table thead {
      background: #0070f3;
    }
    
    /* Notes Section */
    .notes-section {
      margin-top: 30px;
      padding: 20px;
      background: #fffef0;
      border-radius: 8px;
      border-left: 4px solid #ffb800;
    }
    
    .notes-section h3 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .notes-section p {
      font-size: 13px;
      color: #333;
      white-space: pre-wrap;
    }
    
    /* Footer */
    .invoice-footer {
      margin-top: 50px;
      padding-top: 25px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
    }
    
    .footer-message {
      font-size: 16px;
      font-weight: 600;
      color: #D4AF37;
      margin-bottom: 10px;
    }
    
    .footer-note {
      font-size: 11px;
      color: #999;
      margin-top: 15px;
    }
    
    .declaration {
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 6px;
      font-size: 11px;
      color: #666;
      text-align: left;
      line-height: 1.5;
    }
    
    /* Print Styles */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .invoice-container {
        padding: 0;
        max-width: 100%;
      }
      
      .no-print {
        display: none !important;
      }
      
      thead {
        background: #1a1a1a !important;
        color: white !important;
      }
      
      .payment-history table thead {
        background: #0070f3 !important;
      }
    }
    
    @page {
      margin: 15mm;
      size: A4 portrait;
    }
    
    /* Print Button */
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #D4AF37;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
      transition: all 0.3s ease;
      z-index: 1000;
    }
    
    .print-button:hover {
      background: #c5a028;
      box-shadow: 0 6px 25px rgba(212, 175, 55, 0.6);
      transform: translateY(-2px);
    }
    
    .print-button:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        <h1>BOOLA GOLD</h1>
        <div class="tagline">Fine Jewelry & Ornaments</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-number">#${data.invoice.number}</div>
      </div>
    </div>
    
    <!-- Info Grid -->
    <div class="info-grid">
      <!-- Customer Information -->
      <div class="info-box">
        <h3>Bill To</h3>
        <p class="highlight">${data.customer.name}</p>
        <p>${data.customer.phone}</p>
        ${data.customer.email ? `<p>${data.customer.email}</p>` : ''}
        ${data.customer.address ? `<p>${data.customer.address}</p>` : ''}
        ${data.customer.city ? `<p>${data.customer.city}</p>` : ''}
        <p style="margin-top: 8px; font-size: 12px; color: #666;">
          Customer Type: <strong>${data.customer.customerType}</strong>
        </p>
      </div>
      
      <!-- Invoice Details -->
      <div class="info-box">
        <h3>Invoice Details</h3>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${invoiceDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        <p><strong>Order Type:</strong> ${data.invoice.type}</p>
        <p><strong>Payment Method:</strong> ${data.summary.paymentMethod}</p>
        <p style="margin-top: 8px;">
          <strong>Status:</strong> 
          <span style="display: inline-block; background: ${data.invoice.status === 'COMPLETED' ? '#d5f4e6' : '#fff4e6'}; color: ${data.invoice.status === 'COMPLETED' ? '#00b894' : '#e67e22'}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
            ${data.invoice.status}
          </span>
        </p>
      </div>
    </div>
    
    <!-- Items Table -->
    <div class="items-section">
      <div class="section-heading">Items Purchased</div>
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 35%;">Description</th>
            <th style="width: 15%;">Tag / HUID</th>
            <th style="width: 15%;">Weight (g)</th>
            <th style="width: 8%;" class="text-center">Qty</th>
            <th style="width: 11%;" class="text-right">Unit Price</th>
            <th style="width: 11%;" class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item: any, index: number) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>
                <div class="item-name">${item.product.name}</div>
                <div class="item-details">
                  ${item.product.metalType} - ${item.product.purity}
                  ${item.product.hallmarkNumber ? `<br>Hallmark: ${item.product.hallmarkNumber}` : ''}
                </div>
                ${item.product.huid ? `<span class="item-badge">HUID Certified</span>` : ''}
              </td>
              <td style="font-family: 'Courier New', monospace; font-size: 12px;">
                <strong>${item.stockItem.tagId}</strong>
                ${item.product.huid ? `<br><span style="font-size: 10px; color: #666;">${item.product.huid}</span>` : ''}
              </td>
              <td>
                <div style="font-size: 13px;">
                  <strong>Net:</strong> ${item.product.netWeight.toFixed(3)}g<br>
                  <span style="color: #666; font-size: 12px;">Gross: ${item.product.grossWeight.toFixed(3)}g</span>
                  ${item.product.stoneWeight ? `<br><span style="color: #666; font-size: 12px;">Stone: ${item.product.stoneWeight.toFixed(3)}g</span>` : ''}
                </div>
              </td>
              <td class="text-center"><strong>${item.quantity}</strong></td>
              <td class="text-right">₹${item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td class="text-right"><strong>₹${item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Summary -->
    <div class="summary-section">
      <div class="summary-box">
        <div class="summary-row subtotal">
          <span>Subtotal</span>
          <span>₹${data.summary.orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        ${data.summary.discountAmount > 0 ? `
        <div class="summary-row discount">
          <span>Discount</span>
          <span>- ₹${data.summary.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        ` : ''}
        <div class="summary-row total">
          <span>Total Amount</span>
          <span>₹${data.summary.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="summary-row paid">
          <span>Amount Paid</span>
          <span>₹${data.summary.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        ${data.summary.pendingAmount > 0 ? `
        <div class="summary-row balance">
          <span>Balance Due</span>
          <span>₹${data.summary.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Payment History -->
    ${data.payments.length > 0 ? `
    <div class="payment-history">
      <h3>💳 Payment History</h3>
      <table>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Payment Method</th>
            <th>Reference Number</th>
            <th class="text-right">Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          ${data.payments.map((payment: any) => `
            <tr>
              <td>${new Date(payment.paymentDate).toLocaleString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</td>
              <td>${payment.paymentMethod}</td>
              <td style="font-family: 'Courier New', monospace; font-size: 12px;">${payment.referenceNumber || '-'}</td>
              <td class="text-right" style="color: #28a745; font-weight: 600;">₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <!-- Notes -->
    ${data.notes ? `
    <div class="notes-section">
      <h3>Additional Notes</h3>
      <p>${data.notes}</p>
    </div>
    ` : ''}
    
    <!-- Declaration -->
    <div class="declaration">
      <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. This is a computer-generated invoice and does not require a physical signature.
    </div>
    
    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-message">✨ Thank you for your patronage! ✨</div>
      <div style="font-size: 13px; color: #666; margin-top: 10px;">
        For any queries, please contact us at your earliest convenience.
      </div>
      <div class="footer-note">
        Invoice generated on ${new Date().toLocaleString('en-IN')}<br>
        This is a computer-generated document. No signature required.
      </div>
    </div>
  </div>
  
  <!-- Print Button -->
  <button class="print-button no-print" onclick="window.print()">
    🖨️ Print / Save as PDF
  </button>
  
  <script>
    // Auto-focus for quick printing (optional)
    // window.addEventListener('load', () => {
    //   setTimeout(() => window.print(), 500);
    // });
  </script>
</body>
</html>
  `.trim();
}
