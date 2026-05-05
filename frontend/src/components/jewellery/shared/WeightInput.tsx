import { forwardRef } from "react";

import { Input } from "@/components/ui/Input";
import type { InputHTMLAttributes } from "react";

interface WeightInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "step"> {
  label?: string;
  error?: string;
  helperText?: string;
  unit?: string;
}

export const WeightInput = forwardRef<HTMLInputElement, WeightInputProps>(
  ({ label, error, helperText, unit = "g", ...props }, ref) => (
    <Input
      ref={ref}
      type="number"
      step="0.0001"
      min="0"
      label={label}
      error={error}
      helperText={helperText}
      rightAddon={<span className="text-xs text-muted font-medium">{unit}</span>}
      {...props}
    />
  ),
);

WeightInput.displayName = "WeightInput";
