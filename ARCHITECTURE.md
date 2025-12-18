/**
 * 📋 COMPLETE API & UI FLOW ARCHITECTURE GUIDE
 * 
 * For 300+ shop multi-tenant SaaS with proper separation of concerns
 */

# ============================================================================
# API ARCHITECTURE PATTERNS
# ============================================================================

## 1. REQUEST FLOW (Per API Call)

```
Client Request
    ↓
Next.js Middleware (src/middleware.ts)
    ├─> Authentication Check (JWT validation)
    ├─> Shop Activation Check
    ├─> Role-based routing
    ↓
API Route Handler (/api/products/route.ts)
    ├─> protectRoute() - Auth + Rate Limiting
    ├─> Input Validation (Zod schemas)
    ↓
Repository Layer (ProductRepository)
    ├─> Automatic shopId filtering
    ├─> Cache check (Redis/Memory)
    ├─> Database query (Prisma)
    ├─> Cache update
    ↓
Response Formatting
    ├─> successResponse() / errorResponse()
    ├─> Pagination metadata
    ├─> Rate limit headers
    ↓
Client receives JSON
```

## 2. STANDARD API PATTERNS

### Pattern A: LIST with Pagination & Filters
```typescript
// GET /api/products?page=1&pageSize=20&metalType=GOLD&search=ring

export async function GET(request: NextRequest) {
  // 1. Auth + Rate limit
  const result = await protectRoute(request);
  if (result instanceof NextResponse) return result;
  const session = result;

  // 2. Parse query params
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const filters = {
    search: searchParams.get('search') || undefined,
    metalType: searchParams.get('metalType') as MetalType | undefined,
    // ... other filters
  };

  // 3. Repository call (auto-filters by shopId)
  const repos = await getRepositories(request);
  const result = await repos.product.findAll(filters, { page, pageSize });

  // 4. Return with pagination metadata
  return NextResponse.json(
    successResponse(result.data, result.meta),
    { status: 200 }
  );
}
```

### Pattern B: CREATE with Validation
```typescript
// POST /api/products

export async function POST(request: NextRequest) {
  // 1. Auth + Permission check
  const result = await protectRouteWithPermission(request, 'PRODUCT_CREATE');
  if (result instanceof NextResponse) return result;
  const session = result;

  // 2. Parse body
  const body = await request.json();

  // 3. Validate (Zod schema)
  const validation = createProductSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      validationErrorResponse(validation.error.errors),
      { status: 400 }
    );
  }

  // 4. Business logic
  const data = validation.data;
  const barcode = generateBarcode('PRD', randomId());

  // 5. Repository call (auto-adds shopId)
  const repos = await getRepositories(request);
  const product = await repos.product.create({
    ...data,
    barcode,
  });

  // 6. Audit log
  await logCreate(session, AuditModule.PRODUCTS, product.id, product);

  // 7. Return created resource
  return NextResponse.json(
    successResponse(product, { message: 'Product created successfully' }),
    { status: 201 }
  );
}
```

### Pattern C: GET by ID with Authorization
```typescript
// GET /api/products/[id]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await protectRoute(request);
  if (result instanceof NextResponse) return result;
  const session = result;

  const repos = await getRepositories(request);
  const product = await repos.product.findById(params.id);

  if (!product) {
    return NextResponse.json(
      errorResponse('Product not found'),
      { status: 404 }
    );
  }

  // Tenant isolation check happens automatically in repository

  return NextResponse.json(successResponse(product), { status: 200 });
}
```

### Pattern D: UPDATE with Optimistic Locking
```typescript
// PATCH /api/products/[id]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await protectRouteWithPermission(request, 'PRODUCT_UPDATE');
  if (result instanceof NextResponse) return result;
  const session = result;

  const body = await request.json();
  const validation = updateProductSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      validationErrorResponse(validation.error.errors),
      { status: 400 }
    );
  }

  const repos = await getRepositories(request);
  
  // Get current version
  const existing = await repos.product.findById(params.id);
  if (!existing) {
    return NextResponse.json(
      errorResponse('Product not found'),
      { status: 404 }
    );
  }

  // Update
  const updated = await repos.product.update(params.id, validation.data);

  // Audit log
  await logUpdate(session, AuditModule.PRODUCTS, params.id, existing, updated);

  return NextResponse.json(
    successResponse(updated, { message: 'Product updated' }),
    { status: 200 }
  );
}
```

### Pattern E: DELETE (Soft Delete)
```typescript
// DELETE /api/products/[id]

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await protectRouteWithPermission(request, 'PRODUCT_DELETE');
  if (result instanceof NextResponse) return result;
  const session = result;

  const repos = await getRepositories(request);
  
  // Soft delete (sets deletedAt timestamp)
  await repos.product.softDelete(params.id);

  // Audit log
  await logDelete(session, AuditModule.PRODUCTS, params.id);

  return NextResponse.json(
    successResponse(null, { message: 'Product deleted' }),
    { status: 200 }
  );
}
```

# ============================================================================
# UI ARCHITECTURE PATTERNS
# ============================================================================

## Component Hierarchy

```
app/
├── layout.tsx (Root layout with providers)
│   └── Navigation (Role-based menu)
│
├── dashboard/page.tsx (Dashboard)
│   ├── StatCards (Parallel data loading)
│   ├── RecentSales (Server component)
│   └── Charts (Client component)
│
├── products/page.tsx (Product List)
│   ├── ProductFilters (Client component)
│   ├── ProductTable (Server component)
│   │   └── ProductRow (Actions per role)
│   └── Pagination (Client component)
│
└── products/[id]/page.tsx (Product Detail)
    ├── ProductInfo (Server component)
    ├── StockItems (Server component)
    └── EditProductForm (Client component)
```

