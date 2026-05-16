import { EMPTY_CUSTOMER_FORM_VALUES, toCustomerFormValues } from "../customer-form-defaults";

describe("customer-form-defaults", () => {
  it("maps nullable customer fields to stable empty defaults", () => {
    const mapped = toCustomerFormValues({
      id: "cust-1",
      name: "Alice",
      mobile: null,
      email: undefined,
      address: null,
      city: undefined,
      gstin: null,
      pan: undefined,
      state_code: null,
      dob: null,
      anniversary: undefined,
      loyalty_points: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    } as any);

    expect(mapped).toEqual({
      ...EMPTY_CUSTOMER_FORM_VALUES,
      name: "Alice",
    });
    expect(mapped.mobile).toBe(EMPTY_CUSTOMER_FORM_VALUES.mobile);
    expect(mapped.email).toBe(EMPTY_CUSTOMER_FORM_VALUES.email);
    expect(mapped.address).toBe(EMPTY_CUSTOMER_FORM_VALUES.address);
  });
});
