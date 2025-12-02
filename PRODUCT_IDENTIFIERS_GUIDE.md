# 📋 Product Identifiers Guide - BoolaGold Jewelry Management System

## Overview
This guide explains the different identifiers used in the product module and when to use each one.

---

## 🏷️ Product Identifiers Explained

### 1. **Barcode** ⭐ (REQUIRED)
**Purpose:** Your internal system-generated unique identifier for inventory tracking

**What to put here:**
- A unique code that identifies this specific product in your system
- Can be manually created or auto-generated
- Used for quick product lookup and inventory management

**Examples:**
```
PRD-1KMKJS-5736
GOLD-22K-001
GN-2024-001 (Gold Necklace 2024 item 001)
BR-22K-BR-100 (Bracelet 22K item 100)
```

**Format Suggestions:**
- `PRD-[RANDOM]-[NUMBER]` → System generated
- `[METAL]-[PURITY]-[SEQUENCE]` → Gold-22K-001
- `[TYPE]-[YEAR]-[NUMBER]` → Ring-2024-050

**Important:** 
- ✅ Must be unique across all products
- ✅ Use alphanumeric characters, hyphens allowed
- ✅ Cannot be changed after creation (linked to stock items)

---

### 2. **HUID** (Optional - BIS Hallmark)
**Purpose:** Government-mandated Hallmark Unique Identification for BIS certified jewelry

**What to put here:**
- The 6-digit alphanumeric HUID code provided by BIS-approved hallmarking center
- Only applicable for hallmarked gold jewelry (above 1 gram)
- Required by law for selling hallmarked jewelry in India

**Examples:**
```
ABC123
XYZ789
PQR456
```

**When to use:**
- ✅ For BIS hallmarked gold jewelry
- ✅ When you have received hallmarking certification
- ❌ Leave empty for non-hallmarked items
- ❌ Leave empty for silver/platinum (if not hallmarked)

**Related Fields in System:**
- Also tracked in `BIS Compliance` module
- Links to hallmark number, certification date
- AHC (Assaying & Hallmarking Centre) code

---

### 3. **Tag Number** (Optional)
**Purpose:** Physical display tag or label number attached to the jewelry piece

**What to put here:**
- The tag/label number you physically attach to the jewelry in your display
- Helps match physical inventory with digital records
- Your own internal reference for display and stock verification

**Examples:**
```
TAG-001
DISPLAY-22K-05
SHOW-BRC-150
WIN-A-45 (Window Display A, item 45)
CASE-3-12 (Display Case 3, position 12)
```

**When to use:**
- ✅ When you attach physical tags to jewelry pieces
- ✅ For display and showroom inventory tracking
- ✅ For stock verification and audit purposes
- ❌ Can leave empty if not using physical tags

**Benefits:**
- Quick physical inventory matching
- Easy showroom staff reference
- Customer inquiry handling

---

### 4. **Collection Name** (Optional)
**Purpose:** Group related jewelry designs under a marketing/design collection

**What to put here:**
- The name of the design series or collection this product belongs to
- Used for categorization, marketing, and customer browsing

**Examples:**
```
Bridal Collection
Festival Special 2024
Antique Design Series
Temple Jewelry
Modern Minimalist
Royal Heritage
Kids Collection
Daily Wear
Party Wear
Traditional South Indian
```

**When to use:**
- ✅ When launching seasonal collections
- ✅ For theme-based jewelry groups
- ✅ For marketing and catalog organization
- ✅ To help customers browse similar designs
- ❌ Can leave empty for standalone products

**Benefits:**
- Better product organization
- Easier customer browsing
- Marketing campaign alignment
- Collection-based reports

---

## 📊 Comparison Table

| Identifier | Required? | Purpose | Who Generates | Example |
|------------|-----------|---------|---------------|---------|
| **Barcode** | ✅ Yes | Internal inventory tracking | You/System | `PRD-1KMKJS-5736` |
| **HUID** | ❌ No | BIS hallmark compliance | BIS/Hallmarking Center | `ABC123` |
| **Tag Number** | ❌ No | Physical display tracking | Your shop | `TAG-001` |
| **Collection Name** | ❌ No | Product grouping/marketing | Your business | `Bridal Collection` |

---

## 🎯 Usage Scenarios

### Scenario 1: New Gold Necklace (Hallmarked)
```yaml
Product Name: "22K Gold Temple Necklace with Ruby"
Barcode: "GN-22K-2024-145"  ← Your internal code
HUID: "ABC123"               ← From hallmarking center
Tag Number: "DISPLAY-A-12"   ← Physical tag in showroom
Collection Name: "Temple Jewelry"  ← Design collection
```

