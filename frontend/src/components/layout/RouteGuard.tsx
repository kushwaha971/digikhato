"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ForceResetPasswordFormModal } from "@/components/auth/ForceResetPasswordFormModal";
import { ForceResetPasswordModal } from "@/components/auth/ForceResetPasswordModal";
import { useChangePasswordMutation, useGetMeQuery } from "@/features/auth/auth-api";
import { type AppRole } from "@/hooks/useRoleAccess";
import { getModuleFromPath, getModuleLandingRoute, ROUTES } from "@/lib/routes";
import { getAccessibleModules, resolveDefaultModule, setAccessToken, setCurrentUser, type AuthUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface RouteGuardProps {
  readonly children: React.ReactNode;
  readonly requiredRoles?: AppRole[];
  readonly redirectTo?: string;
}

function getResetPromptDismissKey(userId: number): string {
  return `reset_prompt_dismissed:${userId}`;
}

function getDefaultRedirect(user: AuthUser): string {
  if (user.role === "super_admin") return ROUTES.app.superAdmin.dashboard;
  const defaultModule = resolveDefaultModule(user);
  if (!defaultModule) return ROUTES.app.moduleAccess;
  return getModuleLandingRoute(defaultModule);
}

export function RouteGuard({ children, requiredRoles, redirectTo }: RouteGuardProps) {
  const pathname = usePathname();
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
    router.replace(ROUTES.public.login);
  }, [dispatch, meError, router]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!effectiveToken) {
      router.replace(ROUTES.public.login);
      return;
    }

    if (!currentUser) {
      return;
    }

    if (requiredRoles && !requiredRoles.includes(currentUser.role as AppRole)) {
      router.replace(redirectTo ?? getDefaultRedirect(currentUser));
      return;
    }

    if (currentUser.role === "super_admin") {
      if (pathname === ROUTES.app.moduleAccess) {
        router.replace(ROUTES.app.superAdmin.dashboard);
      }
      return;
    }

    const accessibleModules = getAccessibleModules(currentUser);
    if (accessibleModules.length === 0) {
      if (pathname !== ROUTES.app.moduleAccess) {
        router.replace(ROUTES.app.moduleAccess);
      }
      return;
    }

    const defaultRedirect = getDefaultRedirect(currentUser);
    if (pathname === ROUTES.app.moduleAccess) {
      router.replace(defaultRedirect);
      return;
    }

    const routeModule = getModuleFromPath(pathname);
    if (routeModule && !accessibleModules.includes(routeModule)) {
      router.replace(defaultRedirect);
    }
  }, [isHydrated, effectiveToken, currentUser, requiredRoles, router, redirectTo, pathname]);

  const shouldForcePasswordReset = useMemo(() => {
    return Boolean(currentUser?.must_reset_password);
  }, [currentUser?.must_reset_password]);

  useEffect(() => {
    if (!shouldForcePasswordReset) {
      if (typeof window !== "undefined" && currentUser?.id) {
        window.localStorage.removeItem(getResetPromptDismissKey(currentUser.id));
      }
      setIsResetFormOpen(false);
      setIsResetPromptDismissed(false);
      return;
    }

    if (typeof window === "undefined" || !currentUser?.id) {
      return;
    }

    const dismissed = window.localStorage.getItem(getResetPromptDismissKey(currentUser.id)) === "1";
    setIsResetPromptDismissed(dismissed);
  }, [shouldForcePasswordReset, currentUser?.id]);

  const handleResetPromptCancel = useCallback(() => {
    if (typeof window !== "undefined" && currentUser?.id) {
      window.localStorage.setItem(getResetPromptDismissKey(currentUser.id), "1");
    }
    setIsResetPromptDismissed(true);
    setIsResetFormOpen(false);
  }, [currentUser?.id]);

  const handleResetNow = useCallback(() => {
    setIsResetFormOpen(true);
  }, []);

  const handleResetPasswordSubmit = useCallback(async (
    values: { old_password: string; new_password: string },
  ) => {
    await changePassword(values).unwrap();
    if (typeof window !== "undefined" && currentUser?.id) {
      window.localStorage.removeItem(getResetPromptDismissKey(currentUser.id));
    }
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

  if (!currentUser) {
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
