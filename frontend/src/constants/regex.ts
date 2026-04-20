export const REGEX = {
  mobile: /^\d{10,15}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  passwordStrong: /^.{8,128}$/,
  amount: /^\d+(\.\d{1,2})?$/,
  name: /^.{2,120}$/,
  otp: /^\d{4,8}$/,
  numericOnly: /^\d+$/,
  pinCode: /^\d{4,10}$/,
  isoDate: /^\d{4}-\d{2}-\d{2}$/,
} as const;

export type RegexKey = keyof typeof REGEX;
