# 🏷️ Stock Tag & Barcode Generation - Complete Guide

## Understanding the System

### Key Concept: Product vs Stock Item

```
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT (Design Template)                                  │
│  ├─ Product Barcode: PRD-1KMKJS-5736  ← Internal catalog ID│
│  ├─ Name: 22K Gold Necklace                                 │
│  ├─ Metal: GOLD, Purity: 22K                                │
│  ├─ Weight: 25.5g                                            │
│  └─ This represents the DESIGN, not physical pieces         │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ When you purchase 3 pieces
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STOCK ITEMS (Individual Physical Pieces)                   │
├─────────────────────────────────────────────────────────────┤
│  Stock Item #1                                               │
│  ├─ Tag ID: G22-17012345-A1B2  ← Auto-generated unique ID  │
│  ├─ Barcode: STK-1KMKJS57-00001  ← Auto-generated barcode  │
│  ├─ Purchase Cost: ₹45,000                                  │
│  ├─ Selling Price: ₹50,000                                  │
│  └─ Status: AVAILABLE                                        │
├─────────────────────────────────────────────────────────────┤
│  Stock Item #2                                               │
│  ├─ Tag ID: G22-17012345-C3D4  ← Different unique ID       │
│  ├─ Barcode: STK-1KMKJS57-00002  ← Different barcode       │
│  ├─ Purchase Cost: ₹45,000                                  │
│  ├─ Selling Price: ₹50,000                                  │
│  └─ Status: AVAILABLE                                        │
├─────────────────────────────────────────────────────────────┤
│  Stock Item #3                                               │
│  ├─ Tag ID: G22-17012345-E5F6  ← Different unique ID       │
│  ├─ Barcode: STK-1KMKJS57-00003  ← Different barcode       │
│  ├─ Purchase Cost: ₹45,000                                  │
│  ├─ Selling Price: ₹50,000                                  │
│  └─ Status: AVAILABLE                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Industry Standards

### Product Barcode (Design Template)
- **Purpose**: Catalog/design identification
- **Format**: `PRD-1KMKJS-5736` or `GOLD-22K-001`
- **Created**: When you create product design
- **Usage**: Internal reference, product lookup

### Stock Item Tag ID (Physical Piece)
- **Purpose**: Unique identification for each physical jewelry piece
- **Format**: `[Metal][Purity]-[Timestamp]-[UniqueID]`
  - Gold 22K: `G22-17012345-A1B2`
  - Silver 925: `S925-17012345-C3D4`
  - Platinum 999: `P999-17012345-E5F6`
- **Created**: When stock is received
- **Usage**: Physical tag attached to jewelry
- **Immutable**: Cannot be changed once created

### Stock Item Barcode (Physical Piece)
- **Purpose**: Quick scanning for sales, inventory
- **Format**: `STK-[ProductID]-[Sequence]`
  - Example: `STK-1KMKJS57-00001`
- **Created**: When stock is received
- **Usage**: Barcode scanning at POS, inventory
- **Immutable**: Cannot be changed once created

---

## Two Purchase Workflows

### Workflow 1: Traditional Purchase Order (Two-Step)

```
Step 1: Create Purchase Order
─────────────────────────────
┌─────────────────────────────────────────┐
│  Purchase Order Details                 │
│  ├─ Supplier: ABC Gold Suppliers        │
│  ├─ Item: Gold Necklace × 3            │
│  ├─ Unit Price: ₹50,000                 │
│  ├─ Total: ₹1,50,000                    │
│  └─ Status: PENDING                      │
└─────────────────────────────────────────┘
            │
            │ Goods arrive at shop
            ▼
Step 2: Receive Stock (Generate Tags)
────────────────────────────────────
┌─────────────────────────────────────────┐
│  Stock Receipt                           │
│  ├─ Scan/Enter PO Number                │
│  ├─ Enter quantity received: 3          │
│  ├─ Enter purchase cost per piece       │
│  ├─ Enter selling price per piece       │
│  └─ Submit                               │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  ✓ 3 Stock Items Created                │
│  ├─ G22-17012345-A1B2 (Tag + Barcode)  │
│  ├─ G22-17012345-C3D4 (Tag + Barcode)  │
│  └─ G22-17012345-E5F6 (Tag + Barcode)  │
└─────────────────────────────────────────┘
            │
            ▼
     Print barcode labels
```

**Use When:**
- Ordering from supplier (future delivery)
- Need to track pending orders
- Goods arrive later
- Want to verify items before generating tags

---

### Workflow 2: Direct Purchase (One-Step) ⭐ NEW

```
Single Step: Create PO + Auto-Generate Stock
─────────────────────────────────────────────
┌─────────────────────────────────────────┐
│  Purchase Order Details                 │
│  ├─ Supplier: ABC Gold Suppliers        │
│  ├─ Item: Gold Necklace × 3            │
│  ├─ Unit Price: ₹50,000                 │
│  ├─ Purchase Cost: ₹45,000 per piece   │
│  ├─ Selling Price: ₹50,000 per piece   │
│  ├─ ☑ Auto-Generate Stock Items        │
│  └─ Submit                               │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  ✓ PO Created + 3 Stock Items Generated │
│  ├─ G22-17012345-A1B2 (Tag + Barcode)  │
│  ├─ G22-17012345-C3D4 (Tag + Barcode)  │
│  ├─ G22-17012345-E5F6 (Tag + Barcode)  │
│  └─ Status: DELIVERED                    │
└─────────────────────────────────────────┘
            │
            ▼
     Print barcode labels immediately
