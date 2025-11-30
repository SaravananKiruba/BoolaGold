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
          name: line.stockItem.product.name,
          metalType: line.stockItem.product.metalType,
          purity: line.stockItem.product.purity,
          grossWeight: Number(line.stockItem.product.grossWeight),
          netWeight: Number(line.stockItem.product.netWeight),
          stoneWeight: line.stockItem.product.stoneWeight
            ? Number(line.stockItem.product.stoneWeight)
            : null,
          stoneValue: line.stockItem.product.stoneValue
            ? Number(line.stockItem.product.stoneValue)
            : null,
          makingCharges: Number(line.stockItem.product.makingCharges),
          wastagePercent: Number(line.stockItem.product.wastagePercent),
          huid: line.stockItem.product.huid,
          hallmarkNumber: line.stockItem.product.hallmarkNumber,
          tagNumber: line.stockItem.product.tagNumber,
        },
        stockItem: {
          tagId: line.stockItem.tagId,
          barcode: line.stockItem.barcode,
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
 * Generate HTML invoice template
 */
function generateInvoiceHTML(data: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${data.invoice.number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #d4af37; margin-bottom: 5px; }
    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .text-right { text-align: right; }
    .summary { margin-top: 30px; float: right; width: 300px; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .summary-row.total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
    .footer { margin-top: 50px; text-align: center; color: #666; font-size: 0.9em; clear: both; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>JEWELRY STORE</h1>
    <p>Tax Invoice</p>
  </div>

  <div class="invoice-details">
    <div>
      <div class="section-title">Invoice Details</div>
      <p><strong>Invoice #:</strong> ${data.invoice.number}</p>
      <p><strong>Date:</strong> ${new Date(data.invoice.date).toLocaleDateString('en-IN')}</p>
      <p><strong>Type:</strong> ${data.invoice.type}</p>
      <p><strong>Status:</strong> ${data.invoice.status}</p>
    </div>
    <div>
      <div class="section-title">Customer Details</div>
      <p><strong>${data.customer.name}</strong></p>
      <p>${data.customer.phone}</p>
      ${data.customer.email ? `<p>${data.customer.email}</p>` : ''}
      ${data.customer.address ? `<p>${data.customer.address}</p>` : ''}
      ${data.customer.city ? `<p>${data.customer.city}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Tag/HUID</th>
          <th>Weight</th>
          <th>Qty</th>
          <th class="text-right">Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item: any) => `
          <tr>
            <td>
              <strong>${item.product.name}</strong><br>
              ${item.product.metalType} ${item.product.purity}
              ${item.product.hallmarkNumber ? `<br>Hallmark: ${item.product.hallmarkNumber}` : ''}
            </td>
            <td>
              ${item.stockItem.tagId}<br>
              ${item.product.huid ? `HUID: ${item.product.huid}` : ''}
            </td>
            <td>
              Net: ${item.product.netWeight.toFixed(3)}g<br>
              Gross: ${item.product.grossWeight.toFixed(3)}g
            </td>
            <td>${item.quantity}</td>
            <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
            <td class="text-right">₹${item.lineTotal.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="summary">
    <div class="summary-row">
      <span>Subtotal:</span>
      <span>₹${data.summary.orderTotal.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Discount:</span>
      <span>- ₹${data.summary.discountAmount.toFixed(2)}</span>
    </div>
    <div class="summary-row total">
      <span>Total Amount:</span>
      <span>₹${data.summary.finalAmount.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Paid:</span>
      <span>₹${data.summary.paidAmount.toFixed(2)}</span>
    </div>
    ${data.summary.pendingAmount > 0 ? `
    <div class="summary-row" style="color: #d9534f;">
      <span>Balance Due:</span>
      <span>₹${data.summary.pendingAmount.toFixed(2)}</span>
    </div>
    ` : ''}
  </div>

  ${data.payments.length > 0 ? `
  <div class="section" style="clear: both; margin-top: 20px;">
    <div class="section-title">Payment History</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Method</th>
          <th>Reference</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.payments.map((payment: any) => `
          <tr>
            <td>${new Date(payment.paymentDate).toLocaleDateString('en-IN')}</td>
            <td>${payment.paymentMethod}</td>
            <td>${payment.referenceNumber || '-'}</td>
            <td class="text-right">₹${payment.amount.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${data.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <p>${data.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p style="margin-top: 10px;">This is a computer-generated invoice.</p>
    <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
      Print Invoice
    </button>
  </div>
</body>
</html>
  `.trim();
}
