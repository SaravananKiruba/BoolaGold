// Domain Types and Enums for Jewelry Store Management System

// ============================================
// CUSTOMER DOMAIN
// ============================================

export enum CustomerType {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
  VIP = 'VIP',
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  dateOfBirth?: Date | null;
  anniversaryDate?: Date | null;
  customerType: CustomerType;
  isActive: boolean;
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface FamilyMember {
  id: string;
  customerId: string;
  name: string;
  relation: string;
  dateOfBirth?: Date | null;
  anniversary?: Date | null;
}

// ============================================
// PRODUCT DOMAIN
// ============================================

export enum MetalType {
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  PLATINUM = 'PLATINUM',
}

export interface Product {
  id: string;
  name: string;
  metalType: MetalType;
  purity: string;
  grossWeight: number;
  netWeight: number;
  barcode: string;
  huid?: string | null;
  tagNumber?: string | null;
  description?: string | null;
  makingCharges: number;
  wastagePercent: number;
  stoneWeight?: number | null;
  stoneValue?: number | null;
  stoneDescription?: string | null;
  hallmarkNumber?: string | null;
  bisCompliant: boolean;
  collectionName?: string | null;
  design?: string | null;
  size?: string | null;
  supplierId?: string | null;
  reorderLevel: number;
  isActive: boolean;
  isCustomOrder: boolean;
  calculatedPrice?: number | null;
  priceOverride?: number | null;
  priceOverrideReason?: string | null;
  lastPriceUpdate?: Date | null;
  rateUsedId?: string | null;
}

export interface PriceCalculation {
  netWeight: number;
  wastagePercent: number;
  effectiveWeight: number;
  metalRatePerGram: number;
  metalAmount: number;
  makingCharges: number;
  stoneValue: number;
  totalPrice: number;
}

// ============================================
// STOCK DOMAIN
// ============================================

export enum StockStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
}

export interface StockItem {
  id: string;
  productId: string;
  tagId: string;
  barcode: string;
  purchaseCost: number;
  sellingPrice: number;
  status: StockStatus;
  purchaseOrderId?: string | null;
  purchaseDate?: Date | null;
  saleDate?: Date | null;
  salesOrderLineId?: string | null;
}

// ============================================
// SUPPLIER DOMAIN
// ============================================

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  isActive: boolean;
  registrationDate: Date;
}

// ============================================
// PURCHASE ORDER DOMAIN
// ============================================

export enum PurchaseOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PARTIAL = 'PARTIAL',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT = 'CREDIT',
  EMI = 'EMI',
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  expectedDeliveryDate?: Date | null;
  actualDeliveryDate?: Date | null;
  paymentMethod: PaymentMethod;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: PurchaseOrderStatus;
  paymentStatus: PaymentStatus;
  referenceNumber?: string | null;
  notes?: string | null;
  orderDate: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  expectedWeight?: number | null;
  receivedQuantity: number;
}

// ============================================
// SALES ORDER DOMAIN
// ============================================

export enum SalesOrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
  CUSTOM = 'CUSTOM',
  EXCHANGE = 'EXCHANGE',
}

export interface SalesOrder {
  id: string;
  invoiceNumber: string;
  customerId: string;
  orderTotal: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  status: SalesOrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  orderDate: Date;
}

export interface SalesOrderLine {
  id: string;
  salesOrderId: string;
  stockItemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// ============================================
// TRANSACTION DOMAIN
// ============================================

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  EMI = 'EMI',
  METAL_PURCHASE = 'METAL_PURCHASE',
  GOLD_SCHEME = 'GOLD_SCHEME',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum TransactionCategory {
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  OPERATIONAL = 'OPERATIONAL',
  OTHER_EXPENSES = 'OTHER_EXPENSES',
  OTHER = 'OTHER',
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export interface Transaction {
  id: string;
  transactionDate: Date;
  transactionType: TransactionType;
  amount: number;
  paymentMode: PaymentMethod;
  category: TransactionCategory;
  description?: string | null;
  referenceNumber?: string | null;
  customerId?: string | null;
  salesOrderId?: string | null;
  status: TransactionStatus;
  currency: string;
  metalType?: MetalType | null;
  metalPurity?: string | null;
  metalWeight?: number | null;
  metalRatePerGram?: number | null;
  metalCost?: number | null;
  createdBy?: string | null;
}

// ============================================
// EMI DOMAIN
// ============================================

export enum EmiInstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface EmiPayment {
  id: string;
  customerId: string;
  salesOrderId?: string | null;
  totalAmount: number;
  interestRate: number;
  numberOfInstallments: number;
  installmentAmount: number;
  emiStartDate: Date;
  lastPaymentDate?: Date | null;
  nextInstallmentDate: Date;
  remainingAmount: number;
  currentInstallment: number;
  status: EmiInstallmentStatus;
}

export interface EmiInstallment {
  id: string;
  emiPaymentId: string;
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  paymentDate?: Date | null;
  paymentMode?: PaymentMethod | null;
  referenceNumber?: string | null;
  status: EmiInstallmentStatus;
}

// ============================================
// RATE MASTER DOMAIN
// ============================================

export enum RateSource {
  MARKET = 'MARKET',
  MANUAL = 'MANUAL',
  API = 'API',
}

export interface RateMaster {
  id: string;
  metalType: MetalType;
  purity: string;
  ratePerGram: number;
  effectiveDate: Date;
  validUntil?: Date | null;
  rateSource: RateSource;
  isActive: boolean;
  defaultMakingChargePercent?: number | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

// ============================================
// AUDIT DOMAIN
// ============================================

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
}

export enum AuditModule {
  CUSTOMERS = 'CUSTOMERS',
  PRODUCTS = 'PRODUCTS',
  STOCK = 'STOCK',
  SUPPLIERS = 'SUPPLIERS',
  PURCHASE_ORDERS = 'PURCHASE_ORDERS',
  SALES_ORDERS = 'SALES_ORDERS',
  TRANSACTIONS = 'TRANSACTIONS',
  EMI = 'EMI',
  RATE_MASTER = 'RATE_MASTER',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string | null;
  action: AuditAction;
  module: AuditModule;
  entityId?: string | null;
  beforeData?: any;
  afterData?: any;
  severity: AuditSeverity;
  ipAddress?: string | null;
  userAgent?: string | null;
  errorMessage?: string | null;
  stackTrace?: string | null;
}

// ============================================
// BIS COMPLIANCE DOMAIN
// ============================================

export enum BisComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PENDING = 'PENDING',
}

export interface BisCompliance {
  id: string;
  productId?: string | null;
  stockItemId?: string | null;
  huid: string;
  huidRegistrationDate?: Date | null;
  hallmarkNumber?: string | null;
  complianceStatus: BisComplianceStatus;
  bisStandard?: string | null;
  ahcCode?: string | null;
  jewelType?: string | null;
  certificationDate?: Date | null;
  expiryDate?: Date | null;
  notes?: string | null;
}
