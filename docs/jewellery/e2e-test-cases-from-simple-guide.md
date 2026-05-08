# JWL E2E Test Case Catalog from `JWL-SIMPLE-USER-GUIDE.pdf`

- Source of truth: `/Users/akashkushwaha/Projects/money-mgmt/docs/jewellery/JWL-SIMPLE-USER-GUIDE.pdf`
- Extraction method: Direct PDF text extraction (13 pages) and section-by-section normalization.
- Scope date in guide: 07 May 2026
- Catalog objective: Exhaustive user-centric E2E test coverage for all documented flows, validations, formulas, roles, and scenarios.

## Coverage Summary

- Total test cases: 117
- Positive tagged cases: 61
- Negative tagged cases: 29
- Edge tagged cases: 12
- Validation tagged cases: 23
- Formula/Calculation tagged cases: 10
- Permission/Role tagged cases: 12
- End-to-end tagged cases: 24
- Note: Many cases include multiple tags (for example, `Negative + Validation`), so category totals overlap.

## Test Cases

## A) Login, Module Access, Daily Setup

### TC-JWL-AUTH-001 - Valid login with registered mobile/password
- Type: Positive
- Preconditions: Active user exists with valid mobile/password.
- Steps:
1. Open login screen.
2. Enter valid mobile number.
3. Enter valid password.
4. Click `Login`.
- Expected Result:
- User logs in successfully.
- Lands on authorized landing page/dashboard.

### TC-JWL-AUTH-002 - Invalid password blocks login
- Type: Negative, Validation
- Preconditions: Active user exists.
- Steps:
1. Enter valid mobile.
2. Enter wrong password.
3. Click `Login`.
- Expected Result:
- Login is rejected with an error message.
- No authenticated session is created.

### TC-JWL-AUTH-003 - Missing mobile/password validation
- Type: Negative, Validation
- Preconditions: Login page available.
- Steps:
1. Leave mobile empty and enter password.
2. Attempt login.
3. Leave password empty and enter mobile.
4. Attempt login.
- Expected Result:
- Required field validation is shown.
- Login action is blocked until required inputs are provided.

### TC-JWL-AUTH-004 - Jewellery module navigation works after login
- Type: Positive
- Preconditions: User logged in.
- Steps:
1. Click left menu `Jewellery`.
- Expected Result:
- Jewellery dashboard opens successfully.

### TC-JWL-AUTH-005 - Unauthorized user cannot access Jewellery module
- Type: Permission, Negative
- Preconditions: User without jewellery module permission.
- Steps:
1. Login with restricted user.
2. Try opening `Jewellery` from menu or direct URL.
- Expected Result:
- Access denied/hidden menu behavior is enforced.
- No data leak occurs.

### TC-JWL-RATE-001 - View current 22K/18K gold rates
- Type: Positive
- Preconditions: Rates configured in system.
- Steps:
1. Navigate to `Settings > Rates`.
2. Observe 22K and 18K rates.
- Expected Result:
- Both rates are visible and current values are shown.

### TC-JWL-RATE-002 - Manager can update rates
- Type: Positive, Permission
- Preconditions: Logged in as manager role.
- Steps:
1. Open `Settings > Rates`.
2. Update 22K/18K value.
3. Save.
- Expected Result:
- New rates save successfully and are used in downstream billing.

### TC-JWL-RATE-003 - Non-manager cannot update rates
- Type: Negative, Permission
- Preconditions: Logged in as non-manager role.
- Steps:
1. Open `Settings > Rates`.
2. Attempt to edit/save rate.
- Expected Result:
- Update is blocked by role-based access.

## B) Customer Management

### TC-JWL-CUST-001 - Create customer with required fields only
- Type: Positive
- Preconditions: User can access `Jewellery > Customers > New`.
- Steps:
1. Enter `Name`.
2. Enter valid 10-digit `Mobile`.
3. Save customer.
- Expected Result:
- Customer is created successfully.

### TC-JWL-CUST-002 - Create customer with all optional fields
- Type: Positive
- Preconditions: Same as above.
- Steps:
1. Enter Name + Mobile.
2. Enter Address, GSTIN, PAN.
3. Save.
- Expected Result:
- Customer is created with all provided details.

### TC-JWL-CUST-003 - Name required validation
- Type: Negative, Validation
- Preconditions: New customer form open.
- Steps:
1. Keep `Name` empty.
2. Enter valid mobile.
3. Save.
- Expected Result:
- Validation shown for Name.
- Record not saved.

### TC-JWL-CUST-004 - Mobile required validation
- Type: Negative, Validation
- Preconditions: New customer form open.
- Steps:
1. Enter Name.
2. Keep Mobile empty.
3. Save.
- Expected Result:
- Validation shown for Mobile.
- Record not saved.