### Scenario 2: Silver Ring (Not Hallmarked)
```yaml
Product Name: "925 Silver Ring with Cubic Zirconia"
Barcode: "SR-925-2024-089"  ← Your internal code
HUID: (empty)                ← Not hallmarked
Tag Number: "TAG-089"        ← Physical tag
Collection Name: "Daily Wear"  ← Design collection
```

### Scenario 3: Custom Order Bracelet
```yaml
Product Name: "18K Gold Custom Diamond Bracelet"
Barcode: "CUSTOM-BR-2024-05"  ← Your internal code
HUID: (will add later)         ← Pending hallmarking
Tag Number: (empty)            ← No display tag yet
Collection Name: (empty)       ← Standalone custom piece
```

---

## 🔄 Workflow: Adding a New Product

### Step 1: Generate Barcode
- Decide on your barcode format
- Ensure it's unique in the system
- System can auto-generate: `PRD-[RANDOM]-[NUMBER]`

### Step 2: Check Hallmarking Status
- Is this jewelry hallmarked?
  - **Yes:** Enter HUID from hallmarking certificate
  - **No:** Leave empty

### Step 3: Physical Tag (If Applicable)
- Do you use physical tags in showroom?
  - **Yes:** Enter tag number from physical label
  - **No:** Leave empty

### Step 4: Collection Assignment
- Does this belong to a collection?
  - **Yes:** Enter collection name (can group multiple products)
  - **No:** Leave empty for standalone products

---

## 📝 Best Practices

### For Barcodes:
✅ Use consistent format across all products  
✅ Include metal type and purity in code for easy recognition  
✅ Keep sequential numbers for inventory tracking  
❌ Don't reuse barcodes of deleted products  

### For HUID:
✅ Verify HUID from official hallmarking certificate  
✅ Mandatory for selling hallmarked jewelry legally  
✅ Update BIS Compliance module with full details  
❌ Don't fabricate HUID numbers  

### For Tag Numbers:
✅ Use location-based tags for easy finding (CASE-3-12)  
✅ Update when jewelry is moved in showroom  
✅ Use durable tags that don't damage jewelry  
❌ Don't duplicate tag numbers  

### For Collections:
✅ Use descriptive, customer-friendly names  
✅ Keep collection names consistent  
✅ Limit number of collections for better organization  
❌ Don't create too many single-product collections  

---

## 🚨 Common Questions

**Q: Do I need to fill all four identifiers?**  
A: No, only **Barcode is required**. Others are optional based on your needs.

**Q: Can I change the barcode after creating a product?**  
A: No, barcode cannot be changed as it's used in stock items and transactions.

**Q: What if I don't do hallmarking?**  
A: Leave HUID empty. It's only for BIS hallmarked jewelry.

**Q: I don't use physical tags in my shop**  
A: That's fine! Leave Tag Number empty.

**Q: Can multiple products have the same Collection Name?**  
A: Yes! That's the point - to group related products together.

**Q: What's the difference between Barcode and Tag Number?**  
A: 
- **Barcode:** Digital inventory code (in computer system)
- **Tag Number:** Physical label code (on jewelry piece)

---

## 📱 Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│  PRODUCT IDENTIFIERS QUICK GUIDE                │
├─────────────────────────────────────────────────┤
│                                                  │
│  BARCODE *                                       │
│  Your unique inventory code (REQUIRED)          │
│  Example: PRD-1KMKJS-5736                       │
│                                                  │
│  HUID                                            │
│  BIS Hallmark ID (Only for hallmarked gold)     │
│  Example: ABC123                                │
│                                                  │
│  TAG NUMBER                                      │
│  Physical display tag (If you use tags)         │
│  Example: TAG-001                               │
│                                                  │
│  COLLECTION NAME                                 │
│  Design series/group (For marketing)            │
│  Example: Bridal Collection                     │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🎓 Additional Resources

- **BIS Hallmarking:** https://bis.gov.in/hallmarking/
- **HUID Registration:** Contact your local BIS-approved Assaying & Hallmarking Centre
- **Product Module:** See your system's Product Management page
- **BIS Compliance Module:** Track hallmarking details separately

---

**Need Help?**
If you're still unsure about what to enter in any field, you can:
1. Start with just the required Barcode
2. Add other identifiers as your business processes evolve
3. Update products later when you get hallmarking done

Remember: **The system is flexible** - only Barcode is mandatory!