```

**Use When:**
- Buying directly from supplier (immediate possession)
- Cash & carry purchases
- Walk-in supplier sales
- Want tags generated immediately

---

## Tag ID & Barcode Generation Rules

### Tag ID Format
```
[MetalCode][Purity]-[Timestamp]-[UniqueID]

Components:
├─ MetalCode: G (Gold), S (Silver), P (Platinum)
├─ Purity: 22, 24, 18, 14, 925, 999, etc.
├─ Timestamp: Last 8 digits of milliseconds
└─ UniqueID: 4-character random alphanumeric

Examples:
├─ G22-17012345-A1B2  (Gold 22K)
├─ G18-17012567-X9Y8  (Gold 18K)
├─ S925-17012789-M3N4  (Silver 925)
└─ P999-17012901-P5Q6  (Platinum 999)
```

### Barcode Format
```
STK-[ProductID]-[Sequence]

Components:
├─ Prefix: STK (Stock)
├─ ProductID: First 8 chars of product UUID
└─ Sequence: Auto-incrementing 8-digit number

Examples:
├─ STK-1KMKJS57-00000001
├─ STK-1KMKJS57-00000002
├─ STK-1KMKJS57-00000003
└─ STK-9LPQRT42-00000001
```

---

## Barcode Label Printing

### Step 1: Get Stock Items
After creating stock items, you get their IDs.

### Step 2: Generate Labels
```bash
GET /api/barcode/labels?stockItemIds=id1,id2,id3
```

### Step 3: Print
Response contains:
```json
{
  "labels": [
    {
      "stockItemId": "xxx",
      "tagId": "G22-17012345-A1B2",
      "barcode": "STK-1KMKJS57-00001",
      "productName": "22K Gold Necklace",
      "metalType": "GOLD",
      "purity": "22K",
      "netWeight": "25.500g",
      "price": "₹50,000.00",
      "huid": "ABC123",
      "labelData": {
        "line1": "22K Gold Necklace",
        "line2": "GOLD 22K",
        "line3": "Wt: 25.500g",
        "line4": "₹50,000.00",
        "barcode": "STK-1KMKJS57-00001",
        "tagId": "G22-17012345-A1B2",
        "huid": "ABC123"
      }
    }
  ],
  "printSettings": {
    "labelWidth": "50mm",
    "labelHeight": "30mm",
    "fontSize": "10pt",
    "barcodeHeight": "15mm"
  }
}
```

---

## Sales Process (Scanning)

### Scenario: Customer Buys Jewelry

```
Step 1: Scan Barcode
────────────────────
Scan: STK-1KMKJS57-00001
         │
         ▼
Step 2: System Lookup
─────────────────────
GET /api/barcode/scan?code=STK-1KMKJS57-00001
         │
         ▼
Step 3: Get Stock Item Details
───────────────────────────────
{
  "stockItemId": "xxx",
  "tagId": "G22-17012345-A1B2",
  "product": {
    "name": "22K Gold Necklace",
    "metalType": "GOLD",
    "purity": "22K",
    "netWeight": 25.5
  },
  "sellingPrice": 50000,
  "status": "AVAILABLE"
}
         │
         ▼
Step 4: Add to Sale
───────────────────
Create Sales Order with this stock item
         │
         ▼
Step 5: Mark as SOLD
────────────────────
Stock Item status → SOLD
Sale Date recorded
Cannot be sold again (Tag immutable)
```

---

## Complete Example: Buying 5 Gold Rings

### Using Auto-Generate Feature

```
1. Create Product (One-time setup)
──────────────────────────────────
Product Name: 22K Gold Ring - Traditional Design
Product Barcode: RING-22K-001
Metal: GOLD
Purity: 22K
Weight: 5.5g
HUID: (leave empty - will add per piece if hallmarked)
Collection: Wedding Collection

2. Create Purchase Order (Direct Purchase)
──────────────────────────────────────────
Supplier: Tanishq Wholesale
Item: 22K Gold Ring - Traditional Design
Quantity: 5
Unit Price: ₹25,000
Purchase Cost: ₹22,000 per piece
Selling Price: ₹25,000 per piece
☑ Auto-Generate Stock Items
Expected Weight: 5.5g per piece

Click "Create Purchase Order"

3. System Auto-Generates
────────────────────────
✓ Purchase Order: PO-20251203-1234
✓ 5 Stock Items Created:
  1. Tag: G22-17012345-A1B2, Barcode: STK-RING22K0-00001
  2. Tag: G22-17012345-C3D4, Barcode: STK-RING22K0-00002
  3. Tag: G22-17012345-E5F6, Barcode: STK-RING22K0-00003
  4. Tag: G22-17012345-G7H8, Barcode: STK-RING22K0-00004
  5. Tag: G22-17012345-I9J0, Barcode: STK-RING22K0-00005