### TC-JWL-CUST-005 - Mobile must be exactly 10 digits
- Type: Negative, Validation
- Preconditions: New customer form open.
- Steps:
1. Try mobile with 9 digits.
2. Try mobile with 11 digits.
3. Try non-numeric mobile.
4. Save each time.
- Expected Result:
- Invalid mobile values are rejected.

### TC-JWL-CUST-006 - Search existing customer by mobile before create
- Type: Positive, E2E
- Preconditions: Existing customer present.
- Steps:
1. Go to `Jewellery > Customers`.
2. Search by mobile.
3. Verify existing customer appears.
- Expected Result:
- Existing customer is found, enabling duplicate avoidance.

### TC-JWL-CUST-007 - Search existing customer by name
- Type: Positive
- Preconditions: Existing customer present.
- Steps:
1. Search by customer name.
2. Select matching row.
- Expected Result:
- Correct customer profile is returned.

### TC-JWL-CUST-008 - Duplicate customer creation attempt
- Type: Negative, Edge
- Preconditions: Customer with same mobile already exists.
- Steps:
1. Attempt to create another customer with same mobile.
2. Save.
- Expected Result:
- System should prevent duplicate or present clear warning per business rule.

### TC-JWL-CUST-009 - Optional fields can be blank
- Type: Positive
- Preconditions: New form open.
- Steps:
1. Fill only Name + valid Mobile.
2. Leave Address/GSTIN/PAN blank.
3. Save.
- Expected Result:
- Save succeeds since optional fields are not mandatory.

### TC-JWL-CUST-010 - Customer search no-match scenario
- Type: Negative
- Preconditions: No customer with query exists.
- Steps:
1. Search for random name/mobile.
- Expected Result:
- Empty list / no results message shown.

## C) Inventory and HUID

### TC-JWL-INV-001 - Inventory list shows required columns
- Type: Positive
- Preconditions: Navigate to `Jewellery > Inventory`.
- Steps:
1. Open inventory listing.
- Expected Result:
- Columns include SKU, Design Name, Metal/Purity, Net Weight, Status.

### TC-JWL-INV-002 - Status dictionary mapping is correct
- Type: Positive
- Preconditions: Inventory has items with different statuses.
- Steps:
1. Verify status labels: `IN_STOCK`, `SOLD`, `ISSUED`, `TRANSIT`, `WRITTEN_OFF`.
- Expected Result:
- Status labels render correctly and match documented meanings.

### TC-JWL-INV-003 - HUID valid format accepted
- Type: Positive, Validation
- Preconditions: Create/edit item flow available.
- Steps:
1. Enter HUID in 6-char uppercase alphanumeric format (e.g., `AB12CD`).
2. Save.
- Expected Result:
- HUID is accepted.

### TC-JWL-INV-004 - HUID invalid length rejected
- Type: Negative, Validation
- Preconditions: HUID input field available.
- Steps:
1. Enter 5-char HUID.
2. Enter 7-char HUID.
3. Save.
- Expected Result:
- Validation error shown; save blocked.

### TC-JWL-INV-005 - HUID lowercase/special char rejection
- Type: Negative, Validation
- Preconditions: HUID field available.
- Steps:
1. Enter lowercase or symbols in HUID.
2. Save.
- Expected Result:
- Non-compliant HUID rejected.

### TC-JWL-INV-006 - Duplicate HUID blocked across items
- Type: Negative, Validation
- Preconditions: Item A already has HUID `AB12CD`.
- Steps:
1. Create/edit Item B.
2. Set HUID to `AB12CD`.
3. Save.
- Expected Result:
- Duplicate HUID is not allowed.

### TC-JWL-INV-007 - Item search in invoice returns IN_STOCK item
- Type: Positive, E2E
- Preconditions: One item in `IN_STOCK` exists.
- Steps:
1. Open new invoice.
2. Search item by SKU/barcode/HUID.
- Expected Result:
- IN_STOCK item appears and is selectable.

### TC-JWL-INV-008 - Non-IN_STOCK item not selectable for normal sale
- Type: Negative, Edge
- Preconditions: Item exists in `SOLD`/`ISSUED`.
- Steps:
1. Search same item from normal invoice line search.
- Expected Result:
- Item is hidden/blocked for regular billing (except documented credit note context).

## D) Billing Core (New Invoice)

### TC-JWL-BILL-001 - New invoice page opens
- Type: Positive
- Preconditions: Billing permission present.
- Steps:
1. Navigate to `Jewellery > Billing > New Invoice`.
- Expected Result:
- New invoice form loads with line items and payment sections.

