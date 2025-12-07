# Jewelry Store Management System

A **production-ready**, full-stack Next.js application for comprehensive jewelry store management. Built with TypeScript, Prisma ORM, and MySQL, implementing clean architecture and domain-driven design principles.

## 🏢 Multi-Tenant SaaS Architecture

✨ **FULLY IMPLEMENTED**: Complete SaaS platform for jewelry shops with enhanced Super Admin features!

### 🎛️ Super Admin Features (Platform Owner)
- **Separate Navigation**: Dedicated Super Admin interface (no shop-specific menus)
- **Enhanced Dashboard**: System-wide metrics and health monitoring
  - Total shops, users, products, sales across platform
  - Shop activation rates and user engagement stats
  - Detailed shop overview table with performance metrics
- **Shop Management**: Full CRUD operations for all jewelry shops
  - Create new shops with complete setup
  - Edit shop details (location, GST, bank info, branding)
  - Activate/Deactivate shops
  - View shop analytics and usage statistics
- **System-Wide User Management**: Manage users across all shops
- **Complete Data Isolation**: Each shop's data is fully protected

### 🏪 Shop Owner/Staff Features (Customers)
- 🔐 **Secure Authentication**: JWT-based with bcrypt password hashing
- 👥 **Role-Based Access Control**: OWNER, SALES, ACCOUNTS roles
- 🔒 **Data Isolation**: Complete separation between shops
- ⚙️ **Dynamic Configuration**: Per-shop branding and settings
- 💼 **Business Operations**: Full jewelry management features

### User Role Hierarchy
```
SUPER_ADMIN (You - Platform Owner)
    ├── Manages ALL shops in system
    ├── Creates and configures shops
    ├── Views system-wide analytics
    └── shopId = NULL (operates above shop level)

OWNER (Shop Owner - Your Customer)
    ├── Full control of THEIR shop only
    ├── Manages shop staff and configuration
    ├── Full access to shop operations
    └── shopId = specific shop

SALES/ACCOUNTS (Shop Staff)
    ├── Role-based permissions
    ├── Works within one shop
    └── shopId = specific shop
```

## 🎯 Features Overview

This system covers **all 30 user stories** across the following modules:

### 🙋 Customer Management (Stories 1-2)
- Customer registration with complete profiles
- Family member tracking for occasion-based marketing
- Customer types: Retail, Wholesale, VIP
- Purchase history tracking
- Advanced search and filtering

### 💍 Product Management (Stories 3-5) ✅ FULLY IMPLEMENTED
- ✅ Jewelry item registration with complete specifications
- ✅ Metal types: Gold, Silver, Platinum with purity levels (22k, 18k, 24k, etc.)
- ✅ Gross weight and net weight with 3-decimal precision
- ✅ Auto-generated barcodes for each product
- ✅ HUID (Hallmark Unique ID) for BIS compliance
- ✅ Tag numbers for physical tracking
- ✅ Complete product descriptions and design information
- ✅ Making charges (fixed amount) and wastage percentage
- ✅ Stone details: weight, value, and description
- ✅ Hallmark number and BIS certification status
- ✅ Collection name, design, and size information
- ✅ Supplier selection and tracking
- ✅ Stock quantity tracking and reorder level alerts
- ✅ Active/inactive status management
- ✅ Custom order flag support
- ✅ **Automatic price calculation** based on metal rate and weight
  - Effective Weight = Net Weight × (1 + Wastage% / 100)
  - Metal Amount = Effective Weight × Metal Rate (per gram)
  - Total Price = Metal Amount + Making Charges + Stone Value
- ✅ **Price override capability** with reason logging
- ✅ **Advanced search and filtering**:
  - Search by product name, barcode, HUID, tag number, description
  - Filter by metal type, purity, collection name
  - Filter by supplier
  - Filter by stock status (Available/Reserved/Sold)
  - Filter by active status and custom order flag
  - Low stock alerts
- ✅ **Price breakdown display** showing complete calculation details
- ✅ **Bulk price recalculation** based on updated metal rates
- ✅ Price staleness warnings when rates are outdated

### 📦 Stock Management (Stories 6-8)
- Individual item tracking with unique tag IDs and barcodes
- FIFO (First-In-First-Out) inventory method
- Real-time stock availability
- Status tracking: Available, Reserved, Sold
- Low stock alerts
- Purchase cost and selling price per item

### 🏭 Supplier Management (Story 9)
- Supplier registration and profiles
- Contact management
- Purchase order history

