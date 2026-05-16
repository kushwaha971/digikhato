# DigiKhaato Jewellery ERP — User Guide

**For:** Shop staff, salespeople, cashiers, and managers  
**Language:** Simple, step-by-step — no technical background needed  
**Last Updated:** 2026-05-11

> **Key rule:** If something is not working or you are unsure, always ask your manager before proceeding. Never guess on a bill that has already been issued.

---

## Table of Contents

1. [Getting Started — First Time Setup](#1-getting-started)
2. [The Dashboard — Your Daily View](#2-the-dashboard)
3. [Gold Rate — Setting Today's Rate](#3-gold-rate)
4. [Customers — Adding and Finding Customers](#4-customers)
5. [Inventory — Finding and Checking Stock](#5-inventory)
6. [Creating a Bill — Step by Step](#6-creating-a-bill)
7. [Collecting Payment](#7-collecting-payment)
8. [Old Gold Exchange](#8-old-gold-exchange)
9. [Issuing the Final Invoice](#9-issuing-the-final-invoice)
10. [Estimates and Quotations](#10-estimates-and-quotations)
11. [Cancelling an Invoice](#11-cancelling-an-invoice)
12. [Stock Take (Physical Count)](#12-stock-take)
13. [Inter-Branch Transfer](#13-inter-branch-transfer)
14. [Multi-Branch Overview](#14-multi-branch-overview)
15. [GST Report Preview and Sales Register](#15-gst-report-preview-and-sales-register)
16. [Accounts & Ledger](#16-accounts--ledger)
17. [Team Users & Roles](#17-team-users--roles)
18. [Barcode / RFID Tagged Items](#18-barcode--rfid-tagged-items)
19. [Common Questions and Problems](#19-common-questions-and-problems)

---

## 1. Getting Started

### Logging In

1. Open DigiKhaato on your computer or tablet.
2. Enter your **mobile number** and **password**.
3. Tap **Login**.
4. The system will take you to your home screen.

### Opening the Jewellery Module

1. In the left sidebar, look for **Jewellery ERP**.
2. Click on it to open the module.
3. You will see the **Jewellery Dashboard**.

> **First time?** Your manager will need to activate the Jewellery module. Ask them to go to **Modules** and click on **Jewellery ERP** to get started.

### What You See in the Sidebar

| Section | What It Is For |
|---------|---------------|
| **Billing & Sales** | Creating bills, invoices, and estimates |
| **Stock & Inventory** | Checking stock, item details, transfers |
| **Karigar & Orders** | Custom orders and karigar work |
| **Gold Pledge Loans** | Gold loan operations |
| **GST & Reports** | Tax reports and sales register |
| **Accounts & Ledger** | Chart of accounts, voucher entry, trial balance |
| **Multi-Branch** | Stock transfer status overview across branches |
| **Barcode / RFID** | View tagged items by barcode or HUID |
| **Users & Roles** | Manage your team and their access levels |
| **Notifications** | In-app operational alerts (manual refresh) |
| **Admin & Settings** | Gold rate settings, number series |

---

## 2. The Dashboard

When you open Jewellery ERP, you see the **Dashboard**. This shows you:

- **Today's Sales** — Total sales amount for today
- **Items in Stock** — How many pieces are currently available
- **Open Transfers** — Items being moved between branches
- **Pending Orders** — Custom orders waiting

The **gold rate ticker** at the top of the screen shows you the **current sell rate per gram** for each metal and purity. A **green dot** means the rate is fresh. An **amber dot** means the rate has not been updated for more than 5 minutes — inform your manager.

---

## 3. Gold Rate

> Only the **shop admin or manager** can set the gold rate. Sales staff can view it.

### How to Set Today's Gold Rate (Admin/Manager)

1. Go to **Admin & Settings → Rate Override**.
2. Select the **metal** (Gold, Silver, etc.).
3. Select the **purity** (22K, 18K, etc.).
4. Enter the **buy rate** (what you pay when buying old gold).
5. Enter the **sell rate** (what you charge customers per gram).
6. Write a **reason** (e.g., "MCX rate 2026-05-05 morning").
7. Click **Save Rate**.

The rate will immediately appear in the gold rate ticker at the top of the screen.

**Example:**
> MCX today is ₹68,500 per 10 grams for 24K (999). For 22K (91.6% purity) with 1.5% markup, the sell rate works out to **₹6,373 per gram**. Your manager will enter this.

---

## 4. Customers

### Finding an Existing Customer

1. Go to **Billing & Sales → Customers**.
2. In the **Search** box, type the customer's name or mobile number.
3. The matching customer will appear — click on their name to see their details.

### Adding a New Customer

1. Go to **Billing & Sales → Customers**.
2. Click **+ Add Customer**.
3. Fill in the form:

| Field | Required? | What to Enter |
|-------|-----------|---------------|
| Name | Yes | Customer's full name |
| Mobile | Yes | 10-digit mobile number |
| Email | No | Email address if given |
| GSTIN | No | Only for GST registered businesses |
| PAN | No | PAN number if customer provides it |
| State | No | Customer's state (for GST calculation) |
| Address | No | Full address |
| Date of Birth | No | For birthday wishes |
| Anniversary | No | For anniversary wishes |

4. Click **Save Customer**.

> **Tip:** Always search first before adding a new customer. Duplicate customer records cause confusion later.

### Customer Detail Snapshot

When you open a customer from the list, the profile now shows an **Outstanding** snapshot:

- **Amount balance** (₹): how much the customer currently owes.
- **Metal balance** (grams): metal-adjusted outstanding, if applicable.
- **Last outstanding activity date**: most recent outstanding movement date.

Use **View party outstanding** from this card to open the full outstanding screen for deeper history and adjustments.

---

## 5. Inventory

### Finding a Piece in Stock

1. Go to **Stock & Inventory → Item Master**.
2. You will see a table of all items currently in the system.
3. To find a specific piece, use the **search** or **filter** options.

The table shows:
- **SKU** — The item code (click it to see full details)
- **Design** — Design name and category
- **Metal / Purity** — e.g., GOLD / 22K
- **Net Weight** — Weight in grams
- **Branch** — Which branch holds this item
- **Status** — See below

### Item Status Meanings

| Status | What It Means |
|--------|--------------|
| 🟢 **In Stock** | Available for sale |
| ⚫ **Sold** | Already sold in a bill |
| 🔵 **Issued** | Given to a karigar (artisan) for work |
| 🟡 **Transit** | Being moved between branches |
| 🔴 **Written Off** | Damaged or lost — removed from stock |

> You can only create a bill for items that show **In Stock**.

### Scanning a Barcode

If your shop has a barcode scanner:
1. Go to **Stock & Inventory → Item Master**.
2. Scan the item's barcode or HUID tag.
3. The item details will appear instantly.

---

## 6. Creating a Bill

This is the most common daily task. Follow these steps carefully.

### Step 1 — Open New Invoice

1. Go to **Billing & Sales**.
2. Click **+ New Invoice**.
3. The new bill form opens.

### Step 2 — Choose Bill Type

| Type | When to Use |
|------|------------|
| **Tax Invoice** | GST-registered customer; standard retail sale |
| **Cash Memo** | Walk-in customer; no GST details needed |
| **Estimate** | Showing a price to a customer — no stock is blocked |
| **Non-GST Bill** | Composition scheme shops (ask your manager) |

> **Default:** For most retail sales, use **Tax Invoice** or **Cash Memo**.

### Step 3 — Select the Customer

1. In the **Customer** field, start typing the name or mobile number.
2. Select the customer from the dropdown.
3. If it is a walk-in customer you don't want to add, leave it blank (for Cash Memo only).

### Step 4 — Add the Item(s)

For each item being sold:

1. Click **+ Add Line**.
2. In the **Item** field, type the SKU or scan the barcode.
3. The system will fill in:
   - Metal (e.g., GOLD)
   - Purity (e.g., 22K)
   - Weight (gross and net)
4. Check the **Rate Per Gram** — this should match today's gold rate shown in the ticker.
5. Choose the **Making Charge** method:
   - **Per Gram** — Enter rate per gram (e.g., ₹150/g)
   - **% of Metal Value** — Enter percentage (e.g., 12%)
   - **Per Piece** — Enter a flat amount (e.g., ₹500)
6. Enter **Wastage %** if applicable (ask your manager for the shop's standard).
7. Enter **Hallmarking Fee** if applicable (typically ₹45 per article).
8. Enter **Stone Value** if the piece has diamonds or stones (the assessed amount).

The system **automatically calculates**:
- Metal Value = Net Weight × Rate per gram
- Making Charge (based on the mode you chose)
- Wastage Amount
- GST (3% for gold, 18% for hallmarking)
- **Line Total**

**Example:**
> Mrs. Sharma is buying a 22K gold ring. Net weight 10g, rate ₹6,373/g, making charge 12%, wastage 6%, hallmarking ₹45.
>
> Metal value = 10 × 6,373 = **₹63,730**  
> Making = 63,730 × 12% = **₹7,647.60**  
> Wastage = 0.6g × 6,373 = **₹3,823.80**  
> Metal part = 63,730 + 7,647.60 + 3,823.80 = **₹75,201.40**  
> GST 3% = **₹2,256.04** (CGST ₹1,128.02 + SGST ₹1,128.02)  
> Hallmarking = ₹45 + ₹8.10 GST = ₹53.10  
> **Line Total = ₹77,510.54**

### Step 5 — Add Bill Discount (Optional)

1. Scroll down to **Bill Discount**.
2. Enter the discount amount in rupees (e.g., ₹500).
3. The system will automatically:
   - Spread the discount across all lines proportionally
   - Recalculate GST on the reduced amount
   - Show the new **Total Payable**

> **Important:** Only the manager can approve discounts above the shop limit. Check with your manager before offering large discounts.

### Step 6 — Review the Bill Summary

Before proceeding, review:

| Field | What to Check |
|-------|--------------|
| Total Amount | Does it match what you told the customer? |
| CGST / SGST | Should show equal amounts (for same-state sales) |
| IGST | Shows for out-of-state customers |
| Round-off | Small rounding (±₹0.50) is normal |
| Balance | How much the customer still needs to pay |

Click **Save as Draft** to save without issuing. The item will still show as **In Stock** until you issue the bill.

---

## 7. Collecting Payment

After the customer agrees on the total:

1. Scroll to the **Payment** section.
2. Click **+ Add Payment**.
3. Select the **Payment Mode**:

| Mode | When to Use |
|------|------------|
| **Cash** | Customer pays in cash |
| **UPI** | Google Pay, PhonePe, Paytm |
| **Card** | Debit or credit card |
| **Bank Transfer** | NEFT / RTGS |
| **Cheque** | Cheque payment |
| **Advance** | Customer has a prior advance/deposit |

4. Enter the **amount** received.
5. Add a **reference number** for UPI/card/bank (optional but helpful).
6. Click **Add**.

You can split payment across multiple modes. For example:
> Customer pays ₹50,000 in cash and ₹27,510.54 via UPI.
> Add two rows: Cash ₹50,000 + UPI ₹27,510.54.

The **Balance Amount** will update and show ₹0 when fully paid.

---

## 8. Old Gold Exchange

If the customer is exchanging old gold as part of the purchase:

1. In the bill form, scroll to **Old Gold Exchange**.
2. Click **+ Add Old Gold**.
3. Fill in:

| Field | What to Enter |
|-------|--------------|
| Metal | Gold, Silver, etc. |
| Description | Brief description (e.g., "Old bangle") |
| Gross Weight | Total weight including stone/solder (in grams) |
| Tested Purity | Purity after testing (e.g., 75.000 for 18K) |
| Buy Rate per Gram | Today's buy rate (ask manager — set in Admin) |

4. The system calculates:
   - **Pure Gold Grams** = Gross Weight × (Purity ÷ 99.9)
   - **Deduction Value** = Pure Grams × Buy Rate
5. This deduction value is subtracted from the **Balance Payable**.

**Example:**
> Customer gives an old 18K bangle. Gross weight 15g, tested purity 75.000, buy rate ₹5,800/g.
>
> Pure grams = 15 × (75 ÷ 99.9) = **11.261g**  
> Deduction = 11.261 × 5,800 = **₹65,314**  
>
> If the new bill total was ₹77,510, the customer only needs to pay **₹12,196**.

> **GST Note:** Old gold exchange is a separate purchase transaction. The new bill's GST is calculated on the full selling price — the exchange is a payment reduction, not a discount.

---

## 9. Issuing the Final Invoice

Once the customer has agreed to the bill and payment is collected:

1. Click **Issue Invoice**.
2. A confirmation dialog appears: "Issue invoice and mark item as SOLD?"
3. Click **Confirm**.

What happens automatically:
- The invoice number is assigned (e.g., INV00042)
- The item status changes to **Sold**
- The invoice is locked — it cannot be edited

> **Important:** Once issued, a bill cannot be changed. If there is a mistake, you need to **cancel** it (manager approval required) and create a new one.

### Printing / Sharing the Invoice

After issuing:
1. Click **Print** to print the invoice.
2. Click **Share** to send via configured channels (WhatsApp/SMS/Email, as enabled by your shop admin).

---

## 10. Estimates and Quotations

An estimate is a price preview — it does **not** mark the item as sold or assign an invoice number.

Use an estimate when:
- A customer wants to know the price before deciding
- You are preparing a quotation for a custom order

### Creating an Estimate

Follow the same steps as creating a bill, but:
1. In **Bill Type**, select **Estimate**.
2. Complete the form as usual.
3. Click **Issue Estimate**.

The estimate gets a number (e.g., EST00012) but the item remains **In Stock**.

### Converting an Estimate to Invoice (available from May 9, 2026)

To convert an estimate to a real Tax Invoice:
1. Open the estimate detail from **Billing & Sales → Invoices**.
2. Click **Convert to Invoice**.
3. A new **Tax Invoice (Draft)** is created with copied line items.
4. Review amounts/payment details, then issue the invoice normally.

Notes:
- Conversion is allowed only for estimate-type documents.
- Cancelled estimates cannot be converted.
- The original estimate remains available for traceability.
- Estimate date stays on the estimate record; it is not carried forward as accounting movement date.
- Stock/outstanding accounting effect is applied only when the converted invoice is actually **issued**.
- The converted invoice is a separate sales document; credit-note `reference_invoice` linkage is not used for this conversion flow.

---

## 11. Cancelling an Invoice

> **Only managers can cancel issued invoices.**

If a bill was issued with an error:

1. Open the invoice from **Billing & Sales → Invoices**.
2. Click **Cancel Invoice**.
3. A confirmation dialog asks for a **reason** (at least 3 characters).
4. Write the reason clearly (e.g., "Wrong rate entered, recreating bill").
5. Click **Confirm Cancel**.

What happens:
- Invoice status changes to **Cancelled**
- The item status reverts back to **In Stock**
- The original invoice number is preserved for audit trail (it cannot be reused)

> **Draft invoices** don't need cancellation — just delete them.

---

## 12. Stock Take (Physical Count)

A stock take is a physical count of all items to verify the system matches reality.

> **Only managers initiate stock takes.**

### For Staff Doing the Count

1. The manager will start a stock take session.
2. You will see a list of all items the system expects to be in stock.
3. For each item on the list:
   - **Find the physical piece.**
   - Enter the **counted quantity** (usually 1).
   - Enter the **counted weight** (weigh the piece).
4. If a piece is missing, leave the count at 0.
5. After counting all items, the manager will **complete** the stock take.

The system will show a **variance report** — any difference between system stock and counted stock.

---

## 13. Inter-Branch Transfer

If your shop has multiple branches and you need to send stock from one branch to another:

### Requesting a Transfer (Sending Branch)

1. Go to **Stock & Inventory → Transfers**.
2. Click **+ New Transfer**.
3. Enter the **From Branch** and **Destination Branch**.
4. Add the items to transfer by scanning or searching.
5. Click **Request Transfer**.

Rules enforced by system:
- Source and destination branch must be different.
- Only items currently **In Stock** can be added.
- Item branch must match the selected **From Branch**.

### Approving and Dispatching (Manager)

1. Manager reviews the transfer request.
2. If request is valid, click **Approve** then **Dispatch**.
3. If request is not valid, click **Reject** (available in `Requested` and `Approved` states).
4. Rejected transfers cannot be dispatched unless recreated as a new request.
5. The items move to **Transit** status.

### Receiving at the Destination Branch

1. The receiving branch staff opens the transfer.
2. Clicks **Mark Received**.
3. Items move back to **In Stock** at the new branch.

### Transfer Register (Branch-wise Report) — MVP policy

Use this for daily branch movement review and end-of-day reconciliation.

1. Open **Stock & Inventory → Transfers** and switch to **Transfer Register** (when enabled).
2. Set filters:
   - **From date / To date** (optional; maximum 92-day window when both dates are set)
   - **Status**: `All`, `Requested`, `Approved`, `In Transit`, `Received`, `Rejected`
   - **From Branch** and/or **To Branch**
3. Review summary and rows for transfer reference, branches, status, quantity/weight, and timestamps.
4. Click **Export CSV** only after verifying filters.

Operational rules:
- If **From date** is after **To date**, the system shows a validation error.
- If selected date range exceeds 92 days, the system shows a validation error.
- If both branch filters are same branch, result can be empty (valid condition).
- Export always uses the exact same filters as preview.
- If no rows are present, export is disabled.
- Export action is available only to users with report-export permission in Jewellery role policy.
- This report is operational; advanced valuation analytics are planned for a future phase.

---

## 14. Multi-Branch Overview

The **Multi-Branch** page gives you a real-time summary of all inter-branch stock transfers without leaving the page.

### Summary Cards

At the top of the page (when no filter is active) you will see three cards:
- **Pending** — Transfer requests waiting for manager approval
- **Approved** — Approved but not yet dispatched
- **In Transit** — Dispatched and on the way to the receiving branch

### Filtering Transfers

Use the filter pills below the summary cards to narrow the list:

| Filter | What it shows |
|--------|--------------|
| **All** | Every transfer record |
| **Pending** | REQUESTED status |
| **Approved** | APPROVED status |
| **In Transit** | IN_TRANSIT status |
| **Received** | Already received at destination |
| **Rejected** | Rejected by manager |

### Viewing a Transfer

Each transfer card shows:
- **From branch → To branch**
- **Status badge** (colour-coded)
- Item count, creation date, dispatch date (if sent), received date (if received)
- Any notes added during creation

Click **View** on any card to open the transfer detail page where you can approve, dispatch, reject, or receive.

---

## 15. GST Report Preview and Sales Register

The **Reports** page has two sections: GST Filing cards and the Sales Register.

### GST Filing Cards

| Card | What it links to |
|------|-----------------|
| **GSTR-1** | Section-wise invoice preview with CSV export |
| **GSTR-3B** | Net tax summary with outward supplies and ITC |

Click either card to open the full GST Reports screen. Use it for day-wise GST checks before handing off to your CA:

1. Set **From date / To date** for the filing window.
2. Choose **Invoice type** (All / Tax Invoice / Credit Note / Estimate) and **GST view** (B2B / B2C).
3. Review summary cards: Taxable Amount, CGST, SGST, IGST, Invoice Total.
4. Click **Export CSV** to download for CA review.

> Export is enabled only when preview rows are present. If loading fails, click Retry.

### Sales Register

The Sales Register gives you a full list of invoices for any date range.

1. Under the **Sales Register** heading, enter **Date From** and **Date To**.
2. Click **Load**.
3. The table shows: Voucher No, Date, Type, Customer, Taxable Amount, GST, Total, Status.
4. The badge in the top-right shows how many invoices are displayed (up to 50 per page).

---

## 16. Accounts & Ledger

> **For managers and accountants only.** Counter staff do not need this section.

The **Accounts & Ledger** page has three tabs: **COA**, **Vouchers**, and **Trial Balance**.

### COA (Chart of Accounts)

This is a tree of all accounts in your shop's books — assets, liabilities, income, expenses, and equity.

1. Open **Accounts & Ledger** from the sidebar.
2. Click the **COA** tab (default).
3. You will see top-level account groups. Click the **arrow** on any group to expand its sub-accounts.
4. Each account shows a coloured type badge (Asset / Liability / Income / Expense / Equity).

> System accounts (Cash, Bank, Accounts Payable, Sales, GST Payable, Stock) are pre-seeded and cannot be deleted.

### Vouchers

Vouchers are the accounting entries that move money between accounts.

1. Click the **Vouchers** tab.
2. Use the **Date From / Date To** filters and the **Type** filter (All / Receipt / Payment / Journal / Contra) to find entries.
3. Each voucher shows its number, date, type, status (Draft / Posted), and total amount.
4. Click **New Voucher** to open the entry form:
   - Select **Voucher Type** and **Date**.
   - Add lines: each line needs an account, a debit amount, and a credit amount.
   - Total debits must equal total credits before you can save.
5. Click **Save** to save as Draft, or click **Post** on a draft voucher to post it to the ledger permanently.

> **Posted vouchers cannot be edited.** Always review carefully before posting.

### Trial Balance

1. Click the **Trial Balance** tab.
2. Enter **From Date** and **To Date**.
3. Click **Load**.
4. The table shows each account with total debits, total credits, and the net balance for the period.

---

## 17. Team Users & Roles

> **Admin users only.** Use this to manage who on your team can access the Jewellery module and what they can do.

### Viewing Your Team

1. Go to **Users & Roles** from the Jewellery sidebar.
2. You will see a list of all staff who have been granted a Jewellery module role.
3. Each row shows: Staff name, mobile number, role badge (Admin / Manager / Cashier), branch, and when access was granted.

### Role Levels

| Role | What they can do |
|------|-----------------|
| **Admin** | Full access — settings, rates, admin controls, all reports |
| **Manager** | Can approve transfers, cancel invoices, manage karigar |
| **Cashier** | Can create bills and collect payments only |

### Granting Access

1. Click **+ Grant Access** (or the equivalent button shown in the screen).
2. Enter the staff member's mobile number.
3. Select their role and branch.
4. Click **Save**.

The staff member can now log in and access the Jewellery module with the role you assigned.

### Revoking Access

1. Find the staff member in the list.
2. Click the **Revoke** button on their row.
3. A confirmation dialog appears: confirm to remove their access.

> Revoking access does not delete their user account — they can still log in but will see no Jewellery module features.

---

## 18. Barcode / RFID Tagged Items

The **Barcode / RFID** page lets you quickly find any item in your inventory using its barcode or HUID (Hallmark Unique ID).

### Searching Tagged Items

1. Open **Barcode / RFID** from the Stock & Inventory section.
2. In the search box, type the **barcode number** or **HUID** of the item.
3. The table below will filter instantly to matching items.

Each row shows:
- **SKU** — internal item code
- **Barcode** — barcode number printed on the tag
- **HUID** — government hallmarking unique ID
- **Metal / Purity** — e.g., GOLD / 22K
- **Branch** — which branch currently holds this item
- **Status** badge — In Stock, Sold, Transit, Written Off

### Print Tags

> **Barcode / RFID tag printing is coming in a future update.** The "Print Tags" feature is visible but disabled. It will be activated in a later phase.

---

## 19. Common Questions and Problems

### "I can't find the item when creating a bill"

- Make sure the item shows **In Stock** in the inventory.
- Try searching by SKU, barcode, or HUID number.
- If the item shows **Issued** or **Sold**, it's not available.

### "The GST amount looks wrong"

- Check whether the customer's state matches your shop's state.
  - **Same state** → CGST + SGST (each at half the rate)
  - **Different state** → IGST (full rate)
- Ask your manager to verify the seller state code is correctly set in Admin.

### "The gold rate in the bill doesn't match the ticker"

- The rate in the bill is what was entered **at the time you opened the form**.
- If the rate changed since then, **reload the form** or update the rate manually on the line.
- Always confirm the rate with your manager before issuing a bill.

### "I issued the bill but made a mistake"

- Immediately inform your manager.
- Manager will cancel the invoice with a reason.
- Create a new corrected bill.
- Do **not** try to create a second bill for the same item without cancelling the first.

### "The customer wants a duplicate copy of their invoice"

- Go to **Billing & Sales → Invoices**.
- Search by customer name or invoice number.
- Open the invoice and click **Print**.
- Mark the printed copy as "DUPLICATE" so it is clear.

### "The item I just sold still shows as In Stock"

- This happens if the bill was saved as **Draft** but not **Issued**.
- Open the draft bill and click **Issue Invoice**.
- If you already issued it and it still shows In Stock, contact your manager — there may be a system issue.

### "Customer is paying in installments"

- When creating the bill, only enter the amount received **today** in the Payments section.
- The **Balance Amount** will show the remaining amount.
- Each time the customer pays, open the invoice and add a new payment row.
- *(Full installment tracking is coming in a future update.)*

### "I can only see recent outstanding movements"

- In **Outstanding** detail, movements are shown in pages (latest first).
- Click **Load more movements** to fetch older entries.
- If very old entries are still not visible, ask your manager/admin to check filters and date range.

### "How do Jewellery notifications work right now?"

- Open **Jewellery → Notifications**.
- Click **Refresh** to fetch latest alerts from backend records.
- Alerts are stored in system database; no external SMS/WhatsApp/email is sent in current MVP mode.
- Click an alert to open the related workflow page.
- If you expect an alert and do not see it, refresh once and ask manager to verify the triggering business action.

---

## API Reference (For Managers and IT)

| Action | Method | URL |
|--------|--------|-----|
| List customers | GET | `/api/jwl/v1/sales/customers/` |
| Create customer | POST | `/api/jwl/v1/sales/customers/` |
| List invoices | GET | `/api/jwl/v1/sales/invoices/` |
| Create draft invoice | POST | `/api/jwl/v1/sales/invoices/` |
| Issue invoice | POST | `/api/jwl/v1/sales/invoices/{id}/issue/` |
| Cancel invoice | POST | `/api/jwl/v1/sales/invoices/{id}/cancel/` |
| Convert estimate to invoice draft | POST | `/api/jwl/v1/sales/invoices/{id}/convert-to-invoice/` |
| Preview calculation | POST | `/api/jwl/v1/sales/calculate/` |
| Live gold rates | GET | `/api/jwl/v1/rates/live/` |
| Set rate override | POST | `/api/jwl/v1/rates/override/` |
| List items | GET | `/api/jwl/v1/items/` |
| Scan item | GET | `/api/jwl/v1/items/scan/{code}/` |
| Write off item | POST | `/api/jwl/v1/items/{id}/write-off/` |
| Start stock take | POST | `/api/jwl/v1/stock-takes/` |
| Complete stock take | POST | `/api/jwl/v1/stock-takes/{id}/complete/` |
| Create transfer | POST | `/api/jwl/v1/transfers/` |
| Approve transfer | POST | `/api/jwl/v1/transfers/{id}/approve/` |
| Dispatch transfer | POST | `/api/jwl/v1/transfers/{id}/dispatch/` |
| Reject transfer | POST | `/api/jwl/v1/transfers/{id}/reject/` |
| Receive transfer | POST | `/api/jwl/v1/transfers/{id}/receive/` |
| GST GSTR-1 preview contract | GET | `/api/jwl/v1/reports/gstr-1/?period=YYYYMM` |
| GST GSTR-1 CSV export (permission-gated) | GET | `/api/jwl/v1/reports/gstr-1/?period=YYYYMM&file_format=excel` |
| GST GSTR-3B summary contract | GET | `/api/jwl/v1/reports/gstr-3b/?period=YYYYMM` |
| List notifications (in-app) | GET | `/api/notifications/` |
| Refresh notifications (in-app) | POST | `/api/notifications/refresh/` |
| Mark notification as read | PATCH | `/api/notifications/{id}/read/` |
| Outstanding movement history (paginated) | GET | `/api/jwl/v1/outstanding/{id}/movements/` |
| Chart of accounts tree | GET | `/api/jwl/v1/accounts/coa/` |
| List vouchers | GET | `/api/jwl/v1/accounts/vouchers/` |
| Create voucher | POST | `/api/jwl/v1/accounts/vouchers/` |
| Post voucher to ledger | POST | `/api/jwl/v1/accounts/vouchers/{id}/post/` |
| Trial balance | GET | `/api/jwl/v1/accounts/trial-balance/` |
| Module team roles | GET | `/api/users/modules/jewellery/team-roles/` |
| Grant module role | POST | `/api/users/modules/jewellery/team-roles/` |
| Revoke module role | DELETE | `/api/users/modules/jewellery/team-roles/{id}/` |

---

## Features Coming Soon 🚧

| Feature | What It Will Do |
|---------|----------------|
| **Karigar / Custom Orders** | Full job-card lifecycle: issue gold to karigar, track return, link to sales |
| **Gold Pledge Loans** | Manage gold-secured loans with interest accrual and repayment schedule |
| **Barcode / RFID Tag Printing** | Print barcode + HUID tags directly from the inventory screen |
| **GSTN Signed E-Invoice (IRN)** | Real government-registered IRN + QR via GSP integration |
| **Multi-Branch Analytics** | Compare sales, stock value, and margins across all branches |

---

*For technical issues, contact your system administrator.*  
*For product feedback, visit: github.com/anthropics/claude-code/issues*
