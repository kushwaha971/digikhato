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

  const sessionEnabled = useMemo(() => {
    if (!accessToken) {
      return false;
    }
    return !isPublicPath(pathname);
  }, [accessToken, pathname]);

  const logoutSession = useCallback(async (broadcast = true) => {
    await performLogout({
      dispatch,
      router,
      broadcast,
      callServerLogout: () => logout().unwrap(),
    });
  }, [dispatch, logout, router]);

  const { isWarningOpen, secondsUntilTimeout, markActivity } = useSessionInactivity({
    enabled: sessionEnabled,
    inactivityTimeoutMs: SESSION_CONFIG.inactivityTimeoutMs,
    warningLeadMs: SESSION_CONFIG.warningLeadMs,
    onTimeout: async () => {
      await logoutSession(true);
    },
  });

  const handleStaySignedIn = useCallback(async () => {
    if (!sessionEnabled) {
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
  }, [dispatch, logoutSession, markActivity, sessionEnabled]);

  useEffect(() => {
    if (!sessionEnabled) {
      return;
    }

    markActivity();
  }, [sessionEnabled, pathname, markActivity]);

  useEffect(() => {
    if (!sessionEnabled) {
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
  }, [dispatch, router, sessionEnabled]);

  return (
    <>
      {children}
      <SessionTimeoutWarning
        open={sessionEnabled && isWarningOpen}
        secondsUntilTimeout={secondsUntilTimeout}
        isLoading={isLoggingOut || isExtendingSession}
        onStaySignedIn={handleStaySignedIn}
        onLogoutNow={() => logoutSession(true)}
      />
    </>
  );
}
