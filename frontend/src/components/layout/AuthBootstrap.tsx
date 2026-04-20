"use client";

import { PropsWithChildren, useEffect } from "react";

import { setAccessToken } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function AuthBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!token && typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        dispatch(setAccessToken(accessToken));
      }
    }
  }, [dispatch, token]);

  return <>{children}</>;
}
