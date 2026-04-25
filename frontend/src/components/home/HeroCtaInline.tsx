"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function HeroCtaInline() {
  const [mobile, setMobile] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = mobile.trim();
    if (!/^\d{10}$/.test(value)) {
      setError("Enter a valid 10-digit mobile number.");
      setSubmitted(false);
      return;
    }

    setError("");
    setSubmitted(true);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Enter your phone number"
          prefix="+91"
          value={mobile}
          onChange={(e) => {
            setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
            if (error) setError("");
          }}
          inputMode="numeric"
          autoComplete="tel"
          aria-label="Phone number"
        />
        <Button size="lg" fullWidth={false} type="submit">
          Start Free
        </Button>
      </div>
      {error ? <p className="text-xs text-danger-600">{error}</p> : null}
      {submitted ? <p className="text-xs text-success-600">Thanks. We will use this number to activate your free account.</p> : null}
    </form>
  );
}