### TC-JWL-BILL-002 - All documented bill types are available
- Type: Positive
- Preconditions: New invoice page open.
- Steps:
1. Open bill type dropdown.
- Expected Result:
- Options include `TAX_INVOICE`, `CASH_MEMO`, `ESTIMATE`, `CREDIT_NOTE`.

### TC-JWL-BILL-003 - Bill type TAX_INVOICE creation flow
- Type: Positive, E2E
- Preconditions: Customer and stock item available.
- Steps:
1. Select `TAX_INVOICE`.
2. Select customer.
3. Add one line item.
4. Add payment.
5. Save draft.
- Expected Result:
- Tax invoice draft saved successfully.

### TC-JWL-BILL-004 - Bill type CASH_MEMO creation flow
- Type: Positive
- Preconditions: As above.
- Steps:
1. Select `CASH_MEMO`.
2. Complete minimal bill details.
3. Save draft.
- Expected Result:
- Cash memo draft saved.

### TC-JWL-BILL-005 - Bill type ESTIMATE creation flow
- Type: Positive
- Preconditions: As above.
- Steps:
1. Select `ESTIMATE`.
2. Add customer and line.
3. Save.
- Expected Result:
- Estimate saved successfully.

### TC-JWL-BILL-006 - Bill type CREDIT_NOTE selectable in new billing form
- Type: Positive
- Preconditions: Billing form open.
- Steps:
1. Select `CREDIT_NOTE` in bill type list.
- Expected Result:
- Credit note option is selectable (where product allows direct creation).

### TC-JWL-BILL-007 - Item search supports SKU
- Type: Positive
- Preconditions: Item with known SKU exists.
- Steps:
1. In line item search, enter SKU.
2. Select matched item.
- Expected Result:
- Item resolves correctly.

### TC-JWL-BILL-008 - Item search supports barcode
- Type: Positive
- Preconditions: Item with known barcode exists.
- Steps:
1. Search by barcode value.
2. Select item.
- Expected Result:
- Correct item resolved.

### TC-JWL-BILL-009 - Item search supports HUID
- Type: Positive
- Preconditions: Item with HUID exists.
- Steps:
1. Search by HUID.
2. Select item.
- Expected Result:
- Correct item resolved.

### TC-JWL-BILL-010 - Two-letter search shows dropdown suggestions
- Type: Positive, Edge
- Preconditions: Items with matching prefix exist.
- Steps:
1. Type 2 letters (e.g., `RG`) in item search.
- Expected Result:
- Suggestion dropdown appears with matching items.

### TC-JWL-BILL-011 - Item selection auto-fills all documented fields
- Type: Positive
- Preconditions: Selectable item exists.
- Steps:
1. Select item from dropdown.
- Expected Result:
- Auto-filled fields: metal, purity, gross/net, stone weight, rate/gram, HUID chip.

### TC-JWL-BILL-012 - Add line supports multiple line items
- Type: Positive
- Preconditions: Billing page open.
- Steps:
1. Add first line.
2. Click `+ Add line`.
3. Add second line.
- Expected Result:
- Multiple line items are supported and shown.

### TC-JWL-BILL-013 - Save draft works with complete required inputs
- Type: Positive
- Preconditions: Valid customer, line, payment entered.
- Steps:
1. Click `Save Draft`.
- Expected Result:
- Draft saved and retrievable in draft state.

### TC-JWL-BILL-014 - Save & Issue finalizes invoice
- Type: Positive, E2E
- Preconditions: Valid complete invoice.
- Steps:
1. Click `Save & Issue`.
- Expected Result:
- Invoice moves to issued/final state.

### TC-JWL-BILL-015 - Issue disabled when required line data incomplete
- Type: Negative, Validation
- Preconditions: Start invoice with incomplete line.
- Steps:
1. Leave required line values incomplete.
2. Attempt `Save & Issue`.
- Expected Result:
- Issue action blocked with validation indication.

### TC-JWL-BILL-016 - Lock period blocks issue
- Type: Negative, Permission
- Preconditions: Billing date falls in lock period (configured).
- Steps:
1. Attempt to issue invoice.
- Expected Result:
- Issue blocked due to lock period rule.

### TC-JWL-BILL-017 - Document total recalculates after line edit
- Type: Formula
- Preconditions: Invoice with one line created.
- Steps:
1. Note total.
2. Change quantity/weight/rate inputs.
3. Observe total.
- Expected Result:
- Total updates automatically based on changed line values.

### TC-JWL-BILL-018 - Making/wastage/GST auto-calc recalculates line total
- Type: Formula
- Preconditions: Item line present with editable making/wastage/GST fields.
- Steps:
1. Capture current line total.
2. Modify making rate.
3. Modify wastage%.
4. Modify GST%.
- Expected Result:
- Line total recalculates after each change.

