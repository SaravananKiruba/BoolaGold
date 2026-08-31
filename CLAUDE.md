# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**BoolaGold** (`jewelry-store-management`) is a production-ready, **multi-tenant SaaS** jewelry store management platform. Built with Next.js 14 App Router, TypeScript (strict), Prisma ORM on MySQL, Chakra UI v3, JWT auth (`jose`), and Zod validation.

A single deployment serves many jewelry shops. Data is isolated per shop via a mandatory `shopId` filter enforced in the repository layer.

## Common Commands

```bash
npm run dev                 # Next.js dev server on 0.0.0.0
npm run build               # prisma generate + next build
npm start                   # Production server
npm run lint                # next lint
npm run type-check          # tsc --noEmit (strict)
npm run format              # prettier --write .
npm run format:check

# Database (Prisma)
npm run db:generate         # Regenerate Prisma client
npm run db:push             # Push schema without migration (dev)
npm run db:migrate          # Create + apply a dev migration
npm run db:migrate:deploy   # Apply migrations in production
npm run db:studio           # Prisma Studio
npm run db:reset            # DROP & re-migrate (destructive)

# Seeding
npm run seed:admin          # scripts/seed-super-admin.ts (tsx)
npm run seed:shop           # scripts/seed-initial-shop.ts (referenced in package.json)
```

Node >= 18, npm >= 9. `postinstall` runs `prisma generate` automatically.

## Environment Variables