## Pattern 1: Server Component with Data Fetching
```typescript
// app/products/page.tsx (Server Component)

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProductTable from '@/components/products/ProductTable';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  // 1. Server-side auth check
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // 2. Fetch data on server (no loading state needed)
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/products?page=${page}&search=${search}`,
    {
      headers: { Cookie: `auth_session=${session.token}` },
      cache: 'no-store', // Always fresh for multi-tenant
    }
  );

  const { data, meta } = await response.json();

  // 3. Render with data
  return (
    <div>
      <h1>Products</h1>
      <ProductTable products={data} pagination={meta} />
    </div>
  );
}
```

## Pattern 2: Client Component with SWR (Real-time Updates)
```typescript
// components/products/ProductList.tsx (Client Component)

'use client';

import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProductList() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  // SWR automatically caches and revalidates
  const { data, error, isLoading, mutate } = useSWR(
    `/api/products?page=${page}&${new URLSearchParams(filters)}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30s
      revalidateOnFocus: true,
    }
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <ProductFilters onChange={setFilters} />
      <ProductTable 
        products={data.data} 
        onUpdate={() => mutate()} // Trigger refresh
      />
      <Pagination 
        current={page} 
        total={data.meta.totalPages}
        onChange={setPage}
      />
    </div>
  );
}
```

## Pattern 3: Form with Optimistic Updates
```typescript
// components/products/EditProductForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/utils/toast';

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(product);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Update failed');
      }

      toast.success('Product updated successfully');
      router.refresh(); // Revalidate server components
      router.push('/products');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

## Pattern 4: Role-based UI Rendering
```typescript
// components/products/ProductActions.tsx

'use client';

import { usePermissions } from '@/hooks/usePermissions';

export default function ProductActions({ product }: { product: Product }) {
  const { session } = usePermissions();

  // Show different actions based on role
  const canEdit = session?.role === 'OWNER' || session?.role === 'SUPER_ADMIN';
  const canDelete = session?.role === 'OWNER';
  const canViewOnly = session?.role === 'SALES';

  return (
    <div className="flex gap-2">
      <ViewButton productId={product.id} />
      
      {canEdit && (
        <EditButton productId={product.id} />
      )}
      
      {canDelete && (
        <DeleteButton 
          productId={product.id}
          onDelete={() => handleDelete(product.id)}
        />
      )}
      
      {canViewOnly && (
        <span className="text-gray-500">View Only</span>
      )}
    </div>
  );
}
```

# ============================================================================
# DATA FLOW EXAMPLES
# ============================================================================

## Example 1: Creating a Sales Order (Complex Flow)

```
1. User fills form (UI)
   └─> components/sales/CreateSalesOrderForm.tsx

2. Form submission (API call)
   └─> POST /api/sales-orders
       ├─> Validate session + permissions
       ├─> Validate customer exists (same shop)
       ├─> Validate stock items available
       ├─> Calculate totals
       ├─> Begin database transaction:
       │   ├─> Create sales order
       │   ├─> Create sales order lines
       │   ├─> Update stock items (AVAILABLE → SOLD)
       │   ├─> Create transaction record
       │   ├─> Create audit log
       │   └─> Commit transaction
       └─> Return invoice number

3. Success response
   └─> Redirect to /sales-orders/[id]
       └─> Show invoice (Server Component)
           └─> Print option available
```

## Example 2: Dashboard with Parallel Data Loading

```typescript
// app/dashboard/page.tsx

export default async function DashboardPage() {
  const session = await getSession();
  
  // Fetch all dashboard data in parallel (4 queries in ~200ms)
  const [sales, revenue, customers, alerts] = await Promise.all([
    fetch('/api/dashboard/sales'),
    fetch('/api/dashboard/revenue'),
    fetch('/api/dashboard/customers'),
    fetch('/api/dashboard/alerts'),
  ]);

  return (
    <div className="dashboard">
      <StatCards 
        sales={await sales.json()} 
        revenue={await revenue.json()}
        customers={await customers.json()}
      />
      <Alerts data={await alerts.json()} />
      <RecentSales />
      <Charts />
    </div>
  );
}
```

# ============================================================================
# BEST PRACTICES SUMMARY
# ============================================================================

## API Layer:
✅ Always use protectRoute() for authentication
✅ Use protectRouteWithPermission() for authorization
✅ Validate all inputs with Zod schemas
✅ Return consistent response format (successResponse/errorResponse)
✅ Include pagination metadata for lists
✅ Log important actions to audit trail
✅ Use transactions for multi-step operations
✅ Set proper HTTP status codes

## Repository Layer:
✅ Extend BaseRepository for automatic shopId filtering
✅ Use getBaseFilter() to ensure tenant isolation
✅ Cache frequently accessed data (rates, shop config)
✅ Use batchCreate() for bulk operations
✅ Always soft delete (set deletedAt, don't actually delete)

## UI Layer:
✅ Use Server Components for SEO-critical pages
✅ Use Client Components for interactive features
✅ Show loading states during async operations
✅ Handle errors gracefully with toast notifications
✅ Implement optimistic updates for better UX
✅ Use SWR/React Query for data fetching & caching
✅ Protect routes with usePermissions() hook
✅ Show role-appropriate UI elements

## Security:
✅ Never trust client input (always validate)
✅ Never expose internal IDs in URLs (use slugs)
✅ Always filter by shopId in database queries
✅ Rate limit API endpoints
✅ Sanitize user input (XSS prevention)
✅ Use HTTPS everywhere
✅ Rotate JWT secrets regularly
