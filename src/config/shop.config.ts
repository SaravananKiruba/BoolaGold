/**
 * Shop Configuration for Multi-Tenant Support
 * 
 * This configuration allows you to customize the shop details
 * that appear on printable documents (invoices, receipts, reports)
 * 
 * IMPLEMENTATION APPROACH:
 * 
 * Option 1 (Current - Single Shop):
 * - One configuration file (this file)
 * - Simple and fast for single jewelry shop
 * - Easy to maintain
 * 
 * Option 2 (Future - Multi-Tenant):
 * - Add Shop model to database schema
 * - Each user login associated with a shop
 * - Shop-specific branding, pricing rules, inventory
 * - Data isolation between shops
 * 
 * RECOMMENDATION: Start with Option 1, migrate to Option 2 when selling to multiple shops
 */

export interface ShopConfig {
  // Basic Information
  name: string;
  tagline: string;
  
  // Contact Details
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  
  // Business Details
  gstNumber: string;
  panNumber: string;
  
  // Branding
  logo?: string; // Path to logo file
  primaryColor?: string;
  
  // Print Settings
  showLogoOnPrint: boolean;
  invoicePrefix: string; // e.g., "BG-INV-"
  
  // Additional Terms
  termsAndConditions?: string[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
}

// Current Shop Configuration
export const shopConfig: ShopConfig = {
  name: 'BoolaGold Jewellers',
  tagline: 'Trust in Every Piece',
  
  address: '123, Jewelry Street, Gandhi Nagar',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600020',
  phone: '+91 98765 43210',
  email: 'info@boolagold.com',
  website: 'www.boolagold.com',
  
  gstNumber: '33AAAAA0000A1Z5',
  panNumber: 'AAAAA0000A',
  
  primaryColor: '#667eea',
  showLogoOnPrint: true,
  invoicePrefix: 'BG-',
  
  termsAndConditions: [
    'All sales are subject to Chennai jurisdiction',
    'Goods once sold cannot be returned',
    'All gold items are BIS hallmarked',
    'Please verify weight and purity at the time of purchase',
  ],
  
  bankDetails: {
    bankName: 'State Bank of India',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    branch: 'T Nagar Branch',
  },
};

/**
 * MIGRATION GUIDE FOR MULTI-TENANT:
 * 
 * 1. Add to schema.prisma:
 * 
 * model Shop {
 *   id            String   @id @default(uuid())
 *   name          String
 *   tagline       String?
 *   address       String
 *   city          String
 *   state         String
 *   pincode       String
 *   phone         String
 *   email         String
 *   website       String?
 *   gstNumber     String
 *   panNumber     String
 *   logo          String?
 *   primaryColor  String?
 *   invoicePrefix String
 *   isActive      Boolean  @default(true)
 *   createdAt     DateTime @default(now())
 *   updatedAt     DateTime @updatedAt
 *   
 *   users         User[]
 *   customers     Customer[]
 *   products      Product[]
 *   salesOrders   SalesOrder[]
 * }
 * 
 * model User {
 *   id        String   @id @default(uuid())
 *   username  String   @unique
 *   password  String   // Hashed
 *   name      String
 *   role      String   // ADMIN, MANAGER, CASHIER
 *   shopId    String
 *   shop      Shop     @relation(fields: [shopId], references: [id])
 *   isActive  Boolean  @default(true)
 *   createdAt DateTime @default(now())
 * }
 * 
 * 2. Add shopId to all entities:
 * - Customer, Product, SalesOrder, PurchaseOrder, etc.
 * 
 * 3. Update repositories to filter by shopId automatically
 * 
 * 4. Create API to fetch shop config based on logged-in user's shopId
 * 
 * 5. Update all print templates to use dynamic shop config
 */
