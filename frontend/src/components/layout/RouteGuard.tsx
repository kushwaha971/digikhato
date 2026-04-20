"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ForceResetPasswordModal } from "@/components/auth/ForceResetPasswordModal";
import { useGetMeQuery, useLogoutMutation } from "@/features/auth/auth-api";
import { type AppRole } from "@/hooks/useRoleAccess";
import { performLogout } from "@/lib/auth/logout";
import { setAccessToken, setCurrentUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface RouteGuardProps {
  readonly children: React.ReactNode;
  readonly requiredRoles?: AppRole[];
  readonly redirectTo?: string;
}

function getDefaultRedirect(role: AppRole): string {
  switch (role) {
    case "super_admin":
      return "/super-admin/dashboard";
    case "borrower":
      return "/portal";
    default:
      return "/dashboard";
  }
}

export function RouteGuard({ children, requiredRoles, redirectTo }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const dispatch = useAppDispatch();
  const { accessToken, currentUser } = useAppSelector((state) => state.auth);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [bootstrappedToken, setBootstrappedToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const effectiveToken = accessToken ?? bootstrappedToken;

  const { data: me, isError: meError } = useGetMeQuery(undefined, {
    skip: !effectiveToken || Boolean(currentUser),
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setBootstrappedToken(window.localStorage.getItem("accessToken"));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!accessToken && bootstrappedToken) {
      dispatch(setAccessToken(bootstrappedToken));
    }
  }, [accessToken, bootstrappedToken, dispatch]);

  useEffect(() => {
    if (me) {
      dispatch(setCurrentUser(me));
    }
  }, [dispatch, me]);

  useEffect(() => {
    if (!meError) {
      return;
    }

    void performLogout({ dispatch, router, broadcast: true });
  }, [dispatch, meError, router]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!effectiveToken) {
      router.replace("/login");
      return;
    }

    if (requiredRoles && currentUser && !requiredRoles.includes(currentUser.role as AppRole)) {
      router.replace(redirectTo ?? getDefaultRedirect(currentUser.role as AppRole));
    }
  }, [isHydrated, effectiveToken, currentUser, requiredRoles, router, redirectTo]);

  const shouldForcePasswordReset = useMemo(() => {
    if (!currentUser?.must_reset_password) {
      return false;
    }

    return pathname !== "/reset-password";
  }, [currentUser?.must_reset_password, pathname]);

  const handleForceResetLogout = useCallback(async () => {
    await performLogout({
      dispatch,
      router,
      callServerLogout: () => logout().unwrap(),
      broadcast: true,
    });
  }, [dispatch, logout, router]);

  const handleResetNow = useCallback(() => {
    router.replace("/reset-password");
  }, [router]);

  if (!isHydrated) {
    return null;
  }

  if (!effectiveToken) {
    return null;
  }

  if (requiredRoles && !currentUser) {
    return null;
  }

  if (requiredRoles && currentUser && !requiredRoles.includes(currentUser.role as AppRole)) {
    return null;
  }

  return (
    <>
      {children}
      <ForceResetPasswordModal
        open={shouldForcePasswordReset}
        onResetNow={handleResetNow}
        onLogout={handleForceResetLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
}