Required in `.env` (never commit):
- `DATABASE_URL` — MySQL connection string. Recommended suffix for prod: `?connection_limit=10&pool_timeout=20&connect_timeout=10`.
- `JWT_SECRET` — HS256 signing secret for session tokens. The default hardcoded fallback in [src/lib/auth.ts](src/lib/auth.ts#L11) is **only for local dev** and must be overridden in every deployed environment.
- `APP_URL` — exposed to the client via `next.config.js`.

Deployment: Vercel (`vercel.json`), build = `npx prisma generate && npm run build`, framework = `nextjs`, auto-deploys from `main`.

## Architecture

### High-Level Layers

```
Next.js App Router (src/app)
  ├── Pages (server + client components under src/app/<route>/page.tsx)
  ├── API Routes (src/app/api/<resource>/route.ts)
  │     └── uses Repository layer (never call Prisma directly from routes)
  └── Middleware (src/middleware.ts) — auth + role gating + shop-activation gate

Repository Layer (src/repositories)
  ├── baseRepository.ts — buildShopFilter / buildBaseFilter / verifyOwnership
  └── <domain>Repository.ts — all queries go through here

Domain (src/domain/entities/types.ts)
  ├── Enums (MetalType, PaymentMethod, StockStatus, UserRole, ...)
  └── TypeScript interfaces mirroring Prisma models

Utilities (src/utils)
  ├── apiProtection.ts — protectRoute / protectRouteWithPermission
  ├── apiRepository.ts — getRepositories(request) — preferred entry point
  ├── audit.ts — createAuditLog / logCreate / logUpdate / logDelete
  ├── response.ts — successResponse / errorResponse / validationErrorResponse
  ├── validation.ts — Zod schemas (phone, weight, amount, uuid, ...)
  ├── permissions.ts — client-side hasPermission mirror
  ├── pricing.ts — canonical price formula
  ├── barcode.ts — barcode / tag ID / invoice number generators
  ├── wholesaleValidation.ts — RETAIL vs WHOLESALE payment rules
  ├── rateLimiter.ts, cache.ts, monitoring.ts, logger.ts, queryOptimizer.ts
  └── inventoryValuation.ts, metalConversion.ts, sellingPrice.ts

lib/
  ├── auth.ts — JWT (jose) + PERMISSIONS matrix + session helpers
  ├── prisma.ts — singleton PrismaClient with slow-query middleware
  ├── repositoryFactory.ts — createRepositories(session)
  └── shopConfig.ts — per-shop config loaded from DB
```

### Multi-Tenancy Model

Every business table has a `shopId FK -> shops.id ON DELETE CASCADE`. Isolation rules:

1. `middleware.ts` verifies JWT, enforces role-based route allowlists (`roleRoutes`), redirects deactivated shops to `/subscription`. The middleware `matcher` **excludes `/api/*`** — API routes must self-protect.
2. API routes call `protectRoute(request)` / `protectRouteWithPermission(request, 'PERMISSION')` from [src/utils/apiProtection.ts](src/utils/apiProtection.ts). This performs JWT check, shop-activation check, and per-shop rate limiting.
3. Data access goes through repositories that call `buildShopFilter(session)` — throws if `session.shopId` is missing.
4. `SUPER_ADMIN` has `shopId = null` and operates cross-shop; ordinary repositories will throw for a super-admin session (super-admin uses its own endpoints under `/api/super-admin/*`).

### Roles & Permissions

Roles (`UserRole` enum): `SUPER_ADMIN`, `OWNER`, `SALES`, `ACCOUNTS`.

Permission matrix lives in [src/lib/auth.ts](src/lib/auth.ts) as `PERMISSIONS`. Use it in three places, always by the same key:
- API routes: `protectRouteWithPermission(request, 'PRODUCT_CREATE')`.
- Server helpers: `hasPermission(session, 'PRODUCT_CREATE')`.
- Client UI: `import { hasPermission } from '@/utils/permissions'` (mirrors the server matrix by importing `PERMISSIONS` from `@/lib/auth`).

Route-level UI gating uses `usePageGuard(['OWNER', 'SALES'])` from [src/hooks/usePageGuard.ts](src/hooks/usePageGuard.ts).

### Authentication Flow

- Login `POST /api/auth/login` → verifies bcrypt password → issues HS256 JWT (24h) → sets `auth_session` httpOnly cookie (`SESSION_COOKIE_NAME`).
- Session payload includes `userId`, `username`, `role`, `shopId`, `shopName`, `subscriptionType`, `isActive` (shop active flag baked into the token so middleware avoids a DB hit).
- Logout `POST /api/auth/logout` clears the cookie. Client fetches `/api/auth/session` to hydrate role/permissions.
- `validateSession()` re-verifies shop `isActive`/`deletedAt` from DB for API routes.

## Domain Model (Prisma)

See [prisma/schema.prisma](prisma/schema.prisma). Core entities and their relationships:

- `Shop` — root tenant. Fields include `shopBusinessType` (RETAIL|WHOLESALE), `subscriptionType` (TRIAL|LIFETIME), trial/AMC dates, `isActive`, branding, GST/PAN, bank details.
- `User` — `shopId` nullable (null for SUPER_ADMIN), unique `username`, bcrypt `password`, `role`.
- `Customer`, `FamilyMember`, `Supplier` — per-shop, soft-deleted (`deletedAt`).
- `Product` — jewelry catalog with `metalType`, `purity`, `netWeight`/`grossWeight` (3 dp), `makingCharges`, `wastagePercent`, `stoneValue`, `huid`, `barcode` (`@@unique([shopId, barcode])`), `calculatedPrice`, `priceOverride`, `rateUsedId`.
- `StockItem` — individual physical piece (unique `tagId`, `barcode`), FIFO by `purchaseDate`, `status` (AVAILABLE|RESERVED|SOLD), links to `SalesOrderLine` (1-1) and `PurchaseOrder`, `acquisitionType` (CASH_PURCHASE | METAL_EXCHANGE_IN), `exchangeDetails Json`.
- `RateMaster` — daily per-shop rates by `(metalType, purity)`, activating a new row deactivates the previous one.
- `PurchaseOrder` / `PurchaseOrderItem` / `PurchasePayment` — supplier side. `@@unique([shopId, orderNumber])`.
- `SalesOrder` / `SalesOrderLine` / `SalesPayment` — invoice `INV-YYYYMMDD-XXXX`, `@@unique([shopId, invoiceNumber])`, `orderType` (RETAIL|WHOLESALE|CUSTOM|EXCHANGE), auto-creates `Transaction` on completion.
- `Transaction` — unified ledger (INCOME|EXPENSE|EMI|METAL_PURCHASE|GOLD_SCHEME|ADJUSTMENT|METAL_EXCHANGE_IN|METAL_EXCHANGE_OUT). `excludeFromProfitLoss` flag for exchange legs.
- `EmiPayment` / `EmiInstallment` — installment plan + rows.
- `AuditLog` — every mutation logs before/after JSON via `src/utils/audit.ts`.
- `BisCompliance` — HUID / hallmark tracking.

Relation mode is `prisma` (`relationMode = "prisma"`) — FKs are enforced by Prisma, not MySQL. Every model has explicit `@@index` on `shopId`, `deletedAt`, and hot query paths (e.g. `product_active_lookup`, `sales_shop_status`, `rate_fast_lookup`).

## Business Rules to Preserve

Do not silently change any of these — they are wired through pricing, stock, and financial reporting.

1. **Price formula** ([src/utils/pricing.ts](src/utils/pricing.ts)):
   - `effectiveWeight = netWeight * (1 + wastagePercent / 100)`
   - `metalAmount = effectiveWeight * metalRatePerGram`
   - `totalPrice = metalAmount + makingCharges + stoneValue`
   - Weights are 3 decimal places, amounts 2 decimal places.
2. **Stock is FIFO** by `purchaseDate` when picking items for a sale.
3. **Stock reservation**: creating a PENDING sales order marks stock `RESERVED`; cancelling releases it back to `AVAILABLE`; completion marks it `SOLD` and sets `salesOrderLineId`.
4. **Invoice number**: `generateInvoiceNumber()` produces `INV-YYYYMMDD-XXXX`; enforced unique per `shopId`.
5. **Rate activation**: activating a new `RateMaster` for `(shopId, metalType, purity)` must deactivate the previous active row.
6. **Bulk price recalc** must skip products flagged `isCustomOrder` or with a `priceOverride`, and record who/when/which rate was used (see product/rate-master repositories).
7. **RETAIL vs WHOLESALE payment enforcement** ([src/utils/wholesaleValidation.ts](src/utils/wholesaleValidation.ts)):
   - RETAIL shops: any `PaymentMethod` **except** `METAL_EXCHANGE`.
   - WHOLESALE shops: **only** `METAL_EXCHANGE`.
   - Metal-exchange transactions set `excludeFromProfitLoss = true` and link both legs via `exchangeReferenceId`.
8. **Soft delete**: filter by `deletedAt: null` on all list queries. `buildBaseFilter(session)` handles this.
9. **Audit**: every create/update/delete/status change writes to `AuditLog` (`logCreate`, `logUpdate`, `logDelete` in `src/utils/audit.ts`) with `shopId`.

## API Route Conventions

Standard shape of an API route:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { protectRouteWithPermission } from '@/utils/apiProtection';
import { getRepositories } from '@/utils/apiRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { z } from 'zod';

const bodySchema = z.object({ /* ... */ });

export async function POST(request: NextRequest) {
  const auth = await protectRouteWithPermission(request, 'PRODUCT_CREATE');
  if (auth instanceof Response) return auth;
  const session = auth;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(validationErrorResponse(parsed.error.flatten()), { status: 400 });
    }

    const repos = await getRepositories(request);
    const created = await repos.product.create(parsed.data);
    return NextResponse.json(successResponse(created), { status: 201 });
  } catch (err: any) {
    return NextResponse.json(errorResponse(err.message ?? 'Server error'), { status: 500 });
  }
}
```

Rules:
- Never import `prisma` directly into an API route unless doing something intentionally cross-cutting (e.g. multi-repository transactions). Prefer repositories.
- Always return via `successResponse` / `errorResponse` / `validationErrorResponse` for shape consistency (`{ success, data?, error?, meta? }`).
- Validate every input body/query with Zod. Reuse `amountSchema`, `weightSchema`, `phoneSchema`, `uuidSchema` from [src/utils/validation.ts](src/utils/validation.ts).
- For super-admin-only endpoints, place them under `src/app/api/super-admin/*` and gate with `hasRole(session, ['SUPER_ADMIN'])` — do **not** use the standard shop-scoped repositories there.

## Frontend Conventions

- App Router; server components by default. Add `'use client'` only where interactivity is required.
- UI: Chakra UI v3 (`@chakra-ui/react` ^3.30) with a custom theme system in [src/theme/theme.ts](src/theme/theme.ts). Provider is [src/components/providers/ChakraProvider.tsx](src/components/providers/ChakraProvider.tsx), mounted globally in [src/app/layout.tsx](src/app/layout.tsx).
- Shared UI lives in [src/components/ui/](src/components/ui/) (`Navigation.tsx`, `LoadingSpinner.tsx`, `alert.tsx`, `ColorPalette.tsx`, `ProductAutocomplete.tsx`).
- Client permission checks use `hasPermission` from `@/utils/permissions` and `usePageGuard` from `@/hooks/usePageGuard`.
- Path aliases (see `tsconfig.json`): `@/*`, `@/domain/*`, `@/repositories/*`, `@/services/*`, `@/utils/*`, `@/lib/*`, `@/http/*`, `@/ui/*`.

## When Making Changes

- **New table/field**: edit `prisma/schema.prisma`, add the required `shopId` index if it's a per-shop table, run `npm run db:migrate` (dev). Update `src/domain/entities/types.ts` if the type is used by non-Prisma code.
- **New API resource**: create `src/app/api/<resource>/route.ts` and `[id]/route.ts`, add a repository under `src/repositories/`, register it in `src/lib/repositoryFactory.ts` and `src/utils/apiRepository.ts`.
- **New permission**: add the key to `PERMISSIONS` in [src/lib/auth.ts](src/lib/auth.ts) with the allowed roles. That single source is used by both server (`hasPermission`) and client (`@/utils/permissions`).
- **New role**: add to `UserRole` enum in Prisma **and** in `roleRoutes` in [src/middleware.ts](src/middleware.ts), then update every `PERMISSIONS` entry.
- **Any mutation**: emit an audit log (`logCreate`/`logUpdate`/`logDelete`) with the correct `AuditModule`.
- **Never bypass** `buildShopFilter` / `getBaseFilter` — bypassing them is a tenant-isolation bug.

## Known Rough Edges

- [src/utils/audit.ts](src/utils/audit.ts) constructs its own `new PrismaClient()` instead of importing the singleton from `@/lib/prisma`. If you touch this file, migrate it to the singleton to avoid connection-pool exhaustion.
- The default JWT secret fallback in [src/lib/auth.ts](src/lib/auth.ts) is a dev convenience; production must set `JWT_SECRET`.
- Middleware does **not** run on `/api/*` (see `matcher`); API auth is per-route via `protectRoute`.
- `src/config/shop.config.ts` is a legacy single-tenant config; the live per-shop config source is DB-backed [src/lib/shopConfig.ts](src/lib/shopConfig.ts).
- `_old` / `_backup` page files exist (e.g. [src/app/purchase-orders/page_old.tsx](src/app/purchase-orders/page_old.tsx), [src/app/rate-master/page_backup.tsx](src/app/rate-master/page_backup.tsx)). Do not edit unless explicitly asked; do not import from them.
- `src/services/` and `src/http/` / `src/ui/` are declared in `tsconfig.json` path aliases but not yet materialized as folders.