### 🛒 Purchase Order Management (Stories 10-11, 27)
- Create and manage purchase orders
- Item receipt tracking (full/partial)
- Payment tracking (pending/partial/paid)
- Automatic stock item generation on receipt
- Supplier payment management

### 💰 Sales Order Management (Stories 12-14, 26) ✅ FULLY IMPLEMENTED
- ✅ Invoice generation with auto-numbering (INV-YYYYMMDD-XXXX)
- ✅ Stock validation before sale (prevents overselling)
- ✅ FIFO-based item selection (oldest stock first)
- ✅ Discount management (flat amount)
- ✅ Multiple payment methods (Cash/Card/UPI/EMI/Bank Transfer)
- ✅ Automatic transaction creation (income entries)
- ✅ Order types: Retail, Wholesale, Custom, Exchange
- ✅ Order status tracking: Pending, Completed, Cancelled
- ✅ Stock reservation for pending orders
- ✅ Auto-release stock on order cancellation
- ✅ Payment status tracking (Pending/Partial/Paid)
- ✅ Order search and filtering by customer, date, status, payment method
- ✅ Complete order cancellation with stock release

### 💵 Financial Management (Stories 15-17, 25) ✅ FULLY IMPLEMENTED
- ✅ Complete transaction recording with all transaction types
- ✅ Transaction types: Income, Expense, EMI, Metal Purchase, Gold Scheme, Adjustment
- ✅ Income and expense tracking by category
- ✅ Metal purchase tracking with weight/rate details (weight, purity, rate per gram)
- ✅ Payment collection against sales orders
- ✅ Partial payment support
- ✅ EMI payment tracking with installments
- ✅ Installment payment recording
- ✅ Overdue installment tracking and alerts
- ✅ Upcoming installment notifications
- ✅ Customer EMI summary
- ✅ Financial dashboard with income/expense/net income
- ✅ Transaction search and filtering
- ✅ Payment method tracking
- ✅ Reference number management

### 📊 Rate Master (Stories 18-19) ✅ FULLY IMPLEMENTED
- ✅ Daily gold/silver/platinum rate management
- ✅ Metal type selection: Gold, Silver, Platinum
- ✅ Purity-wise rate tracking (22K, 18K, 24K, 925, etc.)
- ✅ Rate per gram (positive decimal values)
- ✅ Effective date and time tracking
- ✅ Valid until date (optional expiration)
- ✅ Rate source tracking: Market/Manual/API
- ✅ Active/inactive status management
- ✅ User tracking: Created by and Updated by fields
- ✅ Optional default making charge percentage
- ✅ **Rate history viewing** with complete audit trail
  - View all historical rates for any metal type and purity
  - Pagination support for large histories
  - Filter by date range, source, and status
- ✅ **Current rate indicator** per metal & purity combination
  - Automatically identifies the most recent active rate
  - Dashboard view of all current rates
  - Quick access to rate history
- ✅ **Bulk product price updates** based on new rates (User Story 19)
  - Select products to update by filters:
    - Metal type and purity
    - Collection name
    - Specific product IDs
  - Automatic price recalculation using:
    - Net weight from product
    - Wastage percentage
    - Effective weight calculation
    - New metal rate per gram
    - Making charges (preserved from product)
    - Stone value (unchanged)
  - **Preview mode** showing old vs new prices
  - Price difference and percentage change calculation
  - Confirm bulk update with one click
  - Last price update date tracking on each product
  - **Rate change impact logging**:
    - Who performed the update
    - When it was performed
    - Which rate master was used
    - Count of products updated
  - **Exception handling**:
    - Skip items with custom/fixed price flag
    - Show list of skipped items with reasons
    - Continue processing remaining products
- ✅ Rate statistics and analytics
- ✅ Automatic rate deactivation when new rate is activated

### 💳 EMI Management (Story 16) ✅ FULLY IMPLEMENTED
- ✅ EMI plan creation with interest calculation
- ✅ Multiple installment support (configurable)
- ✅ Installment tracking with due dates
- ✅ Payment collection per installment
- ✅ Partial installment payment support
- ✅ Overdue alerts and status management
- ✅ Automatic next installment date calculation
- ✅ Remaining amount tracking
- ✅ Installment status: Pending, Paid, Overdue
- ✅ Customer-wise EMI summary
- ✅ Upcoming installment notifications (7-day window)
- ✅ Overdue marking (automated/manual)

