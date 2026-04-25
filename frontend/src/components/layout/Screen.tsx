import { ReactNode } from "react";
import Link from "next/link";
import { PageBackButton } from "@/components/layout/PageBackButton";

interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

interface ScreenProps {
  readonly title?: string;
  readonly breadcrumb?: BreadcrumbItem[];
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly noPadding?: boolean;
  readonly fullWidth?: boolean;
  /** When provided, renders a back arrow to the left of the title. */
  readonly backHref?: string;
}

export function Screen({ title, breadcrumb, actions, children, noPadding = false, fullWidth = false, backHref }: ScreenProps) {
  const containerClass = fullWidth ? "w-full px-4 sm:px-6 lg:px-8" : "app-container";
  const contentClass = noPadding ? "flex-1" : `flex-1 ${containerClass} py-4 md:py-6`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky page header */}
      {(title || breadcrumb || actions) && (
        <div className="sticky top-16 z-20 bg-canvas/90 backdrop-blur-md border-b border-border flex-shrink-0">
          <div className={containerClass}>
            <div className="py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex items-center gap-2 flex-1">
                {backHref && (
                  <PageBackButton fallbackHref={backHref} />
                )}
                <div className="min-w-0">
                  {breadcrumb && breadcrumb.length > 0 && (
                    <nav className="flex items-center gap-1 mb-0.5" aria-label="Breadcrumb">
                      {breadcrumb.map((item) => (
                        <span key={item.label} className="flex items-center gap-1">
                          {item.href !== breadcrumb[0].href && (
                            <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                          {item.href ? (
                            <Link href={item.href} className="text-xs text-muted hover:text-text transition-colors truncate max-w-[120px]">
                              {item.label}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted truncate max-w-[120px]">{item.label}</span>
                          )}
                        </span>
                      ))}
                    </nav>
                  )}
                  {title && (
                    <h1 className="text-base font-bold text-text truncate">{title}</h1>
                  )}
                </div>
              </div>
              {actions && (
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">{actions}</div>
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