### TC-JWL-BILL-019 - Wrong rate scenario detection before save
- Type: Negative, E2E
- Preconditions: Known day rate in settings.
- Steps:
1. Start bill and inspect applied rate.
2. Compare against `Settings > Rates`.
- Expected Result:
- Applied rate matches configured day rate; mismatch should be visible and correctable before save.

### TC-JWL-BILL-020 - Draft remains non-final until explicitly issued
- Type: Positive, E2E
- Preconditions: Draft invoice exists.
- Steps:
1. Save draft only.
2. Check invoice status and stock impact.
- Expected Result:
- Draft remains non-issued.
- Stock is not treated as final sold until issue action.

## E) Old Gold Exchange

### TC-JWL-OLD-001 - Old Gold section available in bill form
- Type: Positive
- Preconditions: New bill form open.
- Steps:
1. Locate `Old Gold` section.
- Expected Result:
- Section visible and usable.

### TC-JWL-OLD-002 - Old Gold required fields capture
- Type: Positive
- Preconditions: Old Gold section open.
- Steps:
1. Enter metal code.
2. Enter gross weight.
3. Enter tested purity.
4. Enter buy rate per gram.
- Expected Result:
- Values accepted and used in calculation.

### TC-JWL-OLD-003 - Old Gold formula: pure grams auto-calculated
- Type: Formula
- Preconditions: Old Gold inputs entered.
- Steps:
1. Input gross weight + tested purity.
2. Observe pure grams output.
- Expected Result:
- Pure grams computed automatically from entered values.

### TC-JWL-OLD-004 - Old Gold formula: deduction amount auto-calculated
- Type: Formula
- Preconditions: Old Gold input present.
- Steps:
1. Enter buy rate and purity-related fields.
2. Observe deduction amount.
- Expected Result:
- Deduction amount auto-calculated.

### TC-JWL-OLD-005 - Old Gold reduces final payable correctly (example check)
- Type: Formula
- Preconditions: Bill subtotal `₹80,000`; old-gold deduction computes to `₹20,000`.
- Steps:
1. Apply old-gold values producing `₹20,000` deduction.
2. Check net payable.
- Expected Result:
- Final payable becomes `₹60,000`.

### TC-JWL-OLD-006 - Old Gold invalid numeric inputs rejected
- Type: Negative, Validation
- Preconditions: Old Gold fields editable.
- Steps:
1. Enter negative/zero/blank for weight, purity, buy rate.
2. Attempt save.
- Expected Result:
- Validation prevents invalid old-gold calculation.

## F) Payment (Single and Split)

### TC-JWL-PAY-001 - Single cash payment entry
- Type: Positive
- Preconditions: Invoice payment section available.
- Steps:
1. Select mode `CASH`.
2. Enter valid amount > 0.
3. Save.
- Expected Result:
- Payment line saved successfully.

### TC-JWL-PAY-002 - Single UPI payment entry
- Type: Positive
- Preconditions: Payment section available.
- Steps:
1. Select mode `UPI`.
2. Enter valid amount.
3. Save.
- Expected Result:
- UPI payment saved.

### TC-JWL-PAY-003 - Single CARD payment entry
- Type: Positive
- Preconditions: Payment section available.
- Steps:
1. Select mode `CARD`.
2. Enter valid amount.
3. Save.
- Expected Result:
- CARD payment saved.

### TC-JWL-PAY-004 - Single BANK payment entry
- Type: Positive
- Preconditions: Payment section available.
- Steps:
1. Select mode `BANK`.
2. Enter valid amount.
3. Save.
- Expected Result:
- BANK payment saved.

### TC-JWL-PAY-005 - Split payment across two modes
- Type: Positive, Formula
- Preconditions: Invoice amount known.
- Steps:
1. Add payment line `Cash: 40,000`.
2. Add payment line `UPI: 18,500`.
3. Observe paid and balance values.
- Expected Result:
- Paid amount equals sum of lines.
- Balance updates automatically.

### TC-JWL-PAY-006 - Split payment across 3+ modes
- Type: Positive, Edge
- Preconditions: Payment section supports multiple rows.
- Steps:
1. Add cash + card + bank entries.
2. Verify running total.
- Expected Result:
- Multi-line split accepted; totals remain accurate.

### TC-JWL-PAY-007 - Payment amount must be > 0
- Type: Negative, Validation
- Preconditions: Payment section available.
- Steps:
1. Enter amount `0` and save.
2. Enter negative amount and save.
- Expected Result:
- Validation blocks save for non-positive amounts.

### TC-JWL-PAY-008 - Payment amount exceeding invoice total
- Type: Edge
- Preconditions: Invoice total fixed.
- Steps:
1. Enter payment greater than total.
- Expected Result:
- System behavior is deterministic (block or show overpayment state) and no silent miscalculation occurs.

