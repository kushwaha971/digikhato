"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useGetMeQuery } from "@/features/auth/auth-api";
import { clearAuth, setCurrentUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, currentUser } = useAppSelector((state) => state.auth);
  const { data, isError } = useGetMeQuery(undefined, { skip: !accessToken });

  useEffect(() => {
    if (data) {
      dispatch(setCurrentUser(data));
      if (typeof window !== "undefined" && data.theme_preference) {
        localStorage.setItem("themePreference", data.theme_preference);
      }
      // Redirect borrowers to /portal unless they are already there or in /settings
      if (
        data.role === "borrower" &&
        !pathname.startsWith("/portal") &&
        !pathname.startsWith("/settings")
      ) {
        router.replace("/portal");
      }
    }
    if (isError) dispatch(clearAuth());
  }, [data, isError, dispatch, pathname, router]);

  return { accessToken, currentUser, isAuthenticated: Boolean(accessToken) };
}
