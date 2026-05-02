# DK-JWL-03 — API Design

**Document ID:** DK-JWL-03  
**Version:** 1.0  
**Date:** 2026-05-02  

All endpoints are under `/api/jwl/v1/`. Auth: `Authorization: Bearer <JWT>` (same SimpleJWT tokens as existing system). Every response is JSON; errors follow DRF default shape `{detail, code, ...}`.

---

## Conventions

| Convention | Rule |
|-----------|------|
| Namespace | `/api/jwl/v1/` |
| Auth | JWT Bearer — same as `/api/auth/` |
| Tenant resolution | From JWT `tenant_id` claim; no URL param |
| Branch resolution | `?branch=<uuid>` query param OR `X-Branch-Id` header |
| Pagination | `?page=1&page_size=20`; response: `{count, next, previous, results}` |
| Soft delete | `DELETE` sets `deleted_at`; not physically removed |
| Filters | django-filter on all list endpoints |
| Ordering | `?ordering=voucher_date` (prefix `-` for DESC) |

---

## 1. Rates

```
GET  /api/jwl/v1/rates/live/
     Response: { gold_999: {rate_per_gram, ts, is_stale}, gold_22k: {...}, silver_999: {...} }

GET  /api/jwl/v1/rates/history/?metal=GOLD&purity=22K&from=2026-04-01&to=2026-05-01
     Response: [{ts, rate_per_gram}]

POST /api/jwl/v1/rates/override/
     Body:    { metal, purity, buy_rate, sell_rate, reason }
     Auth:    Admin only
```

WebSocket (Phase 2):  
`WS /ws/jwl/rates/` — pushes `{metal, purity, rate_per_gram, ts}` every ~60s

---

## 2. Jewellery Master

### Metals & Purities (read-only, seeded)

```
GET /api/jwl/v1/metals/
GET /api/jwl/v1/purities/?metal=GOLD
```

### Categories

```
GET    /api/jwl/v1/categories/               # tree structure
POST   /api/jwl/v1/categories/
PATCH  /api/jwl/v1/categories/{id}/
DELETE /api/jwl/v1/categories/{id}/
```

### Designs

```
GET    /api/jwl/v1/designs/?category={id}&q=necklace
POST   /api/jwl/v1/designs/
         Body: {category, code, name, image_urls, default_weight, default_labour, bom}
GET    /api/jwl/v1/designs/{id}/
PATCH  /api/jwl/v1/designs/{id}/
DELETE /api/jwl/v1/designs/{id}/
```

### Tax Slabs

```
GET    /api/jwl/v1/tax-slabs/
POST   /api/jwl/v1/tax-slabs/
         Body: {name, rate_pct, applies_to, effective_from, effective_to}
PATCH  /api/jwl/v1/tax-slabs/{id}/
```

### Number Series

```
GET    /api/jwl/v1/number-series/
PATCH  /api/jwl/v1/number-series/{id}/
         Body: {prefix, next_number, padding}
```

---

## 3. Inventory

### Items

```
GET    /api/jwl/v1/items/
         ?branch=&design=&status=IN_STOCK&purity=22K&q=sku
POST   /api/jwl/v1/items/
         Body: {design, sku, barcode, huid, metal, purity, gross_wt, net_wt, stone_wt, location_bin, cost_price, mrp}
POST   /api/jwl/v1/items/bulk/
         Body: multipart/form-data { file: CSV }

GET    /api/jwl/v1/items/{id}/
PATCH  /api/jwl/v1/items/{id}/
POST   /api/jwl/v1/items/{id}/write-off/
         Body: {reason}
         Auth: Manager+
POST   /api/jwl/v1/items/{id}/print-tag/
         Response: PDF file

GET    /api/jwl/v1/items/scan/{code}/
         # Resolves barcode/QR/RFID to item detail
```

### Stock Movements

```
GET    /api/jwl/v1/stock-movements/?item=&type=&from=&to=
```

### Stock Takes

```
POST   /api/jwl/v1/stock-takes/
POST   /api/jwl/v1/stock-takes/{id}/lines/
         Body: {item_id, counted_qty, counted_wt}
POST   /api/jwl/v1/stock-takes/{id}/complete/
         Body: {accept_variances: true}
GET    /api/jwl/v1/stock-takes/{id}/discrepancy/
```

### Inter-Branch Transfers