### TC-JWL-PAY-009 - UPI/Card reference capture behavior
- Type: Edge, Validation
- Preconditions: UPI/card mode selected.
- Steps:
1. Save UPI/Card payment without reference.
2. Save with reference.
- Expected Result:
- Reference handling follows configured behavior (recommended but possibly not mandatory per guide).

### TC-JWL-PAY-010 - Paid and balance update on payment line edit/delete
- Type: Formula
- Preconditions: Multiple payment lines exist.
- Steps:
1. Edit one payment amount.
2. Delete one payment line.
- Expected Result:
- Paid and balance values recalculate correctly.

## G) Invoice Issue, Print, Download, Share, IRN Warning

### TC-JWL-ISSUE-001 - Draft to issue transition from detail page
- Type: Positive, E2E
- Preconditions: Draft invoice exists.
- Steps:
1. Open invoice detail.
2. Click `Issue invoice`.
- Expected Result:
- Draft becomes issued/final.

### TC-JWL-ISSUE-002 - Print action available on invoice detail
- Type: Positive
- Preconditions: Invoice detail open.
- Steps:
1. Click `Print`.
- Expected Result:
- Print flow opens with invoice content.

### TC-JWL-ISSUE-003 - Download PDF action available
- Type: Positive
- Preconditions: Invoice detail open.
- Steps:
1. Click `Download PDF`.
- Expected Result:
- Invoice PDF downloads successfully.

### TC-JWL-ISSUE-004 - Share action supports WA/SMS/Email options
- Type: Positive
- Preconditions: Invoice detail open.
- Steps:
1. Click `Share`.
2. Observe available channels.
- Expected Result:
- Share channels include WhatsApp/SMS/Email as documented.

### TC-JWL-ISSUE-005 - Simulated IRN displays amber warning
- Type: Positive, Validation
- Preconditions: Invoice in simulated IRN context.
- Steps:
1. Open invoice with simulated IRN.
- Expected Result:
- Amber warning is visible indicating simulated/internal IRN.

### TC-JWL-ISSUE-006 - Simulated IRN does not imply legal filing
- Type: Validation
- Preconditions: Same as above.
- Steps:
1. Review IRN warning text/context.
- Expected Result:
- UI clearly indicates not auto-filed on government GST portal.

### TC-JWL-ISSUE-007 - Issue blocked when user lacks issue permission
- Type: Negative, Permission
- Preconditions: Role without issue permission.
- Steps:
1. Open draft invoice.
2. Attempt issue action.
- Expected Result:
- Issue is blocked/disabled.

### TC-JWL-ISSUE-008 - Issue blocked for incomplete required payment/line data
- Type: Negative, Validation
- Preconditions: Draft with incomplete required data.
- Steps:
1. Try to issue.
- Expected Result:
- System prevents issue and shows validation prompts.

## H) Credit Note (Return Bill)

### TC-JWL-CN-001 - Credit note creation from issued invoice
- Type: Positive, E2E
- Preconditions: At least one issued invoice exists.
- Steps:
1. Open issued invoice detail.
2. Click `Create credit note`.
- Expected Result:
- Credit note flow starts with original invoice context.

### TC-JWL-CN-002 - Select return line items and issue credit note
- Type: Positive
- Preconditions: Credit note flow open.
- Steps:
1. Select returnable line items.
2. Issue credit note.
- Expected Result:
- Credit note issued successfully.

### TC-JWL-CN-003 - Credit note blocked for non-issued source invoice
- Type: Negative
- Preconditions: Only draft invoice available.
- Steps:
1. Attempt credit note from draft invoice.
- Expected Result:
- System blocks credit note creation from non-issued invoices.

### TC-JWL-CN-004 - Return stock transitions back per rule-based logic
- Type: Positive, Edge
- Preconditions: Credit note issued for sold item.
- Steps:
1. Complete return credit note.
2. Check inventory status of returned item.
- Expected Result:
- Item may move back to `IN_STOCK` according to configured rule.

### TC-JWL-CN-005 - Item search in credit note context supports sold-item return lookup
- Type: Positive, Edge
- Preconditions: Sold item exists in issued invoice.
- Steps:
1. Open credit note flow.
2. Search return item.
- Expected Result:
- Relevant sold items are discoverable for return flow.

### TC-JWL-CN-006 - Invalid return quantity/line selection blocked
- Type: Negative, Validation
- Preconditions: Credit note flow open.
- Steps:
1. Attempt invalid return line selection (none/excess).
2. Try issue.
- Expected Result:
- Validation prevents invalid credit note issuance.

## I) Outstanding and Adjustments

