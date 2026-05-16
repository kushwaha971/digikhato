import type { JwlCustomer } from "@/store/jewellery-api";

export interface CustomerFormValues {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  gstin: string;
  pan: string;
  state_code: string;
  dob: string;
  anniversary: string;
}

export const EMPTY_CUSTOMER_FORM_VALUES: CustomerFormValues = {
  name: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  gstin: "",
  pan: "",
  state_code: "",
  dob: "",
  anniversary: "",
};

export function toCustomerFormValues(customer: JwlCustomer): CustomerFormValues {
  return {
    name: customer.name ?? EMPTY_CUSTOMER_FORM_VALUES.name,
    mobile: customer.mobile ?? EMPTY_CUSTOMER_FORM_VALUES.mobile,
    email: customer.email ?? EMPTY_CUSTOMER_FORM_VALUES.email,
    address: customer.address ?? EMPTY_CUSTOMER_FORM_VALUES.address,
    city: customer.city ?? EMPTY_CUSTOMER_FORM_VALUES.city,
    gstin: customer.gstin ?? EMPTY_CUSTOMER_FORM_VALUES.gstin,
    pan: customer.pan ?? EMPTY_CUSTOMER_FORM_VALUES.pan,
    state_code: customer.state_code ?? EMPTY_CUSTOMER_FORM_VALUES.state_code,
    dob: customer.dob ?? EMPTY_CUSTOMER_FORM_VALUES.dob,
    anniversary: customer.anniversary ?? EMPTY_CUSTOMER_FORM_VALUES.anniversary,
  };
}