```
POST   /api/jwl/v1/transfers/
         Body: {to_branch, lines: [{item_id, qty, weight}]}
POST   /api/jwl/v1/transfers/{id}/approve/
POST   /api/jwl/v1/transfers/{id}/dispatch/
POST   /api/jwl/v1/transfers/{id}/receive/
GET    /api/jwl/v1/transfers/
```

---

## 4. Customers

```
GET    /api/jwl/v1/customers/?q=name_or_mobile
POST   /api/jwl/v1/customers/
         Body: {code, name, mobile, email, gstin, pan, dob, anniversary}
GET    /api/jwl/v1/customers/{id}/
PATCH  /api/jwl/v1/customers/{id}/
GET    /api/jwl/v1/customers/{id}/ledger/
         # metal + amount outstanding
POST   /api/jwl/v1/customers/{id}/upload-kyc/
         Body: multipart {document_type, file}
```

---

## 5. Billing & Sales

```
# Quotation / Estimate
POST   /api/jwl/v1/sales/quotations/
         Body: {customer_id?, lines: [LineInput], discount_amount}
GET    /api/jwl/v1/sales/quotations/{id}/
POST   /api/jwl/v1/sales/quotations/{id}/convert/
         # Converts to TAX_INVOICE draft

# Tax Invoice
POST   /api/jwl/v1/sales/invoices/
         Body: {
           customer_id, invoice_type, voucher_date, place_of_supply,
           lines: [{item_id?, description, metal, purity, gross_wt, net_wt, stone_wt,
                    rate_per_gram, making_charge_pct, wastage_pct, hallmarking_fee,
                    stone_value, hsn_code}],
           discount_amount, advance_used,
           payments: [{mode, reference, amount}]
         }
         Response: {invoice, calculated_totals}  # server computes all formulas

POST   /api/jwl/v1/sales/invoices/{id}/issue/
         # Locks number series, posts to ledger, updates item status → SOLD

POST   /api/jwl/v1/sales/invoices/{id}/cancel/
         Body: {reason}
         Auth: Manager+

GET    /api/jwl/v1/sales/invoices/{id}/
GET    /api/jwl/v1/sales/invoices/{id}/pdf/
         Response: application/pdf

POST   /api/jwl/v1/sales/invoices/{id}/send/
         Body: {channel: "WA|SMS|EMAIL", to}

POST   /api/jwl/v1/sales/invoices/{id}/payment/
         Body: {mode, reference, amount}

POST   /api/jwl/v1/sales/invoices/{id}/e-invoice/
         # Triggers GSP IRN generation (Phase 2)

# Sale Returns
POST   /api/jwl/v1/sales/returns/
         Body: {original_invoice_id, lines, refund_mode, reason}

# Old Gold Purchase
POST   /api/jwl/v1/sales/old-gold-purchases/
         Body: {customer_id, gross_wt, less_wt, purity_tested, rate, mode}
```

### Invoice Formula: Server-Side Calculation

```
POST /api/jwl/v1/sales/invoices/calculate/
     Body: {lines, discount_amount, place_of_supply}
     Response: {
       subtotals_per_line,
       total_taxable, cgst, sgst, igst,
       round_off, total_payable
     }
```

This endpoint is called client-side on every line change for real-time preview (no auth required for calculation, but tenant context needed).

---

## 6. Karigar & Orders (Phase 2)

```
POST   /api/jwl/v1/orders/
PATCH  /api/jwl/v1/orders/{id}/status/
         Body: {status, notes}
GET    /api/jwl/v1/orders/?status=WIP&karigar=
GET    /api/jwl/v1/orders/{id}/

POST   /api/jwl/v1/karigars/
GET    /api/jwl/v1/karigars/
GET    /api/jwl/v1/karigars/{id}/ledger/

POST   /api/jwl/v1/karigar-issues/
         Body: {karigar_id, order_id?, gross_wt_issued, tunch_pct, items_json}
POST   /api/jwl/v1/karigar-receipts/
         Body: {karigar_id, issue_id, gross_wt_received, net_wt, stone_wt, wastage_actual_pct, labour_amount}

POST   /api/jwl/v1/karigar-labour-bills/
         Body: {karigar_id, period_from, period_to, receipt_ids}
```

---

## 7. Accounts (Phase 2)