### TC-JWL-OUT-001 - Outstanding screen loads with core views
- Type: Positive
- Preconditions: `Jewellery > Outstanding` access granted.
- Steps:
1. Open outstanding screen.
- Expected Result:
- Party-wise balance, ageing buckets, and movement history are visible.

### TC-JWL-OUT-002 - Ageing buckets rendered: 0-30 / 31-60 / 61-90 / 90+
- Type: Positive
- Preconditions: Outstanding data present.
- Steps:
1. Verify ageing bucket headers and values.
- Expected Result:
- All 4 bucket categories render correctly.

### TC-JWL-OUT-003 - Negative outstanding displayed correctly
- Type: Edge
- Preconditions: Party with negative balance exists.
- Steps:
1. Open outstanding list.
2. Locate negative balance party.
- Expected Result:
- Negative value shown; interpreted as amount payable by shop to customer.

### TC-JWL-OUT-004 - Manual adjustment allowed for authorized role
- Type: Positive, Permission
- Preconditions: Authorized user logged in.
- Steps:
1. Start manual adjustment.
2. Enter valid note (>=5 chars).
3. Save.
- Expected Result:
- Adjustment saved successfully.

### TC-JWL-OUT-005 - Manual adjustment blocked for unauthorized role
- Type: Negative, Permission
- Preconditions: Unauthorized role logged in.
- Steps:
1. Attempt manual adjustment.
- Expected Result:
- Action blocked.

### TC-JWL-OUT-006 - Manual adjustment note min length validation
- Type: Negative, Validation
- Preconditions: Authorized role logged in.
- Steps:
1. Try adjustment with note length <5.
2. Save.
- Expected Result:
- Save blocked with note-length validation error.

### TC-JWL-OUT-007 - Movement history reflects manual adjustment entries
- Type: Positive, E2E
- Preconditions: One valid adjustment posted.
- Steps:
1. Open movement history.
- Expected Result:
- Adjustment transaction appears with notes/audit details.

## J) Karigar Management and Workflow

### TC-JWL-KAR-001 - Add karigar with mandatory fields
- Type: Positive
- Preconditions: Access to `Jewellery > Karigar`.
- Steps:
1. Add Name.
2. Add 10-digit Mobile.
3. Save.
- Expected Result:
- Karigar created.

### TC-JWL-KAR-002 - Add/edit karigar with optional PAN and defaults
- Type: Positive
- Preconditions: Karigar form open.
- Steps:
1. Enter PAN.
2. Set wastage/labour defaults.
3. Save.
- Expected Result:
- Data saved successfully.

### TC-JWL-KAR-003 - Karigar mobile validation (10 digits)
- Type: Negative, Validation
- Preconditions: Karigar form open.
- Steps:
1. Enter invalid mobile length/format.
2. Save.
- Expected Result:
- Validation blocks save.

### TC-JWL-KAR-004 - PAN format validation
- Type: Negative, Validation
- Preconditions: PAN field available.
- Steps:
1. Enter invalid PAN format.
2. Save.
- Expected Result:
- Validation error shown for PAN format.

### TC-JWL-KAR-005 - Toggle karigar to inactive
- Type: Positive
- Preconditions: Active karigar exists.
- Steps:
1. Edit karigar.
2. Set `Inactive`.
3. Save.
- Expected Result:
- Karigar marked inactive.

### TC-JWL-KAR-006 - Inactive karigar cannot receive new assignment
- Type: Negative, Permission
- Preconditions: Inactive karigar exists.
- Steps:
1. Start issue voucher assignment.
2. Try selecting inactive karigar.
- Expected Result:
- New assignment blocked/not listed.

### TC-JWL-KAR-007 - Inactive karigar history remains visible
- Type: Positive, Edge
- Preconditions: Inactive karigar with prior transactions exists.
- Steps:
1. Open karigar history/ledger.
- Expected Result:
- Historical records remain accessible.

### TC-JWL-KAR-008 - Karigar issue voucher creation
- Type: Positive, E2E
- Preconditions: Active karigar and issuable stock exist.
- Steps:
1. Create issue voucher.
2. Assign to karigar.
3. Save.
- Expected Result:
- Issue voucher created successfully.

### TC-JWL-KAR-009 - Karigar receipt entry flow
- Type: Positive, E2E
- Preconditions: Existing issue voucher.
- Steps:
1. Create receipt entry against issued work.
2. Save.
- Expected Result:
- Receipt transaction recorded.

### TC-JWL-KAR-010 - Wastage/purity reconciliation view
- Type: Positive, Formula
- Preconditions: Issue and receipt data exist.
- Steps:
1. Open reconciliation for karigar transaction.
- Expected Result:
- Wastage/purity differences are computed and visible.

## K) Gold Pledge Loan (Basic)

