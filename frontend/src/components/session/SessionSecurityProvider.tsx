"use client";

import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useLogoutMutation } from "@/features/auth/auth-api";
import { useSessionInactivity } from "@/hooks/useSessionInactivity";
import { performLogout } from "@/lib/auth/logout";
import { subscribeToSessionSync } from "@/lib/auth/session-sync";
import { SESSION_CONFIG, AUTH_PUBLIC_PATH_PREFIXES } from "@/lib/session-config";
import { setAccessToken } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { axiosClient } from "@/lib/axios";

import { SessionTimeoutWarning } from "./SessionTimeoutWarning";

const isPublicPath = (pathname: string) => AUTH_PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export function SessionSecurityProvider({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [isExtendingSession, setIsExtendingSession] = useState(false);

  const isProtectedRoute = useMemo(() => {
    if (!accessToken) {
      return false;
    }
    return !isPublicPath(pathname);
  }, [accessToken, pathname]);

  const inactivityGuardEnabled = useMemo(
    () => isProtectedRoute && SESSION_CONFIG.hasInactivityTimeout,
    [isProtectedRoute],
  );

  const logoutSession = useCallback(async (broadcast = true) => {
    await performLogout({
      dispatch,
      router,
      broadcast,
      callServerLogout: () => logout().unwrap(),
    });
  }, [dispatch, logout, router]);

  const { isWarningOpen, secondsUntilTimeout, markActivity } = useSessionInactivity({
    enabled: inactivityGuardEnabled,
    inactivityTimeoutMs: SESSION_CONFIG.inactivityTimeoutMs,
    warningLeadMs: SESSION_CONFIG.warningLeadMs,
    onTimeout: async () => {
      await logoutSession(true);
    },
  });

  const handleStaySignedIn = useCallback(async () => {
    if (!inactivityGuardEnabled) {
      return;
    }

    setIsExtendingSession(true);
    try {
      const response = await axiosClient.post("auth/token/refresh/");
      const nextAccessToken = (response.data as { access?: string } | undefined)?.access;
      if (typeof nextAccessToken === "string" && nextAccessToken.length > 0) {
        dispatch(setAccessToken(nextAccessToken));
        window.localStorage.setItem("accessToken", nextAccessToken);
      }
      markActivity();
    } catch {
      await logoutSession(true);
    } finally {
      setIsExtendingSession(false);
    }
  }, [dispatch, inactivityGuardEnabled, logoutSession, markActivity]);

  useEffect(() => {
    if (!inactivityGuardEnabled) {
      return;
    }

    markActivity();
  }, [inactivityGuardEnabled, pathname, markActivity]);

  useEffect(() => {
    if (!isProtectedRoute) {
      return;
    }

    return subscribeToSessionSync((event) => {
      if (event.type === "logout") {
        void performLogout({
          dispatch,
          router,
          broadcast: false,
        });
      }
    });
  }, [dispatch, isProtectedRoute, router]);

  return (
    <>
      {children}
      <SessionTimeoutWarning
        open={inactivityGuardEnabled && isWarningOpen}
        secondsUntilTimeout={secondsUntilTimeout}
        isLoading={isLoggingOut || isExtendingSession}
        onStaySignedIn={handleStaySignedIn}
        onLogoutNow={() => logoutSession(true)}
      />
    </>
  );
}
