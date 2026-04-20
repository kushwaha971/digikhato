import { broadcastSessionLogout } from "@/lib/auth/session-sync";
import { clearAuth } from "@/store/auth-slice";

type DispatchLike = (action: unknown) => unknown;

type RouterLike = {
  replace: (href: string) => void;
  push?: (href: string) => void;
};

interface PerformLogoutOptions {
  dispatch: DispatchLike;
  router?: RouterLike;
  callServerLogout?: () => Promise<unknown>;
  redirectTo?: string;
  broadcast?: boolean;
}

const ACCESS_TOKEN_KEY = "accessToken";

export const clearStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const clearClientAuthState = (dispatch: DispatchLike) => {
  clearStoredAccessToken();
  dispatch(clearAuth());
};

const redirectToLogin = (router?: RouterLike, redirectTo = "/login") => {
  if (router) {
    router.replace(redirectTo);
    return;
  }

  if (typeof window !== "undefined") {
    window.location.replace(redirectTo);
  }
};

export const performLogout = async ({
  dispatch,
  router,
  callServerLogout,
  redirectTo = "/login",
  broadcast = true,
}: PerformLogoutOptions) => {
  try {
    if (callServerLogout) {
      await callServerLogout();
    }
  } catch {
    // We always clear client auth state even if server logout fails.
  } finally {
    clearClientAuthState(dispatch);
    if (broadcast) {
      broadcastSessionLogout();
    }
    redirectToLogin(router, redirectTo);
  }
};
