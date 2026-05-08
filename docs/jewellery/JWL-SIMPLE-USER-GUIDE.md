# DigiKhaato Jewellery (JWL) - Simple User Guide
## Shopkeeper aur Sales Staff ke liye (Non-Technical)

**Version:** 1.1  
**Date:** 07 May 2026  
**Kis ke liye:** Shop owner, counter salesman, cashier, manager

---

## Is Guide ka Maksad
Ye guide technical language me nahi hai. Isme seedha bataya gaya hai:
- Kaun sa screen kab use karna hai
- Kaun sa button dabana hai
- Bill kaise banana hai
- Payment kaise lena hai
- Galti hone par kya karna hai

Agar aap computer me expert nahi ho tab bhi ye guide follow karke daily kaam kar sakte ho.

---

## Table of Contents

1. Pehle Din Setup
2. Roz ka Daily Kaam (Morning to Night)
3. Customer ka kaam
4. Inventory (Stock) ka kaam
5. Billing (Sabse important)
6. Old Gold Exchange
7. Payment lena (Cash / UPI / Split)
8. Invoice Issue, Print, Share
9. Credit Note (Return Bill)
10. Outstanding (Kis se paisa lena hai)
11. Karigar ka kaam
12. Gold Pledge Loan (basic)
13. Common Mistakes aur Unka Solution
14. FAQ
15. Portal Security (Simple aur Zaroori)
16. Abhi kya pending hai (simple roadmap)

---

## 1) Pehle Din Setup

### Step 1: Login
1. Mobile number daalo
2. Password daalo
3. `Login` dabao

### Step 2: Jewellery Module kholna
1. Left side menu me `Jewellery` select karo
2. Dashboard open hoga

### Step 3: Aaj ka Gold Rate check karo
1. `Settings > Rates` me jao
2. 22K/18K ka rate check karo
3. Agar rate update karna ho to manager karega

**Important:** Galat rate se poora bill galat banega.

---

## 2) Roz ka Daily Kaam (Morning to Night)

### Subah ka kaam (shop open hote hi)
1. Aaj ka rate verify karo
2. Outstanding check karo (kisko follow-up karna hai)
3. Kal ke pending orders/karigar status dekho

### Din bhar counter ka kaam
1. Customer select karo
2. Item search ya barcode scan karo
3. Bill banao
4. Payment lo
5. Invoice issue karo

### Raat ka closing kaam
1. Aaj ka sales total dekho
2. Draft bills check karo (koi pending na ho)
3. Wrong entry ho to manager ko batao

---

## 3) Customer ka kaam

## 3.1 Naya customer banana
Path: `Jewellery > Customers > New`

| Field | Kya daalna hai | Zaroori? |
|---|---|---|
| Name | Customer ka naam | Haan |
| Mobile | 10-digit number | Haan |
| Address | Pura address | Nahi |
| GSTIN | B2B customer ho to | Nahi |
| PAN | Agar customer de | Nahi |

### Simple rule
- Pehle search karo, phir naya customer banao.
- Duplicate customer mat banao.

## 3.2 Customer search
Path: `Jewellery > Customers`
- Name ya mobile type karo
- List me customer select karo

---

## 4) Inventory (Stock) ka kaam

## 4.1 Item dekhna
Path: `Jewellery > Inventory`

Aapko yeh details dikhegi:
- SKU
- Design name
- Metal/Purity
- Net weight
- Status

## 4.2 Status ka matlab

| Status | Meaning |
|---|---|
| IN_STOCK | Bikne ke liye ready |
| SOLD | Item already bech chuke |
| ISSUED | Karigar ko diya hua |
| TRANSIT | Branch transfer me hai |
| WRITTEN_OFF | Damaged/loss entry |

## 4.3 HUID simple rule
- HUID format 6 characters hona chahiye (jaise AB12CD)
- Same HUID do items pe allowed nahi

---

## 5) Billing (Sabse Important)

Path: `Jewellery > Billing > New Invoice`

## 5.1 Bill banane ka fast process
1. Bill type select karo (`Tax Invoice`, `Cash Memo`, `Estimate`, `Credit Note`)
2. Customer select karo
3. `Add line` dabao
4. Item search karo (SKU/barcode/HUID)
5. Quantity/weight/rate check karo
6. Making + wastage + GST auto-calc check karo
7. Payment section me amount bharo
8. `Save Draft` ya `Save & Issue`

## 5.2 Item search ka best use
- 2 letters type karo (example: `RG`)
- Dropdown me item select karo
- Item select hote hi ye fields auto-fill honge:
  - metal
  - purity
  - gross/net weight
  - stone weight
  - rate per gram
  - HUID chip

## 5.3 Wireframe - New Bill Screen (Simple)