```
GET    /api/jwl/v1/accounts/          # COA tree
POST   /api/jwl/v1/accounts/

POST   /api/jwl/v1/vouchers/
         Body: {voucher_type, date, narration, entries: [{account_id, debit, credit, narration}]}
POST   /api/jwl/v1/vouchers/{id}/post/
POST   /api/jwl/v1/vouchers/{id}/cancel/

GET    /api/jwl/v1/reports/cashbook/?from=&to=
GET    /api/jwl/v1/reports/ledger/{account_id}/?from=&to=
GET    /api/jwl/v1/reports/trial-balance/?as_of=
GET    /api/jwl/v1/reports/p-and-l/?from=&to=
GET    /api/jwl/v1/reports/balance-sheet/?as_of=
```

---

## 8. Gold Pledge Loans (Phase 2)

```
GET    /api/jwl/v1/pledge/schemes/
POST   /api/jwl/v1/pledge/schemes/

POST   /api/jwl/v1/pledge/loans/
         Body: {
           customer_id, scheme_id, loan_date, tenure_months,
           kyc: {pan, aadhaar_last4, photo_url, signature_url, address_proof_url},
           pledge_items: [{description, metal, purity, gross_wt, net_wt, stone_wt, photo_urls}]
         }
         Response: {loan, calculated_ltv, max_loan_amount}

POST   /api/jwl/v1/pledge/loans/{id}/disburse/
         Body: {mode, reference, amount}
         Auth: Requires 2-person approval above threshold

POST   /api/jwl/v1/pledge/loans/{id}/repay/
         Body: {date, principal_paid, interest_paid, mode, reference, items_to_release: []}

POST   /api/jwl/v1/pledge/loans/{id}/top-up/
POST   /api/jwl/v1/pledge/loans/{id}/renew/
POST   /api/jwl/v1/pledge/loans/{id}/foreclose/
POST   /api/jwl/v1/pledge/loans/{id}/auction/

GET    /api/jwl/v1/pledge/loans/{id}/statement/
         Response: PDF

GET    /api/jwl/v1/pledge/loans/?status=ACTIVE&overdue=true
```

---

## 9. GST & Reports (Phase 2)

```
GET    /api/jwl/v1/reports/gstr-1/?period=202604
         Response: JSON (GSTN schema) + ?format=excel download

GET    /api/jwl/v1/reports/gstr-3b/?period=202604
GET    /api/jwl/v1/reports/sales-register/?from=&to=&branch=
GET    /api/jwl/v1/reports/purchase-register/?from=&to=
GET    /api/jwl/v1/reports/hsn-summary/?period=202604
GET    /api/jwl/v1/reports/stock-summary/?as_of=&branch=&purity=
GET    /api/jwl/v1/reports/slow-moving/?days=90
GET    /api/jwl/v1/reports/profitability/?by=item|party|karigar&from=&to=
GET    /api/jwl/v1/reports/dashboard/
         Response: {today_sales, stock_value, open_orders, pledge_overdue, ...}
```

---

## 10. Notifications (Phase 2)

```
GET    /api/jwl/v1/messages/templates/
POST   /api/jwl/v1/messages/send/
         Body: {to, channel, template_code, payload}
POST   /api/jwl/v1/messages/broadcasts/
         Body: {name, segment_query, template_code, scheduled_at}
GET    /api/jwl/v1/messages/broadcasts/{id}/stats/
```

---

## 11. Admin

```
GET    /api/jwl/v1/admin/feature-flags/
PATCH  /api/jwl/v1/admin/feature-flags/{key}/
POST   /api/jwl/v1/admin/backup/
GET    /api/jwl/v1/admin/trash/
POST   /api/jwl/v1/admin/trash/{entity}/{id}/restore/
POST   /api/jwl/v1/admin/lock-period/
         Body: {lock_until: "2026-03-31"}
```

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `JWL_001` | 400 | Invoice formula validation failed (negative total) |
| `JWL_002` | 400 | Number series exhausted |
| `JWL_003` | 400 | Item not in stock (status ≠ IN_STOCK) |
| `JWL_004` | 400 | Tunch reconciliation mismatch |
| `JWL_005` | 400 | LTV exceeds scheme maximum |
| `JWL_006` | 403 | 2FA required for this action |
| `JWL_007` | 403 | Approval required (second person) |
| `JWL_008` | 409 | Locked financial period |
| `JWL_009` | 422 | GSP e-invoice generation failed |
| `JWL_010` | 503 | MCX rate stale > 5 minutes |