### 📈 Reports & Analytics (Stories 20-25) ✅ FULLY IMPLEMENTED
- ✅ **Dashboard Overview** with key business metrics
  - Total products, customers, orders count
  - Total revenue with date range filtering
  - Average order value calculation
  - Last order details and date
  - Today's orders and revenue insights
  - Payment status breakdown
  - Quick navigation to all modules
  - Export dashboard summary (JSON)
  - Real-time data refresh
- ✅ **Sales Reports** with comprehensive analysis
  - Date range selection for reporting period
  - Total sales amount and order count
  - Sales breakdown by payment method (Cash/Credit/Card/EMI/UPI/Bank Transfer)
  - Total discount amount tracking
  - Customer-wise sales analysis (name, phone, orders, total amount)
  - Product-wise sales analysis (quantity sold, total sales, average price)
  - Top 5 selling products by quantity and value
  - Monthly sales trend graphs
  - Export to JSON
- ✅ **Inventory Reports** with valuation
  - Total products count and stock quantity
  - Total inventory value (purchase cost or selling price basis)
  - Metal-wise breakdown (Gold, Silver, Platinum)
    - Count, total weight, total value per metal type
    - Purity-wise sub-breakdown
  - Low stock alerts (below reorder level)
  - Product details report (ID, name, metal, purity, weights, stock, value, HUID, tag)
  - Stock movement report (opening, additions, sales, closing stock)
  - Filter by metal type and collection
  - Export to JSON
- ✅ **Customer Reports** with behavior analysis
  - Date range and customer type filtering
  - Total customers and purchases amount
  - Customer-wise purchase details (name, phone, total value, order count, last purchase date, pending payments)
  - Top customers by purchase value
  - New customer acquisition metrics
  - Customer retention rate calculation
  - Repeat vs new customers analysis
  - Customer type breakdown (Retail/Wholesale/VIP)
  - Export to JSON
- ✅ **Sales Summary Export** for accounting
  - Structured export for CA/external systems
  - Invoice-wise details (number, date, customer, amount, payment status)
  - Category-wise totals (by customer type)
  - Export formats: JSON and CSV
  - Date range filtering
- ✅ **Financial Reports** with P&L statement
  - Comprehensive Profit & Loss statement
    - Total income breakdown by category
    - Direct costs (metal purchases)
    - Gross profit calculation
    - Operational expenses
    - Net profit with margin percentage
  - Income breakdown by category
  - Expense breakdown by category
  - Payment mode distribution analysis
  - Cash flow summary (inflow, outflow, net cash flow)
  - Metal purchase expenses by type and purity
  - EMI tracking (total outstanding, received in period)
  - Monthly financial trend (income, expense, net income by month)
  - Export to JSON

### 🔐 Audit & Compliance (Stories 28-30)
- Complete audit trail logging
- BIS Hallmark compliance tracking
- HUID management
- Barcode generation and management
- User action tracking

---

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── domain/              # Domain entities and types
│   └── entities/
│       └── types.ts     # TypeScript interfaces and enums
├── repositories/        # Data access layer
│   ├── customerRepository.ts
│   ├── productRepository.ts
│   ├── stockItemRepository.ts
│   └── salesOrderRepository.ts
├── services/            # Business logic (use-cases)
├── http/                # API routes
│   └── app/api/
├── ui/                  # UI components (React)
│   └── app/
├── utils/               # Shared utilities
│   ├── pagination.ts
│   ├── filters.ts
│   ├── barcode.ts
│   ├── pricing.ts
│   ├── audit.ts
│   ├── validation.ts
│   └── response.ts
└── lib/                 # External libraries config
    └── prisma.ts
```

### Database Schema Highlights

- **17 tables** covering all entities
- **Soft delete** support for all major tables
- **Audit logging** for compliance
- **Relational integrity** with proper foreign keys
- **Indexes** for performance optimization
- **Enums** for status and type management

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MySQL 8.0+
- npm >= 9.0.0

### Installation

1. **Clone the repository** (or use existing folder)
   ```bash
   cd d:\BOOLA\BOOLA_GOLD\BoolaGold\BoolaGold
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/jewelry_store"
   NODE_ENV="development"
   APP_URL="http://localhost:3000"
   ```

4. **Setup database**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Or run migrations
   npm run db:migrate
   ```