4. Print Labels
───────────────
Navigate to: Stock Items page
Filter: Recent purchases
Select: All 5 items
Click: "Print Labels"

5. Attach Physical Tags
───────────────────────
Print and attach labels to each ring:
Ring 1: Tag G22-17012345-A1B2
Ring 2: Tag G22-17012345-C3D4
Ring 3: Tag G22-17012345-E5F6
Ring 4: Tag G22-17012345-G7H8
Ring 5: Tag G22-17012345-I9J0

6. Ready for Sale
─────────────────
Each ring can now be:
- Scanned at POS
- Tracked individually
- Sold separately
- Reported on FIFO basis
```

---

## FAQs

### Q1: Why separate Product Barcode and Stock Item Barcode?
**A:** 
- **Product Barcode**: Identifies the design (what it is)
- **Stock Barcode**: Identifies the physical piece (which specific one)
- Example: You have 50 identical gold rings (1 product), but 50 unique stock items

### Q2: Can I modify Tag ID after creation?
**A:** No. Tag IDs are immutable for audit and compliance. Once a tag is generated and potentially attached to physical jewelry, it cannot be changed.

### Q3: What if I lose a physical tag?
**A:** The tag ID and barcode are stored in the system. You can:
1. Search stock item by product
2. Reprint the label
3. Attach new physical tag with same ID

### Q4: Do I need to use Auto-Generate Stock?
**A:** No. You have two options:
- **Traditional**: Create PO → Later receive stock → Generate tags
- **Direct** (Auto): Create PO + generate tags immediately

Use auto-generate for direct/immediate purchases.

### Q5: How many stock items can I generate at once?
**A:** Up to 1000 items per purchase order. System handles batch generation efficiently.

### Q6: Can same barcode exist twice?
**A:** No. System ensures uniqueness:
- Checks for duplicates
- Uses timestamp + random for uniqueness
- Database unique constraint prevents duplicates

### Q7: What about HUID for BIS hallmarking?
**A:** HUID is stored at Product level but can also be tracked per stock item:
- Product HUID: For non-hallmarked or design template
- Stock Item → Product HUID: Inherited for tracking
- BIS Compliance module: Tracks per-piece hallmarking

### Q8: How do I track which piece was sold to which customer?
**A:** Stock item records:
- `salesOrderLineId`: Links to specific sale
- `saleDate`: When sold
- Sales Order → Customer: Complete trail

### Q9: Can I edit purchase/selling price after stock generation?
**A:** Stock item prices are fixed at creation (audit trail). For price changes:
- Use price override at product level for new stock
- Or adjust at time of sale (discount/premium)

### Q10: What happens if I cancel a purchase order with auto-generated stock?
**A:** Stock items should be deleted or marked inactive. This requires careful handling:
- Option A: Soft delete stock items
- Option B: Mark as CANCELLED status
- Recommended: Use auto-generate only for confirmed purchases

---

## Best Practices

### ✅ DO:
1. Use **auto-generate for direct purchases** (cash & carry)
2. Use **traditional workflow for future orders**
3. **Print labels immediately** after generation
4. **Attach physical tags** before displaying in showroom
5. **Scan barcodes** during sales for accuracy
6. **Keep product barcodes simple** and consistent
7. **Train staff** on both workflows

### ❌ DON'T:
1. Don't manually create stock items (use API)
2. Don't reuse tag IDs
3. Don't modify tags after physical attachment
4. Don't skip barcode scanning during sales
5. Don't use auto-generate for unconfirmed orders
6. Don't forget to print labels

---

## Summary

```
┌────────────────────────────────────────────────────────────┐
│  PRODUCT BARCODE (Design)                                  │
│  ├─ Purpose: Catalog/design identification                │
│  ├─ Format: PRD-1KMKJS-5736                               │
│  ├─ Created: When product design is created               │
│  ├─ Usage: Internal reference                             │
│  └─ ONE per design                                         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  STOCK TAG ID + BARCODE (Physical Piece)                   │
│  ├─ Purpose: Individual piece tracking                    │
│  ├─ Tag ID: G22-17012345-A1B2 (for physical tag)         │
│  ├─ Barcode: STK-1KMKJS57-00001 (for scanning)           │
│  ├─ Created: When stock is received                       │
│  ├─ Usage: POS scanning, inventory, sales                 │
│  ├─ Immutable: Cannot be changed                          │
│  └─ MANY per product (one per physical piece)             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  TWO WORKFLOWS                                              │
│  ├─ Traditional: PO → Receive Stock → Generate Tags       │
│  └─ Direct: PO + Auto-Generate (new feature)              │
└────────────────────────────────────────────────────────────┘
```

---

**Your System is Now Industry-Standard Compliant!** 🎉

Each physical jewelry piece gets unique Tag ID + Barcode for complete traceability.
