"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useGetMeQuery } from "@/features/auth/auth-api";
import { getModuleLandingRoute, ROUTES } from "@/lib/routes";
import { clearAuth, resolveDefaultModule, setAccessToken, setCurrentUser, type AuthUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { BrandLogo } from "@/components/branding/BrandLogo";

const PUBLIC_ROUTES = new Set<string>([ROUTES.public.home, ROUTES.public.login, ROUTES.public.signup]);

function resolveAuthenticatedRedirect(user: AuthUser): string {
  if (user.role === "super_admin") return ROUTES.app.superAdmin.dashboard;
  if (user.role === "borrower") return ROUTES.app.portal;

  const defaultModule = resolveDefaultModule(user);
  if (!defaultModule) return ROUTES.app.moduleAccess;
  return getModuleLandingRoute(defaultModule);
}

/** Shown on public routes while we're checking localStorage for a saved session. */
function AuthSplash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <BrandLogo size="md" />
    </div>
  );
}

export function AuthBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, currentUser } = useAppSelector((state) => state.auth);
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  // Track whether we've completed the initial localStorage auth check.
  // Until this is true, we block rendering public pages to prevent the login
  // screen flashing when the user already has a valid session (PWA re-open).
  const [hydrated, setHydrated] = useState(false);

  const { data: me, isError: meError } = useGetMeQuery(undefined, {
    skip: !accessToken || !isPublicRoute || Boolean(currentUser),
  });

  // Run once on mount: read token from localStorage and mark as hydrated.
  // Kept separate from the storage-event listener so hydrated is set exactly once.
  useEffect(() => {
    if (typeof window === "undefined") {
      setHydrated(true);
      return;
    }
    const saved = localStorage.getItem("accessToken");
    if (saved && !accessToken) {
      dispatch(setAccessToken(saved));
    }
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only

  // Cross-tab login / logout sync
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== "accessToken") {
        return;
      }

      if (event.newValue) {
        dispatch(setAccessToken(event.newValue));
        dispatch(setCurrentUser(null));
        return;
      }

      dispatch(clearAuth());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);

  useEffect(() => {
    if (me) {
      dispatch(setCurrentUser(me));
    }
  }, [dispatch, me]);

  useEffect(() => {
    if (!meError || typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem("accessToken");
    dispatch(clearAuth());
  }, [dispatch, meError]);

  useEffect(() => {
    if (!isPublicRoute || !accessToken) {
      return;
    }

    const effectiveUser = currentUser ?? me;
    if (!effectiveUser) {
      return;
    }

    router.replace(resolveAuthenticatedRedirect(effectiveUser));
  }, [accessToken, currentUser, isPublicRoute, me, router]);

  // While the localStorage check is pending on a public route, show the brand
  // splash instead of the login/home page — this prevents the one-frame flash
  // when the PWA reopens for an already-authenticated user.
  if (!hydrated && isPublicRoute) {
    return <AuthSplash />;
  }

  return <>{children}</>;
}