### TC-JWL-PLG-001 - Create gold pledge with required fields
- Type: Positive
- Preconditions: Access to `Jewellery > Gold Pledge`.
- Steps:
1. Select customer.
2. Select scheme.
3. Enter principal.
4. Enter tenure.
5. Add pledge items.
6. Save/disburse.
- Expected Result:
- Gold pledge loan record created.

### TC-JWL-PLG-002 - Required field validation on gold pledge form
- Type: Negative, Validation
- Preconditions: Gold pledge form open.
- Steps:
1. Leave one required field blank (customer/scheme/principal/tenure/pledge items).
2. Save.
- Expected Result:
- Required field validation shown.

### TC-JWL-PLG-003 - Principal numeric validation
- Type: Negative, Validation
- Preconditions: Gold pledge form open.
- Steps:
1. Enter principal as zero/negative/non-numeric.
2. Save.
- Expected Result:
- Invalid principal values rejected.

### TC-JWL-PLG-004 - Tenure boundary behavior
- Type: Edge
- Preconditions: Gold pledge form open.
- Steps:
1. Try very small and very large tenure values.
2. Save.
- Expected Result:
- System enforces configured tenure constraints or provides controlled handling.

### TC-JWL-PLG-005 - Loan disbursement tracked against selected scheme
- Type: Positive
- Preconditions: Scheme with known terms exists.
- Steps:
1. Create pledge with that scheme.
2. Verify disbursement record.
- Expected Result:
- Scheme-linked disbursement recorded correctly.

### TC-JWL-PLG-006 - Repayment tracks principal + interest
- Type: Formula, E2E
- Preconditions: Active pledge loan exists.
- Steps:
1. Post repayment transaction(s).
2. Open loan balance view.
- Expected Result:
- System tracks principal and interest components per repayment.

## L) Role/Permission and Security Behavior

### TC-JWL-ROLE-001 - Sales Staff permissions follow guide limits
- Type: Permission
- Preconditions: Login as Sales Staff.
- Steps:
1. Create/select customer.
2. Add items and save draft.
3. Attempt manual outstanding adjustment.
- Expected Result:
- Sales functions allowed.
- Manual adjustment denied.

### TC-JWL-ROLE-002 - Cashier permissions and restriction
- Type: Permission
- Preconditions: Login as Cashier.
- Steps:
1. Enter payment.
2. Attempt invoice issue (if enabled for role).
3. Attempt karigar master edit.
- Expected Result:
- Payment entry allowed.
- Invoice issue works only if explicitly allowed.
- Karigar master edit denied.

### TC-JWL-ROLE-003 - Manager permissions and restrictions
- Type: Permission
- Preconditions: Login as Manager.
- Steps:
1. Verify rate check/update access.
2. Perform correction approval/adjustment.
3. Verify password-sharing related warning content presence in SOP/help context.
- Expected Result:
- Manager actions work as documented.
- Security guidance is visible in training/security section.

### TC-JWL-ROLE-004 - Owner/Admin controls user access and disables inactive staff
- Type: Permission, E2E
- Preconditions: Admin panel access.
- Steps:
1. Deactivate a staff user.
2. Attempt login with deactivated user.
- Expected Result:
- Access disabled for inactive staff immediately.

### TC-JWL-SEC-001 - Audit trail captured for invoice/payment/adjustment actions
- Type: Positive, E2E
- Preconditions: User actions are performed.
- Steps:
1. Create/issue invoice.
2. Add payment.
3. Post adjustment.
4. Review audit/log history.
- Expected Result:
- System records who did what and when.

### TC-JWL-SEC-002 - Logout invalidates active session
- Type: Positive
- Preconditions: Logged in user.
- Steps:
1. Click `Logout`.
2. Attempt navigating to restricted route.
- Expected Result:
- Session invalidated; re-authentication required.

### TC-JWL-SEC-003 - Force logout all sessions after account compromise
- Type: Positive, Edge
- Preconditions: User/admin has global session logout capability.
- Steps:
1. Trigger logout all devices for a user.
2. Attempt access from previously logged-in session.
- Expected Result:
- Old sessions are invalidated.

### TC-JWL-SEC-004 - Official portal URL access only warning/policy visibility
- Type: Validation
- Preconditions: Login/help/security content available.
- Steps:
1. Open security section.
- Expected Result:
- Official URL usage guidance is clearly visible.

## M) Full End-to-End Business Journeys

### TC-JWL-E2E-001 - Morning setup to first successful issued sale
- Type: E2E
- Preconditions: Valid user, rates set, customer/item exist.
- Steps:
1. Login.
2. Check rates.
3. Select customer.
4. Add inventory line.
5. Add payment.
6. Save & issue.
- Expected Result:
- Completed issued invoice with correct totals and payment capture.

