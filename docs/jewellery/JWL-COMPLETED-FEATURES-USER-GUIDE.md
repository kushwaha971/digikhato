# DigiKhaato Jewellery (JWL) - Completed Features User Guide
## Shopkeeper, Salesman, Cashier ke liye Simple Guide (Non-Technical)

**Version:** 1.0  
**Date:** 07 May 2026  
**Scope:** Sirf woh features jo abhi system me complete aur usable hain

---

## Is Document ka Scope (Bahut Important)
Yeh guide **sirf completed features** ke liye hai.  
Isme koi future ya half-done feature include nahi hai.

Aaj ke date par is guide me cover features:
1. Billing me fast Item Search + Barcode + Auto Fill
2. Invoice me IRN safety warning (Simulated IRN disclaimer) + QR display
3. Party Outstanding page + ageing + movement + manual adjustment
4. Karigar edit drawer + active/inactive control
5. Inventory me Purity Tracking view + HUID Tracking view

---

## Table of Contents
1. Kaun user kya use kare
2. Feature 1: Fast Item Search Billing me
3. Feature 2: IRN Safety Warning aur QR
4. Feature 3: Party Outstanding (Recovery Register)
5. Feature 4: Karigar Edit aur Inactive Control
6. Feature 5: Purity & HUID Tracking
7. Form Fields and Validations (sirf completed features)
8. Formula aur Calculation (simple language)
9. Security aur Safe Use Rules
10. Daily Working Flow (Counter se Closing tak)
11. Limitations (abhi kya nahi hai)
12. FAQ

---

## 1) Kaun user kya use kare

| User Type | Main kaam |
|---|---|
| Salesman | Item search, line add, bill draft |
| Cashier | Payment split, invoice issue, print/share |
| Manager | Outstanding follow-up, manual adjustment, karigar update |
| Owner/Admin | User control, compliance check, daily audit |

---

## 2) Feature 1: Fast Item Search Billing me

### Iska fayda
- 500+ items me bhi item jaldi milta hai
- Barcode scanner se direct pick hota hai
- Line me metal, purity, weight, rate auto-fill hota hai
- Manual typing mistakes kam hoti hain

### User ka step-by-step
1. `Jewellery > Billing > New Invoice` kholo
2. `Add line` dabao
3. Item field me SKU / Barcode / HUID type karo
4. Minimum 2 character ke baad result list aayegi
5. Item select karo
6. System auto-fill karega line details

### Auto-fill kya hota hai
- Metal code
- Purity code
- Gross wt
- Net wt
- Stone wt
- Rate per gram (live rate match hone par)
- HUID chip

### Barcode behavior
- Scanner se code enter + Enter
- System direct item scan API call karta hai

### BA/Designer Wireframe (WF-01)

```text
..........................................................................
. WF-01 : NEW INVOICE - LINE ITEM SEARCH                                 .
..........................................................................
. [01] Bill Type   [02] Customer Search   [03] Place of Supply          .
.------------------------------------------------------------------------.
. LINE ITEM 1                                                            .
. [04] Item Search (SKU / Barcode / HUID)                                .
.      -> dropdown result list (max 30)                                  .
.------------------------------------------------------------------------.
. [05] Description      [06] HSN                                          .
. [07] Metal  [08] Purity [09] Gross [10] Net [11] Stone [12] Rate/g     .
. [13] HUID chip (read only if item me available)                         .
.------------------------------------------------------------------------.
. [14] Making Mode [15] Making Rate [16] Wastage% [17] GST%              .
.------------------------------------------------------------------------.
. [18] + Add line                         [19] Line Total                 .
..........................................................................
Interaction Notes:
- [04] par 2 character se pehle search API fire nahi hota.
- Scanner use karne par manual dropdown wait nahi hota.
- Selected item clear karne ke liye chip ke saath "Clear" available hai.
```

---

## 3) Feature 2: IRN Safety Warning aur QR

### Iska fayda
- Staff ko clear warning milti hai ki IRN legal GST portal par submit nahi hua
- Galat compliance claim se bachav hota hai
- Simulated IRN clearly mark hota hai

### User ka step-by-step
1. Issued invoice detail page kholo
2. B2B Tax Invoice me agar simulated IRN hai to amber warning dikhegi
3. `More > Generate IRN` par click karo
4. Disclaimer padho
5. Checkbox tick karo
6. Tabhi `Generate IRN` button active hoga

### System behavior
- IRN panel me `SIMULATED` badge dikhega
- QR code image format me dikhega
- Warning text clear bolta hai: GSTN/IRP pe register nahi hua

### BA/Designer Wireframe (WF-02)

