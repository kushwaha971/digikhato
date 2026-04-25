interface DigiMascotProps {
  readonly className?: string;
}

export function DigiMascot({ className }: DigiMascotProps) {
  return (
    <svg
      viewBox="0 0 220 270"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Digi — the DigiKhaato mascot"
      role="img"
    >
      {/* ── Green Leaves ── */}
      {/* Far left leaf */}
      <path d="M108,78 C92,66 78,52 66,36 C78,48 94,64 108,78Z" fill="#16A34A" />
      {/* Left leaf */}
      <path d="M108,78 C96,60 88,44 82,26 C90,40 100,58 108,78Z" fill="#22C55E" />
      {/* Center leaf — tallest */}
      <path d="M108,78 C106,58 106,40 108,14 C110,36 110,56 108,78Z" fill="#4ADE80" />
      {/* Right leaf */}
      <path d="M108,78 C120,60 128,44 134,26 C126,40 116,58 108,78Z" fill="#22C55E" />
      {/* Far right leaf */}
      <path d="M108,78 C124,66 138,52 150,36 C138,48 122,64 108,78Z" fill="#16A34A" />

      {/* ── Carrot Body ── */}
      <path
        d="M108,76 C84,76 66,92 62,116 C58,142 60,168 68,192 C76,214 90,232 108,236 C126,232 140,214 148,192 C156,168 158,142 154,116 C150,92 132,76 108,76Z"
        fill="#FF7B35"
      />
      {/* Body texture lines */}
      <path d="M92,86 C88,104 86,126 87,150 C88,170 92,188 96,202" stroke="#D96820" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <path d="M124,86 C128,104 130,126 129,150 C128,170 124,188 120,202" stroke="#D96820" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* ── Face ── */}
      {/* Left eye */}
      <ellipse cx="93" cy="122" rx="10" ry="11" fill="white" />
      <ellipse cx="95" cy="124" rx="6" ry="6" fill="#1E293B" />
      <circle cx="97" cy="122" r="2.2" fill="white" />
      {/* Right eye */}
      <ellipse cx="123" cy="122" rx="10" ry="11" fill="white" />
      <ellipse cx="125" cy="124" rx="6" ry="6" fill="#1E293B" />
      <circle cx="127" cy="122" r="2.2" fill="white" />
      {/* Rosy cheeks */}
      <ellipse cx="82" cy="136" rx="9" ry="5.5" fill="#FFB3A0" opacity="0.55" />
      <ellipse cx="134" cy="136" rx="9" ry="5.5" fill="#FFB3A0" opacity="0.55" />
      {/* Smile */}
      <path d="M90,141 Q108,154 126,141" stroke="#1E293B" strokeWidth="2.8" strokeLinecap="round" fill="none" />

      {/* ── Bow-tie (primary crimson) ── */}
      {/* Left wing */}
      <path d="M103,160 L90,152 L90,168 Z" fill="#E03060" />
      {/* Right wing */}
      <path d="M113,160 L126,152 L126,168 Z" fill="#E03060" />
      {/* Centre knot */}
      <circle cx="108" cy="160" r="5" fill="#C0274F" />

      {/* ── Right Arm ── */}
      <path d="M148,142 Q166,136 174,124" stroke="#FF7B35" strokeWidth="12" strokeLinecap="round" />

      {/* ── Ledger / Document in right hand ── */}
      {/* Paper shadow */}
      <rect x="168" y="102" width="43" height="56" rx="5" fill="#E2E8F0" />
      {/* Paper */}
      <rect x="165" y="99" width="43" height="56" rx="5" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* Header band (primary colour) */}
      <path d="M165,99 Q165,99 165,99 h43 v15 h-43 Z" rx="5" fill="#E03060" />
      <rect x="165" y="99" width="43" height="15" rx="5" fill="#E03060" />
      {/* ₹ on header */}
      <text x="172" y="111" fontSize="9" fill="white" fontFamily="sans-serif" fontWeight="bold">₹ Ledger</text>
      {/* Content lines */}
      <line x1="172" y1="126" x2="201" y2="126" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="172" y1="134" x2="201" y2="134" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="172" y1="142" x2="191" y2="142" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
      {/* Small tick / checkmark accent */}
      <path d="M172,150 L176,155 L183,147" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* ── Left Arm ── */}
      <path d="M68,142 Q50,136 42,124" stroke="#FF7B35" strokeWidth="11" strokeLinecap="round" />

      {/* ── Coin Stack in left hand ── */}
      <ellipse cx="35" cy="122" rx="13" ry="5.5" fill="#FCD34D" />
      <ellipse cx="35" cy="117" rx="13" ry="5.5" fill="#FBBF24" />
      <ellipse cx="35" cy="112" rx="13" ry="5.5" fill="#FCD34D" />
      <ellipse cx="35" cy="107" rx="13" ry="5.5" fill="#F59E0B" />
      {/* ₹ on top coin */}
      <text x="29" y="112" fontSize="8" fill="#92400E" fontFamily="sans-serif" fontWeight="bold">₹</text>

      {/* ── Floating sparkles (decorative) ── */}
      <circle cx="158" cy="82" r="3" fill="#E03060" opacity="0.7" />
      <circle cx="168" cy="92" r="2" fill="#E03060" opacity="0.4" />
      <circle cx="52" cy="88" r="2.5" fill="#FBBF24" opacity="0.7" />
      <circle cx="42" cy="100" r="1.8" fill="#FBBF24" opacity="0.4" />
    </svg>
  );
}
