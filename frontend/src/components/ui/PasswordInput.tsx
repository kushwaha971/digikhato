"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { Input } from "./Input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
};

function EyeIcon({ visible }: Readonly<{ visible: boolean }>) {
  if (visible) {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.7a2 2 0 102.8 2.8" />
        <path d="M9.4 5.2A10.7 10.7 0 0112 5c5.5 0 9.5 4.2 10.8 7-.6 1.3-1.6 2.7-2.9 3.9" />
        <path d="M6.2 6.2C4.1 7.6 2.7 9.8 2 12c1.3 2.8 5.3 7 10 7 1.3 0 2.6-.2 3.8-.6" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const INPUT_TYPE_SECRET = "password" as const;

export const PasswordInput = forwardRef<HTMLInputElement, Readonly<Props>>(
  ({ className, label, error, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <Input
        {...props}
        ref={ref}
        label={label}
        error={error}
        type={isVisible ? "text" : INPUT_TYPE_SECRET}
        className={className}
        rightAddon={
          <button
            aria-label={isVisible ? "Hide password" : "Show password"}
            className="text-muted hover:text-text transition-colors p-0.5 focus-visible:outline-none"
            onClick={() => setIsVisible((v) => !v)}
            type="button"
            tabIndex={-1}
          >
            <EyeIcon visible={isVisible} />
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