```text
..........................................................................
. WF-02 : INVOICE DETAIL - IRN SAFETY PANEL                              .
..........................................................................
. [01] Amber Compliance Banner                                            .
.      "IRN not submitted to GSTN - internal reference only"             .
.------------------------------------------------------------------------.
. [02] E-Invoice Details                                                  .
.      [03] IRN Value (long hash text)                                   .
.      [04] Badge: SIMULATED                                              .
.      [05] QR Code (image block)                                         .
.------------------------------------------------------------------------.
. [06] More Menu -> Generate IRN                                          .
..........................................................................

..........................................................................
. WF-02A : GENERATE IRN CONFIRM MODAL                                    .
..........................................................................
. [01] Title: Generate Reference IRN                                      .
. [02] Amber warning text block                                           .
. [03] Checkbox: "I understand this is not GST portal IRN"               .
. [04] Cancel Button           [05] Generate IRN (disabled until checked) .
..........................................................................
```

---

## 4) Feature 3: Party Outstanding (Recovery Register)

### Iska fayda
- Kisko paisa lena hai, ek screen me clear
- Ageing bucket se follow-up priority milti hai
- Party movement history available hai
- Manual adjustment controlled tareeke se possible hai

### User ka step-by-step
1. `Jewellery > Outstanding` kholo
2. Ageing cards (0-30, 31-60, 61-90, 90+) dekho
3. Party row click karo
4. Drawer me movement history dekho
5. Zarurat ho to authorized role se manual adjustment karo

### Screen pe kya dikhta hai
- Total receivable amount
- 90+ overdue count
- Party wise cash balance and metal balance (grams)
- Last 50 movements

### BA/Designer Wireframe (WF-03)

```text
..........................................................................
. WF-03 : OUTSTANDING LIST SCREEN                                         .
..........................................................................
. [01] Header: Total Receivable + Overdue 90+                            .
. [02] Include Zero Balance checkbox                                      .
. [03] Manual Adjustment button (role-based)                              .
.------------------------------------------------------------------------.
. [04] Ageing Cards                                                       .
.      [0-30] [31-60] [61-90] [90+]                                      .
.------------------------------------------------------------------------.
. [05] Party List                                                         .
.      Party Name | Mobile | Bucket Badge | Amount | Metal grams         .
..........................................................................

..........................................................................
. WF-03A : PARTY DETAIL DRAWER                                            .
..........................................................................
. [01] Cash Balance [02] Metal Balance [03] Last Activity                .
.------------------------------------------------------------------------.
. [04] Movement List (Last 50)                                            .
.      Date | Type | Amount | Metal | Ref | Notes                        .
.------------------------------------------------------------------------.
. [05] Post Adjustment (role-based)       [06] Close                      .
..........................................................................

..........................................................................
. WF-03B : MANUAL ADJUSTMENT DRAWER                                       .
..........................................................................
. [01] Party (read only)                                                  .
. [02] Amount Delta (INR)                                                 .
. [03] Metal Delta (g)                                                    .
. [04] Date (future date allowed nahi)                                    .
. [05] Notes (min 5 chars)                                                .
. [06] Save Adjustment                                                     .
..........................................................................
```

---

## 5) Feature 4: Karigar Edit aur Inactive Control

### Iska fayda
- Duplicate karigar banana kam hota hai
- Mobile/rate update easy hai
- Inactive karigar ko new assignment se roka ja sakta hai

### User ka step-by-step
1. `Jewellery > Karigar` kholo
2. Karigar row me `Edit` click karo
3. Drawer me details update karo
4. `Active` checkbox se inactivate/reactivate karo
5. `Save changes` dabao

### Important behavior
- Inactive karigar list history me rehta hai
- Inactive hone par new assignment avoid hota hai

### BA/Designer Wireframe (WF-04)

```text
..........................................................................
. WF-04 : KARIGAR EDIT DRAWER                                             .
..........................................................................
. [01] Name *             [02] Mobile *                                   .
. [03] Specialization     [04] Default Wastage %                          .
. [05] Default Labour     [06] PAN                                        .
. [07] Code (read only)   [08] Aadhaar last 4                             .
. [09] Active checkbox (disable -> no new assignments)                    .
.------------------------------------------------------------------------.
. [10] Cancel                                 [11] Save Changes           .
..........................................................................
```

---

## 6) Feature 5: Purity & HUID Tracking

### 6.1 Purity Tracking View
Use: stock purity-wise dekhna (in-stock summary)

Aap dekh sakte ho:
- Metal + purity card
- Item count
- Net/Gross/Charge weight totals
- Purity click karke item list filter

### Wireframe (WF-05)

```text
..........................................................................
. WF-05 : PURITY TRACKING                                                 .
..........................................................................
. [01] Metal Filter dropdown                                              .
.------------------------------------------------------------------------.
. [02] Summary Cards (per purity)                                         .
.      GOLD 22K | items | net wt | gross wt | charge wt                  .
.------------------------------------------------------------------------.
. [03] Filtered Item List                                                  .
.      SKU | Design | Net wt | Open link                                 .
..........................................................................
```

### 6.2 HUID Tracking View
Use: kis item me HUID hai / missing hai quickly check karna

Aap dekh sakte ho:
- Search by HUID or SKU
- Filter: All / Has HUID / Missing HUID / Hallmarked
- Hallmark status badge

### Wireframe (WF-06)

