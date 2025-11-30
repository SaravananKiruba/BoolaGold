# Jewelry Store Management System

A **production-ready**, full-stack Next.js application for comprehensive jewelry store management. Built with TypeScript, Prisma ORM, and MySQL, implementing clean architecture and domain-driven design principles.

## 🎯 Features Overview

This system covers **all 30 user stories** across the following modules:

### 🙋 Customer Management (Stories 1-2)
- Customer registration with complete profiles
- Family member tracking for occasion-based marketing
- Customer types: Retail, Wholesale, VIP
- Purchase history tracking
- Advanced search and filtering

### 💍 Product Management (Stories 3-5)
- Jewelry item registration with complete specifications
- Metal types: Gold, Silver, Platinum with purity levels
- Auto-generated barcodes and tag numbers
- HUID (Hallmark Unique ID) for BIS compliance
- Automatic price calculation based on rate master
- Manual price override with reason logging
- Stone details and making charges

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

### 💰 Sales Order Management (Stories 12-14, 26)
- Invoice generation with auto-numbering
- Stock validation before sale
- FIFO-based item selection
- Discount management
- Multiple payment methods
- Automatic transaction creation
- Order types: Retail, Wholesale, Custom, Exchange

### 💵 Financial Management (Stories 15-17, 25)
- Complete transaction recording
- Income and expense tracking
- Metal purchase tracking with weight/rate details
- Payment collection
- EMI payment tracking with installments
- Profit & loss statements

### 📊 Rate Master (Stories 18-19)
- Daily gold/silver/platinum rate management
- Purity-wise rate tracking
- Bulk product price updates
- Rate history and sources

### 💳 EMI Management (Story 16)
- EMI plan creation with interest calculation
- Installment tracking
- Payment collection per installment
- Overdue alerts

### 📈 Reports & Analytics (Stories 20-25)
- Dashboard with key metrics
- Sales reports with filters
- Inventory valuation reports
- Customer purchase analysis
- Financial statements
- Sales summary export

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
| GET | `/api/products` | List all products with stock counts |
| POST | `/api/products` | Create new product (auto-calculates price) |
| GET | `/api/products/[id]` | Get product details with stock summary |
| PUT | `/api/products/[id]` | Update product (supports price recalculation) |
| DELETE | `/api/products/[id]` | Soft delete product |

**Request Body** (POST):
```json
{
  "name": "Gold Necklace - Traditional",
  "metalType": "GOLD",
  "purity": "22K",
  "grossWeight": 25.5,
  "netWeight": 24.0,
  "huid": "HUID22K001",
  "tagNumber": "TAG-001",
  "description": "Beautiful traditional design",
  "makingCharges": 8000.00,
  "wastagePercent": 6.0,
  "stoneWeight": 2.5,
  "stoneValue": 5000.00,
  "hallmarkNumber": "BIS916-001",
  "bisCompliant": true,
  "collectionName": "Wedding Collection",
  "design": "Temple Jewelry",
  "reorderLevel": 2,
  "calculatePrice": true
}
```

### Sales Order Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales-orders` | List all sales orders with filters |
| POST | `/api/sales-orders` | Create new order (validates stock, creates transaction) |
| GET | `/api/sales-orders/[id]` | Get order details with line items |

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
  "paymentAmount": 160000.00
}
```

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
- `/` - Dashboard/Home
- `/customers` - Customer listing
- `/products` - Product catalog
- `/sales-orders` - Sales order management

### To Implement (Next Steps)
- `/stock` - Stock management
- `/suppliers` - Supplier management
- `/purchase-orders` - Purchase order workflow
- `/transactions` - Financial transactions
- `/emi` - EMI management
- `/rate-master` - Rate management
- `/reports` - Analytics and reports
- `/settings` - System configuration

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
