import Link from "next/link";

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
  readonly compact?: boolean;
  readonly size?: Size;
  readonly href?: string;
  readonly showTagline?: boolean;
  readonly className?: string;
};

const markSizeClasses: Record<Size, string> = {
  sm: "h-7 w-7 rounded-lg",
  md: "h-9 w-9 rounded-xl",
  lg: "h-11 w-11 rounded-xl",
  xl: "h-14 w-14 rounded-2xl",
};

const textSizeClasses: Record<Size, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl sm:text-2xl",
  xl: "text-2xl sm:text-3xl",
};

const iconSizeClasses: Record<Size, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-5 h-5",
  xl: "w-7 h-7",
};

export function BookMark({ size = "md" }: { readonly size?: Size }) {
  return (
    <span className={`relative inline-flex flex-shrink-0 items-center justify-center ${markSizeClasses[size]} bg-gradient-to-br from-primary-500 to-primary-700 shadow-soft`}>
      <svg
        className={iconSizeClasses[size]}
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Stylised ₹ — two header bars + vertical drop + diagonal */}
        <line x1="7" y1="6.5" x2="17" y2="6.5" stroke="white" strokeWidth={2.4} />
        <line x1="7" y1="10.5" x2="15" y2="10.5" stroke="white" strokeWidth={2.2} />
        {/* Vertical stem */}
        <line x1="10.5" y1="6.5" x2="10.5" y2="13" stroke="white" strokeWidth={2.2} />
        {/* Diagonal slash */}
        <line x1="7.5" y1="10.5" x2="16" y2="18.5" stroke="rgba(255,255,255,0.75)" strokeWidth={2} />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-400" />
    </span>
  );
}

function Content({ size = "md", compact, showTagline, className }: Readonly<Omit<Props, "href">>) {
  const fallbackSize: Size = compact ? "sm" : "md";
  const resolvedSize: Size = size ?? fallbackSize;
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <BookMark size={resolvedSize} />
      <span className="leading-tight">
        <span className={`block font-bold tracking-tight text-text ${textSizeClasses[resolvedSize]}`}>
          Digi<span className="text-primary-500">Khaato</span>
        </span>
        {showTagline ? (
          <span className="block text-xs font-medium text-muted">Loans, Ledgers &amp; Collections — One Place</span>
        ) : null}
      </span>
    </span>
  );
}

export function BrandLogo({ compact = false, size = "md", href, showTagline = false, className }: Readonly<Props>) {
  if (!href) {
    return <Content size={size} compact={compact} showTagline={showTagline} className={className} />;
  }

  return (
    <Link aria-label="Go to home page" href={href}>
      <Content size={size} compact={compact} showTagline={showTagline} className={className} />
    </Link>
  );
}