```text
+------------------------------------------------------+
| [Document Type] [Customer Search] [State/Place]      |
|------------------------------------------------------|
|  LINE ITEMS                                           |
|  [Item Search____] [Description____] [HSN____]        |
|  [Metal] [Purity] [Gross] [Net] [Stone] [Rate/g]     |
|  [Making Mode] [Making Rate] [Wastage%] [GST%]       |
|  Line Total: ₹ ______                                  |
|  (+ Add line)                                          |
|------------------------------------------------------|
| PAYMENT SPLIT                                          |
|  [Mode] [Amount] [Reference] (+ Add)                  |
|------------------------------------------------------|
| TOTAL ₹ ______   [Save Draft]   [Save & Issue]        |
+------------------------------------------------------+
```

## 5.4 Bill type kab use kare

| Bill Type | Kab use kare |
|---|---|
| TAX_INVOICE | Regular GST bill |
| CASH_MEMO | Walk-in cash customer |
| ESTIMATE | Sirf quote dena ho |
| CREDIT_NOTE | Return/adjustment |

---

## 6) Old Gold Exchange

Bill form me `Old Gold` section use karo.

### Fields
- Metal code
- Gross weight
- Tested purity
- Buy rate per gram

### System kya karta hai
System khud calculate karta hai:
- Pure grams
- Deduction amount
- Final payable kam kar deta hai

### Example
Agar deduction ₹20,000 aya aur bill ₹80,000 hai, to customer se ₹60,000 lena hai.

---

## 7) Payment lena (Cash / UPI / Split)

## 7.1 Single payment
- Mode select karo (`CASH`, `UPI`, `CARD`, `BANK`)
- Amount daalo
- Save

## 7.2 Split payment (2 ya zyada mode)
Example:
- Cash: ₹40,000
- UPI: ₹18,500

System paid amount aur balance amount khud update karta hai.

## 7.3 Payment ke simple rules
- Amount 0 se bada hona chahiye
- UPI/card me reference daalna best practice hai

---

## 8) Invoice Issue, Print, Share

Invoice detail page pe:
- `Issue invoice` (draft ko final banana)
- `Print`
- `Download PDF`
- `Share` (WA/SMS/Email)

## 8.1 E-Invoice IRN warning ko samjho
Agar simulated IRN hai, system amber warning dikhaata hai.

Simple meaning:
- Ye internal reference IRN hai
- Government GST portal pe automatically file nahi hua

Aise case me compliance team/CA process follow karo.

---

## 9) Credit Note (Return Bill)

Path: Invoice detail > `Create credit note`

Steps:
1. Original issued invoice select ho
2. Return line items select karo
3. Credit note issue karo

Important behavior:
- Return item stock wapas `IN_STOCK` ho sakta hai (rule-based)

---

## 10) Outstanding (Kis se paisa lena hai)

Path: `Jewellery > Outstanding`

Aap dekh sakte ho:
- Party wise balance
- Ageing buckets (0-30, 31-60, 61-90, 90+ days)
- Movement history

## 10.1 Ageing wireframe

```text
+------------------------------------------------------+
| 0-30 days | 31-60 days | 61-90 days | 90+ days       |
| ₹_____    | ₹_____      | ₹_____      | ₹_____         |
+------------------------------------------------------+
| Party Name     Balance ₹      Metal g      Bucket      |
| ABC Jewellers  125000         0            90+         |
| Ramesh         -5000          0            0-30        |
+------------------------------------------------------+
```

## 10.2 Manual adjustment
- Sirf authorized role kare
- Notes minimum 5 characters daalna zaroori

---

## 11) Karigar ka kaam

Path: `Jewellery > Karigar`

## 11.1 Karigar add/edit
Fields:
- Name
- Mobile (10 digit)
- PAN (optional, format check)
- Wastage/Labour defaults
- Active/Inactive toggle

## 11.2 Inactive ka matlab
- Naya assignment nahi milega
- Purana history record safe rahega

## 11.3 Karigar flow
- Issue voucher create karo
- Receipt entry karo
- Wastage/purity reconciliation dekho

---

## 12) Gold Pledge Loan (Basic)

Path: `Jewellery > Gold Pledge`

Use case:
- Customer gold pledge karta hai
- Scheme select karke loan disburse hota hai
- Repayment me principal + interest track hota hai

Basic required fields:
- Customer
- Scheme
- Principal
- Tenure
- Pledge items

---

## 13) Common Mistakes aur Solution