5. **Seed sample data**
   ```bash
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open application**
   - Navigate to http://localhost:3000
   - API endpoints available at http://localhost:3000/api/*

---

## 📡 API Endpoints Reference

### Customer Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers (paginated, filterable) |
| POST | `/api/customers` | Create new customer |
| GET | `/api/customers/[id]` | Get customer details with stats |
| PUT | `/api/customers/[id]` | Update customer |
| DELETE | `/api/customers/[id]` | Soft delete customer |

**Query Parameters** (GET):
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)
- `search` - Search by name, phone, email
- `customerType` - Filter by RETAIL/WHOLESALE/VIP
- `isActive` - Filter by active status

**Request Body** (POST):
```json
{
  "name": "Amit Patel",
  "phone": "9123456780",
  "email": "amit@example.com",
  "whatsapp": "9123456780",
  "address": "123 Main St",
  "city": "Mumbai",
  "dateOfBirth": "1985-05-15",
  "anniversaryDate": "2010-12-20",
  "customerType": "RETAIL",
  "isActive": true,
  "familyMembers": [
    {
      "name": "Neha Patel",
      "relation": "Spouse",
      "dateOfBirth": "1987-08-10"
    }
  ]
}
```

### Product Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products with advanced filters and stock counts |
| POST | `/api/products` | Create new product (auto-calculates price) |
| GET | `/api/products/[id]` | Get product details with stock summary |
| PUT | `/api/products/[id]` | Update product (supports price recalculation) |
| DELETE | `/api/products/[id]` | Soft delete product |
| GET | `/api/products/[id]/price-breakdown` | Get detailed price calculation breakdown |
| POST | `/api/products/recalculate-prices` | Bulk recalculate prices based on current rates |

**Query Parameters** (GET `/api/products`):
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `search` - Search by name, barcode, HUID, tag number, description, collection
- `barcode` - Filter by specific barcode
- `huid` - Filter by HUID
- `tagNumber` - Filter by tag number
- `metalType` - Filter by GOLD/SILVER/PLATINUM
- `purity` - Filter by purity (22k, 18k, 24k, etc.)
- `collectionName` - Filter by collection name
- `supplierId` - Filter by supplier
- `stockStatus` - Filter by AVAILABLE/RESERVED/SOLD
- `isActive` - Filter by active status (true/false)
- `isCustomOrder` - Filter custom orders (true/false)
- `lowStock` - Show only low stock products (true)

**Request Body** (POST):
```json
{
  "name": "Gold Necklace - Traditional",
  "metalType": "GOLD",
  "purity": "22k",
  "grossWeight": 25.5,
  "netWeight": 24.0,
  "huid": "HUID22K001",
  "tagNumber": "TAG-001",
  "description": "Beautiful traditional design",
  "makingCharges": 8000.00,
  "wastagePercent": 6.0,
  "stoneWeight": 2.5,
  "stoneValue": 5000.00,
  "stoneDescription": "Natural diamonds, VS quality",
  "hallmarkNumber": "BIS916-001",
  "bisCompliant": true,
  "collectionName": "Wedding Collection",
  "design": "Temple Jewelry",
  "size": "18 inches",
  "supplierId": "supplier-uuid-here",
  "reorderLevel": 2,
  "isActive": true,
  "isCustomOrder": false,
  "calculatePrice": true
}
```

**Response - Price Breakdown** (GET `/api/products/[id]/price-breakdown`):
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "name": "Gold Necklace - Traditional",
      "metalType": "GOLD",
      "purity": "22k",
      "grossWeight": 25.5,
      "netWeight": 24.0,
      "wastagePercent": 6.0,
      "makingCharges": 8000.0,
      "stoneValue": 5000.0
    },
    "currentRate": {
      "id": "rate-uuid",
      "metalType": "GOLD",
      "purity": "22k",
      "ratePerGram": 6500.0,
      "effectiveDate": "2024-01-15T00:00:00Z",
      "rateSource": "MANUAL"
    },
    "currentPriceCalculation": {
      "netWeight": 24.0,
      "wastagePercent": 6.0,
      "effectiveWeight": 25.44,
      "metalRatePerGram": 6500.0,
      "metalAmount": 165360.0,
      "makingCharges": 8000.0,
      "stoneValue": 5000.0,
      "totalPrice": 178360.0
    },
    "storedPrice": {
      "calculatedPrice": 175000.0,
      "lastPriceUpdate": "2024-01-10T10:00:00Z"
    },
    "finalPrice": 178360.0,
    "priceStatus": {
      "isOverridden": false,
      "isOutdated": true,
      "priceDifference": 3360.0
    }
  }
}
```

