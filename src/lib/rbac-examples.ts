/**
 * RBAC Quick Reference for API Routes
 * Copy-paste examples for implementing role-based access control
 */

import { getSession, hasPermission, PERMISSIONS } from '@/lib/auth';
import { createErrorResponse } from '@/utils/response';

// ============================================
// EXAMPLE 1: Check if user is authenticated
// ============================================
export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return createErrorResponse('Not authenticated', 401);
  }
  
  // Continue with logic...
}

// ============================================
// EXAMPLE 2: Check specific permission
// ============================================
export async function GET(request: NextRequest) {
  const session = await getSession();
  
  // Check customer view permission (OWNER, SALES, ACCOUNTS)
  if (!hasPermission(session, 'CUSTOMER_VIEW')) {
    return createErrorResponse('Unauthorized', 403);
  }
  
  // Continue with logic...
}

// ============================================
// EXAMPLE 3: Use repository with session
// ============================================
export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!hasPermission(session, 'CUSTOMER_VIEW')) {
    return createErrorResponse('Unauthorized', 403);
  }
  
  // Pass session to repository - it will auto-filter by shopId
  const repository = new CustomerRepository({ session });
  const customers = await repository.findAll();
  
  return createSuccessResponse(customers);
}

// ============================================
// EXAMPLE 4: Create with automatic shopId
// ============================================
export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!hasPermission(session, 'CUSTOMER_CREATE')) {
    return createErrorResponse('Unauthorized', 403);
  }
  
  const body = await request.json();
  
  const repository = new CustomerRepository({ session });
  // Repository will automatically add shopId from session
  const customer = await repository.create(body);
  
  return createSuccessResponse(customer, 201);
}

// ============================================
// EXAMPLE 5: OWNER-only operations
// ============================================
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  
  // Only OWNER can delete
  if (!hasPermission(session, 'CUSTOMER_DELETE')) {
    return createErrorResponse('Only shop owners can delete customers', 403);
  }
  
  // Continue with delete logic...
}

// ============================================
// EXAMPLE 6: Multiple role checks
// ============================================
export async function GET(request: NextRequest) {
  const session = await getSession();
  
  // Sales reports accessible by OWNER, SALES, ACCOUNTS
  if (!hasPermission(session, 'REPORTS_SALES')) {
    return createErrorResponse('Unauthorized', 403);
  }
  
  // Financial details only for OWNER and ACCOUNTS
  if (!hasPermission(session, 'REPORTS_FINANCIAL')) {
    // Return limited data for SALES role
    return createSuccessResponse({ limitedData: true });
  }
  
  // Full data for OWNER and ACCOUNTS
  return createSuccessResponse({ fullData: true });
}

// ============================================
// EXAMPLE 7: Self-service (user updates own profile)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  
  // Users can update their own profile OR OWNER can update anyone
  if (session?.userId !== id && !hasPermission(session, 'USER_MANAGE')) {
    return createErrorResponse('Unauthorized', 403);
  }
  
  // Continue with update logic...
}

// ============================================
// PERMISSION REFERENCE
// ============================================

/*
CUSTOMER MANAGEMENT:
- CUSTOMER_VIEW: ['OWNER', 'SALES', 'ACCOUNTS']
- CUSTOMER_CREATE: ['OWNER', 'SALES']
- CUSTOMER_EDIT: ['OWNER', 'SALES']
- CUSTOMER_DELETE: ['OWNER']

PRODUCT & STOCK:
- PRODUCT_VIEW: ['OWNER', 'SALES', 'ACCOUNTS']
- PRODUCT_CREATE: ['OWNER', 'SALES']
- PRODUCT_EDIT: ['OWNER', 'SALES']
- PRODUCT_DELETE: ['OWNER']
- STOCK_MANAGE: ['OWNER', 'SALES']

SALES ORDERS:
- SALES_VIEW: ['OWNER', 'SALES', 'ACCOUNTS']
- SALES_CREATE: ['OWNER', 'SALES']
- SALES_EDIT: ['OWNER', 'SALES']
- SALES_DELETE: ['OWNER']

PURCHASE ORDERS:
- PURCHASE_VIEW: ['OWNER', 'ACCOUNTS']
- PURCHASE_CREATE: ['OWNER', 'ACCOUNTS']
- PURCHASE_EDIT: ['OWNER', 'ACCOUNTS']
- PURCHASE_DELETE: ['OWNER']

FINANCIAL:
- TRANSACTION_VIEW: ['OWNER', 'ACCOUNTS']
- TRANSACTION_CREATE: ['OWNER', 'ACCOUNTS']
- TRANSACTION_EDIT: ['OWNER', 'ACCOUNTS']
- TRANSACTION_DELETE: ['OWNER']
- EMI_MANAGE: ['OWNER', 'ACCOUNTS']

REPORTS:
- REPORTS_SALES: ['OWNER', 'SALES', 'ACCOUNTS']
- REPORTS_INVENTORY: ['OWNER', 'SALES', 'ACCOUNTS']
- REPORTS_FINANCIAL: ['OWNER', 'ACCOUNTS']

RATE MASTER:
- RATE_MASTER_VIEW: ['OWNER', 'SALES', 'ACCOUNTS']
- RATE_MASTER_EDIT: ['OWNER', 'ACCOUNTS']

ADMIN (OWNER only):
- SHOP_CONFIG: ['OWNER']
- USER_MANAGE: ['OWNER']
- AUDIT_VIEW: ['OWNER']
*/

// ============================================
// HELPER FUNCTIONS
// ============================================

/*
Available helper functions from @/lib/auth:

// Session
- getSession() → SessionPayload | null
- generateToken(payload) → string
- verifyToken(token) → SessionPayload | null

// Password
- hashPassword(password) → string
- verifyPassword(password, hash) → boolean

// Role Checks
- hasPermission(session, permission) → boolean
- isOwner(session) → boolean
- hasSalesAccess(session) → boolean
- hasAccountsAccess(session) → boolean
- hasRole(session, ['OWNER', 'SALES']) → boolean

// Repository
- BaseRepository class with:
  - getShopFilter()
  - getBaseFilter(includeDeleted)
  - withShopContext(filters)
  - ensureShopAccess(resourceShopId)
  - getShopId()
*/

// ============================================
// REPOSITORY PATTERN
// ============================================

/*
import { BaseRepository, RepositoryOptions } from './baseRepository';

export class YourRepository extends BaseRepository {
  constructor(options: RepositoryOptions) {
    super(options);
  }

  async create(data: any) {
    return prisma.yourModel.create({
      data: {
        ...data,
        shopId: this.getShopId(), // Automatic shopId
      },
    });
  }

  async findAll(filters: any) {
    return prisma.yourModel.findMany({
      where: {
        ...this.getBaseFilter(), // Adds shopId + deletedAt: null
        ...filters,
      },
    });
  }

  async findById(id: string) {
    const record = await prisma.yourModel.findFirst({
      where: {
        id,
        ...this.getBaseFilter(),
      },
    });
    
    // Optional: Double-check shop ownership
    if (record) {
      this.ensureShopAccess(record.shopId);
    }
    
    return record;
  }
}

// Usage in API route:
const repository = new YourRepository({ session });
const records = await repository.findAll();
*/