| Mistake | Result | Solution |
|---|---|---|
| Wrong customer select | Reporting mismatch | Bill save se pehle customer check karo |
| Item select bina manual description | Incomplete line | Description + net weight confirm karo |
| Old rate use kiya | Wrong billing value | Bill se pehle rate check mandatory |
| Draft issue nahi kiya | Stock sold nahi hoga | Final me `Save & Issue` karo |
| Duplicate customer | Ledger confusion | Pehle mobile se search karo |
| Adjustment bina notes | Audit problem | Proper reason likho |

---

## 14) FAQ (Bahut common sawal)

### Q1: Item search me item nahi aa raha?
Check karo:
1. Status `IN_STOCK` hai?
2. SKU/barcode/HUID sahi hai?
3. Credit note flow me SOLD items search chahiye?

### Q2: Bill issue button disable kyun hai?
- Required line incomplete ho sakti hai
- Permission issue ho sakta hai
- Lock period ho sakta hai

### Q3: HUID error kyun aaya?
- Format galat hai ya duplicate hai
- HUID 6 uppercase alphanumeric hona chahiye

### Q4: Outstanding me negative value ka matlab?
- Shop ko customer ko dena hai (credit/advance)

### Q5: Karigar dropdown me naam nahi aa raha?
- Karigar inactive ho sakta hai

---

## 15) Portal Security (Simple aur Zaroori)

Ye section bahut important hai. Isse aapka data, customer details, aur shop ka paisa dono safe rehta hai.

## 15.1 Portal ka data kaise safe rehta hai (simple language)
- Har user ka alag login hota hai.
- System me har kaam ka record banta hai (kisne kab kya kiya).
- Issued invoice history track hoti hai, isliye baad me check possible hai.
- Role-based access se sabko same permission nahi milti.

Iska seedha fayda:
- Galat entry trace ho jati hai
- Fraud risk kam hota hai
- Audit time pe proof milta hai

## 15.2 Shop staff ke liye 10 security rules
1. Password kisi ko mat do (owner ko bhi plain text me message na bhejo).
2. OTP kabhi share mat karo.
3. Counter chhodte waqt `Logout` zaroor karo.
4. Shared computer pe browser password save mat karo.
5. Unknown link se login mat karo, sirf official portal URL use karo.
6. Har payment entry me amount aur mode dobara check karo.
7. UPI/card reference jaha possible ho, zaroor bharo.
8. Customer mobile number galat save mat karo (future fraud/dispute hota hai).
9. Inactive staff ka access turant band karvao (admin se).
10. Daily closing pe owner/manager summary verify kare.

## 15.3 Role safety (simple)

| Role | Kya kare | Kya na kare |
|---|---|---|
| Sales Staff | Customer select, item add, draft bill | Manual outstanding adjustment |
| Cashier | Payment entry, invoice issue (agar allowed) | Karigar master edit |
| Manager | Rate check, correction approval, adjustment | Password share |
| Owner/Admin | User access control, final review | Daily ops kisi ek user ID se run na kare |

## 15.4 Agar mobile/laptop kho jaye to kya kare
1. Turant owner/admin ko bolo.
2. Same din password reset karo.
3. Us user ka session logout karvao (all devices).
4. Last 24 ghante ki entry report check karo.
5. Koi suspicious invoice/payment dikhe to note banake lock/review karo.

## 15.5 Daily secure closing checklist (5 minute)
1. Aaj ke issued invoices count verify karo.
2. Payment total vs cash/UPI total match karo.
3. Koi pending draft abnormal to nahi (jaise high value).
4. Outstanding me large manual adjustment check karo.
5. System se logout karke hi shop close karo.

## 15.6 Fraud warning signs
- Same customer naam ke multiple duplicate records
- Bahut frequent round-figure manual adjustments
- UPI payment without reference repeatedly
- Draft bills ban rahe hain, issue nahi ho rahe
- Inactive karigar/customer ko use kiya ja raha hai

Aise cases me:
1. Entry freeze karo
2. Manager ko turant escalate karo
3. Correction reason likho aur approve karke hi aage badho

---

## 16) Abhi kya pending hai (Simple roadmap)

Ye features improve ho rahe hain:
1. Aur simple reports + export UX
2. Full legal e-invoice integration (GSP)
3. Advanced multi-branch controls
4. Better notification automation
5. Offline/sync enhancement for weak network areas

---

## Quick Training Script (Manager use kar sakta hai)

### New staff ko 30 min me ye 5 cheeze sikhao:
1. Customer search/create
2. Item search and line add
3. Payment split
4. Save draft vs issue difference
5. Outstanding screen read karna

---

## Screenshot Placeholder List (Final training version me add kare)
1. Login screen
2. Jewellery dashboard
3. New invoice screen
4. Item search dropdown
5. Old gold section
6. Payment split section
7. Invoice detail (print/share)
8. Outstanding list + detail drawer
9. Karigar edit drawer
10. Gold pledge new form