**Request Body - Bulk Recalculate** (POST `/api/products/recalculate-prices`):
```json
{
### Sales Order Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales-orders` | List all sales orders with filters |
| POST | `/api/sales-orders` | Create new order (validates stock, creates transaction) |
| GET | `/api/sales-orders/[id]` | Get order details with line items |
| PATCH | `/api/sales-orders/[id]` | Update order (cancel, etc.) |
| DELETE | `/api/sales-orders/[id]` | Cancel and soft delete order |
| POST | `/api/sales-orders/[id]/complete` | Complete pending order |
| GET | `/api/sales-orders/[id]/payments` | Get all payments for order |
| POST | `/api/sales-orders/[id]/payments` | Record payment against order |

**Query Parameters** (GET):
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `search` - Search by invoice number, customer name/phone
- `customerId` - Filter by customer
- `status` - Filter by PENDING/COMPLETED/CANCELLED
- `paymentStatus` - Filter by PENDING/PARTIAL/PAID
- `orderType` - Filter by RETAIL/WHOLESALE/CUSTOM/EXCHANGE
- `startDate` - Filter by order date start
- `endDate` - Filter by order date end

**Request Body** (POST):
```json
{
  "customerId": "uuid-here",
  "lines": [
    {
      "stockItemId": "stock-item-uuid",
      "quantity": 1,
      "unitPrice": 165000.00
    }
  ],
  "discountAmount": 5000.00,
  "paymentMethod": "UPI",
  "orderType": "RETAIL",
  "notes": "First purchase discount",
  "paymentAmount": 160000.00,
  "createAsPending": false
}
```

**Request Body - Record Payment** (POST `/api/sales-orders/[id]/payments`):
```json
{
  "amount": 50000.00,
  "paymentMethod": "CASH",
  "referenceNumber": "UTR123456",
  "notes": "Second installment"
}
```

**Automated Actions on Order Creation:**
1. Validates stock availability (FIFO)
2. Marks stock items as SOLD (or RESERVED if pending)
3. Creates income transaction (for completed orders)
4. Updates customer purchase history
5. Generates invoice number (INV-YYYYMMDD-XXXX)
6. Calculates payment status
7. Supports partial payments

**Order Cancellation:**
- Releases all stock items back to AVAILABLE
- Updates order status to CANCELLED
- Soft deletes the order
- Logs audit trail

### Transaction Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List all transactions with filters |
| POST | `/api/transactions` | Create new transaction |
| GET | `/api/transactions/[id]` | Get transaction details |
| PATCH | `/api/transactions/[id]` | Update transaction |
| DELETE | `/api/transactions/[id]` | Soft delete transaction |
| GET | `/api/transactions/summary` | Get financial dashboard summary |

### Reporting & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get business dashboard with key metrics |
| GET | `/api/reports/sales` | Get detailed sales report with analysis |
| GET | `/api/reports/inventory` | Get inventory report with valuation |
| GET | `/api/reports/customers` | Get customer purchase reports |
| GET | `/api/reports/sales-summary` | Get sales summary for accounting (JSON/CSV) |
| GET | `/api/reports/financial` | Get comprehensive financial P&L report |