### TC-JWL-E2E-002 - New customer + billing + split payment + issue + print/download/share
- Type: E2E
- Preconditions: New customer mobile not present.
- Steps:
1. Create customer.
2. Create invoice line.
3. Add split payment.
4. Issue invoice.
5. Print, download PDF, share.
- Expected Result:
- Full sales cycle completes without data mismatch.

### TC-JWL-E2E-003 - Draft lifecycle and delayed issue
- Type: E2E
- Preconditions: Draft flow available.
- Steps:
1. Save draft invoice.
2. Re-open draft.
3. Complete missing data.
4. Issue invoice.
- Expected Result:
- Draft remains editable before issue; finalization works later.

### TC-JWL-E2E-004 - Old gold exchange reduces payable and supports split settlement
- Type: E2E, Formula
- Preconditions: Bill with old-gold eligible flow.
- Steps:
1. Add sale lines.
2. Add old-gold deduction inputs.
3. Verify payable reduction.
4. Collect remaining via split payment.
5. Issue invoice.
- Expected Result:
- Old-gold adjustment and payment balance both correct.

### TC-JWL-E2E-005 - Post-sale credit note return and stock behavior
- Type: E2E
- Preconditions: Issued sale exists.
- Steps:
1. Create credit note from issued invoice.
2. Select return line.
3. Issue credit note.
4. Check inventory status.
- Expected Result:
- Return documented; stock update follows configured return rule.

### TC-JWL-E2E-006 - Outstanding follow-up with authorized manual adjustment
- Type: E2E
- Preconditions: Outstanding amount exists; manager/authorized user available.
- Steps:
1. Open outstanding.
2. Verify ageing bucket.
3. Post manual adjustment with valid note.
4. Check movement history.
- Expected Result:
- Adjustment posted and auditable.

### TC-JWL-E2E-007 - Karigar lifecycle: issue to receipt to reconciliation
- Type: E2E
- Preconditions: Active karigar and stock/workflow setup.
- Steps:
1. Create issue voucher.
2. Record receipt.
3. Review wastage/purity reconciliation.
- Expected Result:
- Full karigar process captured end-to-end.

### TC-JWL-E2E-008 - Gold pledge lifecycle: create, disburse, repay, track
- Type: E2E
- Preconditions: Customer and scheme available.
- Steps:
1. Create pledge with required fields.
2. Disburse loan.
3. Post repayment.
4. Review principal + interest tracking.
- Expected Result:
- End-to-end pledge lifecycle recorded correctly.

### TC-JWL-E2E-009 - Security incident response flow (lost device)
- Type: E2E, Security
- Preconditions: User account active.
- Steps:
1. Reset password same day.
2. Logout all sessions.
3. Review last 24-hour entries.
4. Mark suspicious entries for lock/review.
- Expected Result:
- Account secured and suspicious activity traceable.

### TC-JWL-E2E-010 - Daily closing control checklist validation
- Type: E2E, Operational
- Preconditions: Day has invoice/payment activity.
- Steps:
1. Verify issued invoice count.
2. Match payment totals (cash/UPI/etc).
3. Inspect abnormal high-value drafts.
4. Check large manual adjustments.
5. Logout and close.
- Expected Result:
- Closing checks complete and exceptions are detectable.

## Future Scope / Not Implemented Flags (from guide section 16)

Mark as `Pending / Future Scope` unless already implemented in product:
1. Simple reports + export UX improvements.
2. Full legal e-invoice integration (GSP).
3. Advanced multi-branch controls.
4. Better notification automation.
5. Offline/sync enhancement for weak network.

## Ambiguous / Clarification Needed Items

1. UPI/Card reference is documented as "best practice"; mandatory vs optional is unclear.
2. Credit-note return stock behavior says "rule-based"; exact rule matrix is not specified.
3. Cashier invoice issue says "agar allowed"; permission policy and configuration source is unspecified.
4. Lock period behavior is mentioned in FAQ; setup, boundaries, and override rules are unspecified.
5. PAN format check is mentioned but regex/format spec is unspecified.
6. Exact formulas for making/wastage/GST computation are not numerically defined in guide.
7. Old-gold pure grams/deduction formula is conceptually defined but exact rounding rules are unspecified.
8. Overpayment handling behavior in split/single payment is not specified.
9. Duplicate customer handling is instructed operationally; strict system validation behavior is unspecified.
10. Security checklist and fraud signs include SOP actions that may be outside strict UI automation scope.

## Traceability Notes

- All cases above are mapped from sections 1-16, FAQ, security notes, and common-mistake examples in the source PDF.
- Where system behavior is not explicitly defined in the guide, cases are marked as edge/ambiguous and should be finalized with product owner or BA before strict pass/fail gating.
