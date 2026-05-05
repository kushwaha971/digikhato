"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useGetMeQuery } from "@/features/auth/auth-api";
import { type AppRole } from "@/hooks/useRoleAccess";
import { getModuleFromPath, getModuleLandingRoute, ROUTES } from "@/lib/routes";
import { getAccessibleModules, resolveDefaultModule, setAccessToken, setCurrentUser, type AuthUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface RouteGuardProps {
  readonly children: React.ReactNode;
  readonly requiredRoles?: AppRole[];
  readonly redirectTo?: string;
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
  const [bootstrappedToken, setBootstrappedToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const effectiveToken = accessToken ?? bootstrappedToken;

  const { data: me, isError: meError } = useGetMeQuery(undefined, {
    skip: !effectiveToken || Boolean(currentUser),
  });

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }

    setBootstrappedToken(globalThis.localStorage.getItem("accessToken"));
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
    if (globalThis.window !== undefined) {
      globalThis.localStorage.removeItem("accessToken");
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

  return <>{children}</>;
}