**Query Parameters - Dashboard** (GET `/api/dashboard`):
- `startDate` - Filter start date for orders/revenue (YYYY-MM-DD)
- `endDate` - Filter end date for orders/revenue (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalProducts": 250,
    "totalCustomers": 150,
    "totalOrders": 85,
    "totalRevenue": 12500000.00,
    "averageOrderValue": 147058.82,
    "lastOrderDate": "2024-01-15T10:30:00Z",
    "lastOrderInvoice": "INV-20240115-0001",
    "lastOrderAmount": 165000.00,
    "insights": "3 orders today, revenue ₹450000.00",
    "todayOrders": 3,
    "todayRevenue": 450000.00,
    "paymentStatusBreakdown": [
      { "status": "PAID", "count": 75, "totalAmount": 11250000.00 },
      { "status": "PENDING", "count": 10, "totalAmount": 1250000.00 }
    ],
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  }
}
```

**Query Parameters - Sales Report** (GET `/api/reports/sales`):
- `startDate` - Report start date (YYYY-MM-DD)
- `endDate` - Report end date (YYYY-MM-DD)

**Query Parameters - Inventory Report** (GET `/api/reports/inventory`):
- `valuationBasis` - PURCHASE or SELLING (default: PURCHASE)
- `metalType` - Filter by GOLD/SILVER/PLATINUM
- `collection` - Filter by collection name

**Query Parameters - Customer Report** (GET `/api/reports/customers`):
- `startDate` - Report start date (YYYY-MM-DD)
- `endDate` - Report end date (YYYY-MM-DD)
- `customerType` - Filter by RETAIL/WHOLESALE/VIP

**Query Parameters - Sales Summary** (GET `/api/reports/sales-summary`):
- `startDate` - Report start date (YYYY-MM-DD)
- `endDate` - Report end date (YYYY-MM-DD)
- `format` - Export format: json or csv (default: json)

**Query Parameters - Financial Report** (GET `/api/reports/financial`):
- `startDate` - Report start date (YYYY-MM-DD)
- `endDate` - Report end date (YYYY-MM-DD)

**Query Parameters** (GET):
- `page` - Page number
- `pageSize` - Items per page
- `search` - Search by reference, description, customer
- `transactionType` - Filter by INCOME/EXPENSE/EMI/METAL_PURCHASE/GOLD_SCHEME/ADJUSTMENT
- `category` - Filter by SALES/PURCHASE/OPERATIONAL/OTHER
- `status` - Filter by COMPLETED/PENDING/FAILED
- `customerId` - Filter by customer
- `salesOrderId` - Filter by sales order
- `paymentMode` - Filter by payment method
- `startDate` - Filter by transaction date start
- `endDate` - Filter by transaction date end

**Request Body** (POST):
```json
{
  "transactionDate": "2024-01-15T10:30:00Z",
  "transactionType": "METAL_PURCHASE",
  "amount": 156000.00,
  "paymentMode": "BANK_TRANSFER",
  "category": "PURCHASE",
  "description": "Gold purchase from supplier",
  "referenceNumber": "REF-2024-001",
  "customerId": "uuid-optional",
  "salesOrderId": "uuid-optional",
  "status": "COMPLETED",
  "currency": "INR",
  "metalType": "GOLD",
  "metalPurity": "24k",
  "metalWeight": 24.0,
  "metalRatePerGram": 6500.0,
  "createdBy": "user-id"
}
```

### EMI Payment Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emi-payments` | List all EMI payments |
| POST | `/api/emi-payments` | Create new EMI plan |
| GET | `/api/emi-payments/[id]` | Get EMI details with installments |
| DELETE | `/api/emi-payments/[id]` | Soft delete EMI plan |
| POST | `/api/emi-payments/[id]/pay-installment` | Record installment payment |
| GET | `/api/emi-payments/overdue` | Get all overdue EMIs |
| POST | `/api/emi-payments/overdue/mark` | Mark overdue installments |
| GET | `/api/emi-payments/upcoming` | Get upcoming installments |

**Query Parameters** (GET):
- `page` - Page number
- `pageSize` - Items per page
- `customerId` - Filter by customer
- `status` - Filter by PENDING/PAID/OVERDUE
- `overdue` - Show only overdue (true/false)

**Query Parameters** (GET `/api/emi-payments/upcoming`):
- `days` - Number of days to look ahead (default: 7)

**Request Body** (POST):
```json
{
  "customerId": "uuid-here",
  "salesOrderId": "uuid-optional",
  "totalAmount": 150000.00,
  "interestRate": 12.0,
  "numberOfInstallments": 12,
  "installmentAmount": 13200.00,
  "emiStartDate": "2024-02-01T00:00:00Z"
}
```

**Request Body - Pay Installment** (POST `/api/emi-payments/[id]/pay-installment`):
```json
{
  "installmentId": "installment-uuid",
  "amount": 13200.00,
  "paymentMode": "UPI",
  "referenceNumber": "UPI123456"
}
```

### Stock Reservation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stock/reserve?action=reserve` | Reserve stock items |
| POST | `/api/stock/reserve?action=release` | Release reserved stock items |

**Request Body - Reserve**:
```json
{
  "stockItemIds": ["uuid1", "uuid2", "uuid3"],
  "reservationNote": "Reserved for customer inquiry"
}
```

**Request Body - Release**:
```json
{
  "stockItemIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Rate Master Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rate-master` | List all rates with filters and pagination |
| POST | `/api/rate-master` | Create new rate master entry |
| GET | `/api/rate-master/[id]` | Get specific rate master details |
| PUT | `/api/rate-master/[id]` | Update rate master entry |
| DELETE | `/api/rate-master/[id]` | Delete rate master entry |
| GET | `/api/rate-master/current` | Get all current active rates |
| GET | `/api/rate-master/history/[metalType]/[purity]` | Get rate history for specific metal & purity |
| POST | `/api/rate-master/bulk-update-prices` | Bulk update product prices based on new rate |

