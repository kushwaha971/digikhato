"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-border">
      <div className="w-full px-6 sm:px-10 md:px-14 lg:px-20 h-14 sm:h-16 flex items-center justify-between overflow-hidden">
        <BrandLogo size="md" href={ROUTES.public.home} />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={ROUTES.public.login}>
            <Button variant="ghost" size="sm" fullWidth={false}>Log In</Button>
          </Link>
          <Link href={ROUTES.public.signup}>
            <Button size="sm" fullWidth={false}>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
