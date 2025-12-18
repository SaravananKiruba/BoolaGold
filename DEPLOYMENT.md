# 🚀 Production Deployment Guide for Multi-Tenant Jewellery SaaS
# Serving 300+ shops with high availability

# ============================================================================
# INFRASTRUCTURE ARCHITECTURE
# ============================================================================

## Recommended Setup (AWS/GCP/Azure):

### 1. APPLICATION TIER (Next.js)
- **Deployment**: Vercel Pro / AWS ECS / Cloud Run
- **Instances**: 3-5 containers (auto-scaling)
- **CPU/RAM**: 2 vCPU, 4GB RAM per instance
- **Load Balancer**: Application Load Balancer (ALB)
- **CDN**: CloudFront / Cloudflare (for static assets)

### 2. DATABASE TIER (MySQL)
- **Service**: AWS RDS MySQL 8.0 / Google Cloud SQL
- **Instance**: db.m5.xlarge (4 vCPU, 16GB RAM) minimum
- **Storage**: 500GB SSD (auto-scaling to 2TB)
- **Read Replicas**: 2 replicas for reports/analytics
- **Backup**: Automated daily + 30 day retention
- **Multi-AZ**: Yes (high availability)

### 3. CACHING LAYER
- **Service**: Redis Cloud / AWS ElastiCache
- **Instance**: cache.m5.large (2 vCPU, 6.38GB RAM)
- **Nodes**: 3 (1 primary + 2 replicas)
- **Persistence**: RDB + AOF (durability)

### 4. FILE STORAGE
- **Service**: AWS S3 / Google Cloud Storage
- **Buckets**: 
  - shop-logos (public)
  - invoices (private)
  - exports (private, 7 day expiry)
  - backups (private, versioned)

### 5. MONITORING & LOGGING
- **APM**: Datadog / New Relic / Sentry
- **Logs**: CloudWatch Logs / Stackdriver
- **Uptime**: Pingdom / UptimeRobot
- **Alerts**: PagerDuty / Slack webhooks

# ============================================================================
# COST ESTIMATION (Monthly)
# ============================================================================

## For 300 shops with 50-100 active users:

| Service                  | Provider    | Instance Type      | Monthly Cost |
|-------------------------|-------------|--------------------|--------------|
| App Hosting (3 nodes)    | Vercel Pro  | -                  | $60          |
| Database (RDS)           | AWS         | db.m5.xlarge       | $350         |
| Read Replicas (2)        | AWS         | db.m5.large        | $300         |
| Redis Cache              | Redis Cloud | 6GB RAM            | $40          |
| S3 Storage (200GB)       | AWS         | Standard           | $5           |
| CloudFront CDN           | AWS         | 1TB transfer       | $85          |
| Monitoring (Datadog)     | Datadog     | Pro plan           | $150         |
| Backups (S3 Glacier)     | AWS         | 1TB                | $4           |
| **TOTAL**                |             |                    | **~$994/mo** |

## Revenue Requirement:
- Monthly cost: ₹80,000 (~$994 × 80)
- Per shop: ₹267/month (₹80,000 ÷ 300)
- Your pricing: ₹10,000/year AMC = ₹833/month ✅ **Profitable**

# ============================================================================
# DEPLOYMENT STEPS
# ============================================================================

## Step 1: Database Migration

```bash
# Run this on production database
npx prisma migrate deploy

# Seed super admin (run once)
npm run seed:admin

# Verify migration
npx prisma db pull
```

## Step 2: Environment Variables (.env.production)

```env
# Database
DATABASE_URL="mysql://user:password@prod-db.region.rds.amazonaws.com:3306/boolagold?connection_limit=20&pool_timeout=60"
DATABASE_READ_URL="mysql://user:password@read-replica.region.rds.amazonaws.com:3306/boolagold"

# Redis Cache
REDIS_URL="redis://default:password@redis-12345.cloud.redislabs.com:12345"

# JWT Secret (MUST change)
JWT_SECRET="your-256-bit-secret-change-this-immediately"

# Next.js
NEXT_PUBLIC_APP_URL="https://boolagold.com"
NODE_ENV="production"

# Monitoring
SENTRY_DSN="https://key@sentry.io/project"
DATADOG_API_KEY="your-datadog-api-key"

# Storage
AWS_S3_BUCKET="boolagold-prod"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-south-1"

# Email/SMS
SENDGRID_API_KEY="SG...."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
```