**Query Parameters** (GET `/api/rate-master`):
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `metalType` - Filter by GOLD/SILVER/PLATINUM
- `purity` - Filter by purity (22K, 18K, 24K, 925, etc.)
- `rateSource` - Filter by MARKET/MANUAL/API
- `isActive` - Filter by active status (true/false)
- `effectiveDateFrom` - Filter by effective date start
- `effectiveDateTo` - Filter by effective date end

**Request Body** (POST `/api/rate-master`):
```json
{
  "metalType": "GOLD",
  "purity": "22K",
  "ratePerGram": 6500.00,
  "effectiveDate": "2024-01-15T09:00:00Z",
  "validUntil": "2024-01-15T23:59:59Z",
  "rateSource": "MANUAL",
  "isActive": true,
  "defaultMakingChargePercent": 10.0,
  "createdBy": "admin-user"
}
```

**Request Body** (PUT `/api/rate-master/[id]`):
```json
{
  "ratePerGram": 6550.00,
  "isActive": true,
  "validUntil": "2024-01-16T23:59:59Z",
  "updatedBy": "admin-user"
}
```

**Request Body - Bulk Price Update** (POST `/api/rate-master/bulk-update-prices`):
```json
{
  "rateId": "rate-master-uuid",
  "productFilters": {
    "metalType": "GOLD",
    "purity": "22K",
    "collectionName": "Bridal Collection",
    "productIds": ["uuid1", "uuid2"]
  },
  "skipCustomPrices": true,
  "preview": true,
  "performedBy": "admin-user"
}
```

**Response - Bulk Price Update Preview**:
```json
{
  "success": true,
  "data": {
    "preview": true,
    "totalProducts": 25,
    "productsToUpdate": 23,
    "productsSkipped": 2,
    "priceChanges": [
      {
        "productId": "uuid",
        "productName": "Gold Necklace",
        "barcode": "PRD-001",
        "metalType": "GOLD",
        "purity": "22K",
        "netWeight": 24.0,
        "wastagePercent": 6.0,
        "effectiveWeight": 25.44,
        "oldRate": 6500.00,
        "newRate": 6550.00,
        "oldPrice": 178360.00,
        "newPrice": 179632.00,
        "priceDifference": 1272.00,
        "percentageChange": 0.71,
        "makingCharges": 8000.00,
        "stoneValue": 5000.00
      }
    ],
    "skippedProducts": [
      {
        "id": "uuid",
        "name": "Special Order Ring",
        "barcode": "PRD-002",
        "reason": "Has custom price override"
      }
    ],
    "rateMaster": {
      "id": "rate-uuid",
      "metalType": "GOLD",
      "purity": "22K",
      "ratePerGram": 6550.00,
      "effectiveDate": "2024-01-15T09:00:00Z"
    }
  }
}
```

**Automated Actions on Rate Master Creation:**
1. Validates date logic (validUntil must be after effectiveDate)
2. Deactivates old rates for same metal type and purity when new rate is set as active
3. Logs the rate creation in audit trail
4. Makes rate available for product price calculations immediately

**Automated Actions on Bulk Price Update:**
1. Filters products by specified criteria
2. Skips products with custom price overrides (if configured)
3. Recalculates prices using current product weights, wastage, making charges
4. Preserves stone values (unchanged by rate updates)
5. Shows preview before actual update
6. Updates lastPriceUpdate timestamp on each product
7. Links products to the rate master used
8. Logs the bulk update operation with complete details

**Automated Actions on Order Creation:**
1. Validates stock availability (FIFO)
2. Marks stock items as SOLD
3. Creates income transaction
4. Updates customer purchase history
5. Generates invoice number
6. Calculates payment status

---

## 🧮 Price Calculation Logic

The system implements sophisticated price calculation:

```typescript
// Effective Weight Calculation
effectiveWeight = netWeight × (1 + wastagePercent / 100)

// Metal Amount Calculation
metalAmount = effectiveWeight × metalRatePerGram

// Total Price Calculation
totalPrice = metalAmount + makingCharges + stoneValue
```

**Example:**
- Net Weight: 24.0g
- Wastage: 6%
- Rate: ₹6,500/g
- Making Charges: ₹8,000
- Stone Value: ₹5,000

```
Effective Weight = 24.0 × 1.06 = 25.44g
Metal Amount = 25.44 × 6,500 = ₹165,360
Total Price = ₹165,360 + ₹8,000 + ₹5,000 = ₹178,360
```