```text
..........................................................................
. WF-06 : HUID TRACKING                                                   .
..........................................................................
. [01] Search HUID / SKU                                                  .
. [02] Filter dropdown                                                    .
.------------------------------------------------------------------------.
. [03] Result Grid                                                        .
.      SKU | Design | HUID | Metal/Purity | Hallmark | Open              .
.------------------------------------------------------------------------.
. [04] No HUID row -> "No HUID" danger badge                             .
..........................................................................
```

---

## 7) Form Fields and Validations (Completed Features Only)

## 7.1 Billing Item Search Line

| Field | Rule |
|---|---|
| Item Search | Minimum 2 character par search open |
| Search results | Max 30 rows display |
| Invoice Type = Credit Note | Search SOLD items |
| Invoice Type normal | Search IN_STOCK items |
| HUID | Agar item me ho to chip me show |

## 7.2 IRN Disclaimer Modal

| Field | Rule |
|---|---|
| Disclaimer checkbox | Tick kiye bina Generate IRN allow nahi |
| Simulated IRN | Detail panel me SIMULATED badge mandatory |

## 7.3 Outstanding Adjustment

| Field | Rule |
|---|---|
| Notes | Minimum 5 characters |
| Date | Future date allowed nahi |
| Amount/Metal | At least ek delta dena zaroori |
| Permission | Sirf admin/manager/jwl_admin/jwl_manager |

## 7.4 Karigar Edit

| Field | Rule |
|---|---|
| Mobile | 10 digit format |
| PAN | Format: AAAAA9999A |
| Active Toggle | OFF = new assignment stop |

## 7.5 HUID Validation

| Field | Rule |
|---|---|
| HUID | 6 uppercase alphanumeric |
| Duplicate non-empty HUID | Allowed nahi (same tenant me unique) |

---

## 8) Formula aur Calculation (Simple Language)

## 8.1 Old Gold Deduction
**Formula:** `Pure grams = Gross wt x (Purity% / 100)`  
**Formula:** `Deduction value = Pure grams x Buy rate per gram`

**Example:**
- Gross wt = 20g
- Purity = 75%
- Buy rate = INR 5,000/g
- Pure grams = 20 x 0.75 = 15g
- Deduction = 15 x 5,000 = INR 75,000

## 8.2 Making Charge
System mode ke hisab se calculate karta hai:
- PER_GRAM -> `making rate x net wt`
- PCT_METAL -> `(metal value x making%) / 100`
- PER_PIECE -> `making rate x pieces`

## 8.3 Wastage Amount
`Wastage = (Metal value x wastage%) / 100`

## 8.4 GST Split
- Same state -> GST ka half CGST, half SGST
- Different state -> full IGST

## 8.5 Round Off
Total ko nearest rupee round kiya jata hai.  
Difference `round off` me show hota hai.

## 8.6 Outstanding Sign Meaning
- Positive balance -> customer se paisa lena hai
- Negative balance -> customer ka credit/advance pada hai

---

## 9) Security aur Safe Use Rules

1. Password aur OTP kisi ko share na kare.
2. Shared counter system pe kaam khatam ke baad logout kare.
3. Unknown link se portal open na kare; sirf official URL use kare.
4. IRN simulated warning ignore na kare.
5. Manual adjustment bina reason ke na kare.
6. Daily end me high-value entries owner verify kare.
7. Mobile/laptop lost ho to same day password reset + admin alert kare.

---

## 10) Daily Working Flow (Counter se Closing tak)

1. Morning: rates + outstanding check
2. Counter sale: customer select -> item search -> line verify -> payment
3. Issue invoice and share
4. Agar B2B hai to IRN warning dhyan se dekho
5. Evening: outstanding follow-up list and mismatch check
6. Logout and close

---

## 11) Limitations (abhi kya nahi hai)

1. Yeh guide sirf completed features cover karti hai.
2. Full legal GST IRP integration abhi enabled nahi (simulated IRN warning flow active hai).
3. Advanced reports/export UX aur kuch compliance automations next phase me aayenge.

---

## 12) FAQ

### Q1: Item search me item nahi mil raha
- 2+ character type karo
- Invoice type check karo (credit note me SOLD item chahiye)
- SKU/barcode/HUID sahi daala hai ya nahi check karo

### Q2: IRN generate button disable kyun hai
- Disclaimer checkbox tick nahi hua

### Q3: Outstanding adjustment save nahi ho raha
- Notes 5 char se chhota ho sakta hai
- Date future ho sakti hai
- Role permission na ho

### Q4: Karigar save pe error aa raha
- Mobile 10 digit check karo
- PAN format sahi karo

### Q5: HUID error aa raha
- 6 character uppercase alphanumeric hona chahiye
- Duplicate HUID allowed nahi

---

## Screenshot Placeholder List (Designer handoff)
1. Billing new invoice item-search dropdown open state
2. Billing line auto-filled state with HUID chip
3. Invoice detail amber IRN warning banner
4. IRN disclaimer modal with checkbox
5. Outstanding main screen ageing cards
6. Outstanding party detail drawer movements
7. Outstanding manual adjustment drawer
8. Karigar edit drawer with active toggle
9. Purity tracking summary cards
10. HUID tracking filtered list
