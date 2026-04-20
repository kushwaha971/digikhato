"use client";

import { useEffect } from "react";

import { hideSnackbar } from "@/store/snackbar-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const variantClass = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-gray-800",
};

export function Snackbar() {
  const dispatch = useAppDispatch();
  const { open, message, variant } = useAppSelector((state) => state.snackbar);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      dispatch(hideSnackbar());
    }, 2500);
    return () => clearTimeout(timer);
  }, [open, dispatch]);

  if (!open || !message) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-50 w-[92%] max-w-sm -translate-x-1/2 sm:top-6">
      <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${variantClass[variant]}`}>
        {message}
      </div>
    </div>
  );
}
