"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ForceResetPasswordFormModal } from "@/components/auth/ForceResetPasswordFormModal";
import { ForceResetPasswordModal } from "@/components/auth/ForceResetPasswordModal";
import { useChangePasswordMutation, useGetMeQuery } from "@/features/auth/auth-api";
import { type AppRole } from "@/hooks/useRoleAccess";
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
  const dispatch = useAppDispatch();
  const { accessToken, currentUser } = useAppSelector((state) => state.auth);
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [bootstrappedToken, setBootstrappedToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isResetFormOpen, setIsResetFormOpen] = useState(false);
  const [isResetPromptDismissed, setIsResetPromptDismissed] = useState(false);
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

    dispatch(setAccessToken(null));
    dispatch(setCurrentUser(null));
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
    }
    router.replace("/login");
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
    return Boolean(currentUser?.must_reset_password);
  }, [currentUser?.must_reset_password]);

  useEffect(() => {
    if (!shouldForcePasswordReset) {
      setIsResetFormOpen(false);
      setIsResetPromptDismissed(false);
    }
  }, [shouldForcePasswordReset]);

  const handleResetPromptCancel = useCallback(() => {
    setIsResetPromptDismissed(true);
    setIsResetFormOpen(false);
  }, []);

  const handleResetNow = useCallback(() => {
    setIsResetFormOpen(true);
  }, []);

  const handleResetPasswordSubmit = useCallback(async (
    values: { old_password: string; new_password: string },
  ) => {
    await changePassword(values).unwrap();
    if (currentUser) {
      dispatch(setCurrentUser({ ...currentUser, must_reset_password: false }));
    }
    setIsResetFormOpen(false);
  }, [changePassword, currentUser, dispatch]);

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
        open={shouldForcePasswordReset && !isResetFormOpen && !isResetPromptDismissed}
        onResetNow={handleResetNow}
        onCancel={handleResetPromptCancel}
      />
      <ForceResetPasswordFormModal
        open={shouldForcePasswordReset && isResetFormOpen}
        onBack={() => setIsResetFormOpen(false)}
        onSubmit={handleResetPasswordSubmit}
        isSubmitting={isChangingPassword}
      />
    </>
  );
}
