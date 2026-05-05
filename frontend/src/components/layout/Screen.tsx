import { ReactNode } from "react";
import Link from "next/link";
import { PageBackButton } from "@/components/layout/PageBackButton";

interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

interface ScreenProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly breadcrumb?: BreadcrumbItem[];
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly noPadding?: boolean;
  readonly fullWidth?: boolean;
  /** When provided, renders a back arrow to the left of the title. */
  readonly backHref?: string;
}

export function Screen({ title, subtitle, breadcrumb, actions, children, noPadding = false, fullWidth = false, backHref }: ScreenProps) {
  const containerClass = fullWidth ? "w-full px-4 sm:px-6 lg:px-8" : "app-container";
  const contentClass = noPadding ? "flex-1" : `flex-1 ${containerClass} py-4 md:py-6`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky page header */}
      {(title || subtitle || breadcrumb || actions) && (
        <div className="sticky top-16 lg:top-[var(--desktop-screen-top,0px)] z-20 bg-canvas border-b border-border shadow-sm flex-shrink-0">
          <div className={containerClass}>
            <div className="py-3 md:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
              <div className="min-w-0 flex items-start sm:items-center gap-2 flex-1">
                {backHref && (
                  <PageBackButton fallbackHref={backHref} />
                )}
                <div className="min-w-0">
                  {breadcrumb && breadcrumb.length > 0 && (
                    <nav className="flex items-center gap-1 mb-0.5 overflow-hidden" aria-label="Breadcrumb">
                      {breadcrumb.map((item) => (
                        <span key={item.label} className="flex items-center gap-1 min-w-0">
                          {item.href !== breadcrumb[0].href && (
                            <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                          {item.href ? (
                            <Link href={item.href} className="text-xs text-muted hover:text-text transition-colors truncate max-w-[90px] sm:max-w-[140px]">
                              {item.label}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted truncate max-w-[90px] sm:max-w-[140px]">{item.label}</span>
                          )}
                        </span>
                      ))}
                    </nav>
                  )}
                  {title && (
                    <h1 className="text-lg md:text-2xl font-bold text-text leading-tight break-words">{title}</h1>
                  )}
                  {subtitle ? <p className="text-sm text-muted mt-1 leading-snug break-words">{subtitle}</p> : null}
                </div>
              </div>
              {actions && (
                <div className="w-full sm:w-auto flex items-center sm:justify-end gap-2 flex-wrap sm:flex-nowrap min-w-0">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <div className={contentClass}>
        {children}
      </div>
    </div>
  );
}
