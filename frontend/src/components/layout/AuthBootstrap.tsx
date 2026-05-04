"use client";

import { PropsWithChildren, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useGetMeQuery } from "@/features/auth/auth-api";
import { getModuleLandingRoute, ROUTES } from "@/lib/routes";
import { clearAuth, resolveDefaultModule, setAccessToken, setCurrentUser, type AuthUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const PUBLIC_ROUTES = new Set<string>([ROUTES.public.home, ROUTES.public.login, ROUTES.public.signup]);

function resolveAuthenticatedRedirect(user: AuthUser): string {
  if (user.role === "super_admin") return ROUTES.app.superAdmin.dashboard;

  const defaultModule = resolveDefaultModule(user);
  if (!defaultModule) return ROUTES.app.moduleAccess;
  return getModuleLandingRoute(defaultModule);
}

export function AuthBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, currentUser } = useAppSelector((state) => state.auth);
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  const { data: me, isError: meError } = useGetMeQuery(undefined, {
    skip: !accessToken || !isPublicRoute || Boolean(currentUser),
  });

  useEffect(() => {
    if (!accessToken && typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        dispatch(setAccessToken(accessToken));
      }
    }
  }, [accessToken, dispatch]);

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

  return <>{children}</>;
}