---

## 🗄️ Database Schema Highlights

### Key Tables

- **customers** - Customer profiles with soft delete
- **family_members** - Family tracking for occasions
- **products** - Jewelry product catalog
- **stock_items** - Individual item tracking (FIFO)
- **rate_master** - Metal rates by type and purity
- **suppliers** - Vendor management
- **purchase_orders** - Purchase order management
- **purchase_order_items** - PO line items
- **sales_orders** - Sales invoices
- **sales_order_lines** - Invoice line items
- **transactions** - Financial transactions
- **emi_payments** - EMI plan tracking
- **emi_installments** - Individual installments
- **audit_logs** - Complete audit trail
- **bis_compliance** - Hallmark compliance tracking

---

## 🔧 Development Scripts

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
npm run format:check       # Check formatting
npm run type-check         # TypeScript type checking

# Database
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema to database (dev)
npm run db:migrate         # Create and run migrations
npm run db:migrate:deploy  # Deploy migrations (production)
npm run db:seed            # Seed sample data
npm run db:studio          # Open Prisma Studio
npm run db:reset           # Reset database (DANGER!)
```

---

## 📚 Core Utilities

### Pagination
- Normalized pagination with configurable defaults
- Metadata includes total pages, has next/previous
- Maximum page size protection

### Filtering
- Date range filters
- Search across multiple fields
- Soft delete filtering
- Sort by any field

### Barcode Generation
- Product barcodes: `PRD-XXXXXXXX-XXXX`
- Tag IDs: `G22-12345678-ABCD` (Metal+Purity-Timestamp-Random)
- Invoice numbers: `INV-YYYYMMDD-XXXX`
- Purchase orders: `PO-YYYYMMDD-XXXX`

### Audit Logging
- Automatic logging for all CRUD operations
- Before/after data snapshots
- User tracking
- Module and severity classification

---

## 🎨 Frontend Pages

### Implemented Pages
- `/` - Dashboard/Home with module navigation
- `/dashboard` - Business overview dashboard with metrics
- `/customers` - Customer listing
- `/products` - Product catalog
- `/sales-orders` - Sales order management
- `/stock` - Stock management
- `/suppliers` - Supplier management
- `/purchase-orders` - Purchase order workflow
- `/rate-master` - Rate management with bulk update
- `/reports` - Comprehensive analytics and reports
  - Sales reports with analysis
  - Inventory reports with valuation
  - Customer purchase reports
  - Sales summary export (JSON/CSV)
  - Financial P&L reports

### To Implement (Next Steps)
- `/transactions` - Direct financial transaction management UI
- `/emi` - EMI management dashboard UI
- `/settings` - System configuration UI

---

## 🔐 Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/jewelry_store"

# Application
NODE_ENV="development"
APP_URL="http://localhost:3000"
APP_PORT=3000

# Security (implement JWT later)
JWT_SECRET="your-secret-key-change-in-production"

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

---

## 📊 Sample Data

The seed script creates:
- **3** Rate Master entries (Gold 22K, Gold 18K, Silver 925)
- **2** Suppliers
- **3** Customers (Retail, VIP, Wholesale)
- **4** Products (necklace, ring, anklet, earrings)
- **24** Stock Items (various quantities per product)
- **1** Completed Sales Order
- **1** Pending Purchase Order

---

## 🚧 Production Deployment Checklist

- [ ] Update `DATABASE_URL` to production database
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Run `npm run db:migrate:deploy`
- [ ] Configure CORS if needed
- [ ] Setup SSL/TLS certificates
- [ ] Configure backup strategy for database
- [ ] Setup monitoring and logging
- [ ] Implement authentication/authorization
- [ ] Add rate limiting for APIs
- [ ] Configure CDN for static assets
- [ ] Setup CI/CD pipeline

---

## 🤝 Contributing

This is a production-ready scaffold. To extend:

1. Follow the established architecture patterns
2. Add repositories for new entities
3. Create API routes following existing examples
4. Implement UI pages using the pattern
5. Update Prisma schema and run migrations
6. Add tests (unit and integration)
7. Update documentation

---

## 📝 License

Proprietary - All rights reserved

---

## 📞 Support

For questions or issues:
- Review the API documentation above
- Check Prisma Studio: `npm run db:studio`
- Examine audit logs for debugging
- Review server logs for errors

---

**Built with ❤️ using Next.js 14, TypeScript, Prisma, and MySQL**
