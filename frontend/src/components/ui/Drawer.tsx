"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Double rAF: first frame renders with initial (hidden) state,
      // second frame applies visible state to trigger CSS transition
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      // Keep mounted until exit transition finishes (300ms)
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  const closeButton = (
    <button
      onClick={onClose}
      className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-text hover:bg-surface2 transition-colors"
      aria-label="Close drawer"
      type="button"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  const header = (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
      <h2 className="text-base font-semibold text-text">{title}</h2>
      {closeButton}
    </div>
  );

  const body = (
    <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
  );

  const footerEl = footer ? (
    <div className="flex-shrink-0 px-5 py-4 border-t border-border flex gap-3 justify-end">
      {footer}
    </div>
  ) : null;

  // MUI standard easing: cubic-bezier(0.4, 0, 0.2, 1)
  const transition = "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop — fades in/out */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Mobile: bottom sheet ── slides up from bottom */}
      <div
        className={`
          sm:hidden
          absolute bottom-0 left-0 right-0
          w-full bg-surface rounded-t-2xl shadow-2xl
          flex flex-col max-h-[90vh]
          ${transition}
          ${visible ? "translate-y-0" : "translate-y-full"}
        `}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {header}
        {body}
        {footerEl}
      </div>

      {/* ── Desktop: right-side panel ── slides in from right */}
      <div
        className={`
          hidden sm:flex flex-col
          absolute right-0 top-0 bottom-0
          w-full max-w-md bg-surface shadow-2xl h-full
          ${transition}
          ${visible ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {header}
        {body}
        {footerEl}
      </div>
    </div>,
    document.body,
  );
}