## Step 3: Build & Deploy

```bash
# Install dependencies
npm ci --production

# Generate Prisma Client
npx prisma generate

# Build application
npm run build

# Start production server
npm start
```

## Step 4: Health Checks

```bash
# Database connectivity
curl https://boolagold.com/api/health/database

# Cache connectivity
curl https://boolagold.com/api/health/cache

# Overall health
curl https://boolagold.com/api/health
```

# ============================================================================
# SCALING STRATEGY
# ============================================================================

## Current: 300 shops
- Single app instance can handle 300-500 concurrent users
- Database: db.m5.xlarge is sufficient

## Growth: 1000 shops
- Scale to 5-10 app instances (horizontal scaling)
- Upgrade database to db.m5.2xlarge (8 vCPU, 32GB RAM)
- Add 3rd read replica for reports
- Implement Redis Cluster (3 master + 3 replica)

## Growth: 5000+ shops (DATABASE SHARDING)
```
Shard 1 (shops 1-1000)    -> db1.boolagold.com
Shard 2 (shops 1001-2000) -> db2.boolagold.com
Shard 3 (shops 2001-3000) -> db3.boolagold.com
...
```

### Sharding Strategy:
- **Shard Key**: shopId (consistent hashing)
- **Router**: Vitess / ProxySQL
- **Cross-shard queries**: Avoided (app layer aggregation)

# ============================================================================
# SECURITY CHECKLIST
# ============================================================================

- [x] HTTPS everywhere (TLS 1.3)
- [x] JWT tokens with 24h expiry
- [x] Password hashing (bcrypt, 10 rounds)
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS prevention (React escaping)
- [x] CSRF tokens on forms
- [x] Rate limiting per shop
- [x] Database connection encryption
- [ ] WAF (Web Application Firewall) - CloudFlare / AWS WAF
- [ ] DDoS protection - CloudFlare
- [ ] Secrets in KMS/Vault (not .env files)
- [ ] Regular security audits
- [ ] Penetration testing (annual)

# ============================================================================
# COMPLIANCE (Indian Jewellery Industry)
# ============================================================================

## Data Retention (Shop Act, GST):
- Invoice records: 7 years
- Audit logs: 7 years  
- Transaction records: 7 years
- Customer data: Until customer requests deletion

## BIS Hallmarking:
- HUID tracking in products table
- Hallmark certificate storage in S3
- Compliance status in bis_compliance table

## GST Compliance:
- GST number validation
- B2B/B2C invoice format
- GSTR reports exportable

# ============================================================================
# MONITORING DASHBOARD
# ============================================================================

## Key Metrics to Track:

1. **Business Metrics**
   - Active shops count
   - Trial conversions (%)
   - AMC renewals (monthly)
   - Revenue MRR/ARR

2. **Performance Metrics**
   - API response time (p50, p95, p99)
   - Database query time
   - Cache hit rate
   - Error rate per shop

3. **Infrastructure Metrics**
   - CPU utilization
   - Memory usage
   - Database connections
   - Disk I/O

4. **Alerts**
   - Error rate > 1%
   - Response time > 2s
   - Database connections > 80%
   - Expired AMCs

# ============================================================================
# DISASTER RECOVERY PLAN
# ============================================================================

## RTO (Recovery Time Objective): 4 hours
## RPO (Recovery Point Objective): 1 hour

### Scenario 1: Database Failure
1. Promote read replica to primary (5 minutes)
2. Update DNS / connection strings (10 minutes)
3. Verify data integrity (30 minutes)
4. Resume operations

### Scenario 2: Application Failure
1. Auto-scaling launches new instances (2 minutes)
2. Health checks pass (3 minutes)
3. Traffic resumes

### Scenario 3: Complete Region Failure
1. Activate DR region (manual trigger)
2. Restore latest backup (1-2 hours)
3. Update DNS to DR region (15 minutes)
4. Verify all shops functional

# ============================================================================
# MAINTENANCE WINDOWS
# ============================================================================

## Scheduled Maintenance:
- **Day**: Sunday
- **Time**: 2:00 AM - 4:00 AM IST
- **Frequency**: Monthly (first Sunday)
- **Activities**:
  - Database updates
  - Security patches
  - Performance optimization
  - Backup verification

## Zero-Downtime Deployment:
- Blue-Green deployment
- Database migrations run separately
- Feature flags for new features
