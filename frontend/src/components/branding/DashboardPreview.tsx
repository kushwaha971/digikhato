interface DashboardPreviewProps {
  readonly className?: string;
}

export function DashboardPreview({ className }: DashboardPreviewProps) {
  return (
    <svg
      viewBox="0 0 780 520"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DigiKhaato app preview on desktop and mobile"
      role="img"
    >
      {/* ═══════════════════════════════════════════════════
          DESKTOP BROWSER MOCKUP  (left, slightly tilted back)
          ═══════════════════════════════════════════════════ */}
      <g>
        {/* Browser shell */}
        <rect x="10" y="30" width="550" height="440" rx="12" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* Browser chrome bar */}
        <rect x="10" y="30" width="550" height="40" rx="12" fill="#E2E8F0" />
        <rect x="10" y="56" width="550" height="14" fill="#E2E8F0" />
        {/* Traffic lights */}
        <circle cx="32" cy="50" r="5.5" fill="#FDA29B" />
        <circle cx="50" cy="50" r="5.5" fill="#FEC84B" />
        <circle cx="68" cy="50" r="5.5" fill="#6CE9A6" />
        {/* URL bar */}
        <rect x="88" y="40" width="260" height="20" rx="5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="102" y="54" fontSize="9" fill="#94A3B8" fontFamily="monospace">digikhaato.com/udhar-book</text>

        {/* ── Browser content area ── */}
        <rect x="10" y="70" width="550" height="400" rx="0" fill="white" />
        <rect x="10" y="390" width="550" height="80" rx="12" fill="white" />

        {/* Sidebar */}
        <rect x="10" y="70" width="160" height="400" fill="#FAFAFA" />
        <rect x="169" y="70" width="1" height="400" fill="#E2E8F0" />

        {/* Sidebar header */}
        <rect x="22" y="82" width="36" height="36" rx="8" fill="#E03060" />
        <text x="30" y="106" fontSize="18" fill="white" fontWeight="bold" fontFamily="sans-serif">₹</text>
        <text x="66" y="96" fontSize="11" fill="#E03060" fontWeight="700" fontFamily="sans-serif">Digi</text>
        <text x="92" y="96" fontSize="11" fill="#1E293B" fontWeight="700" fontFamily="sans-serif">Khaato</text>

        {/* Sidebar section label */}
        <text x="22" y="136" fontSize="8" fill="#94A3B8" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.5">UDHAARBOOK</text>
        {/* Active nav item */}
        <rect x="14" y="142" width="148" height="30" rx="7" fill="#FEE2E8" />
        <rect x="24" y="149" width="14" height="14" rx="3" fill="#E03060" opacity="0.3" />
        <text x="44" y="160" fontSize="10" fill="#E03060" fontWeight="600" fontFamily="sans-serif">Parties</text>

        <text x="22" y="192" fontSize="8" fill="#94A3B8" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.5">APPS</text>
        {[
          { y: 198, label: "Loan Management" },
          { y: 230, label: "UdhaarBook" },
          { y: 262, label: "Notes" },
        ].map(({ y, label }) => (
          <g key={y}>
            <rect x="24" y={y + 7} width="14" height="14" rx="3" fill="#CBD5E1" opacity="0.5" />
            <text x="44" y={y + 18} fontSize="10" fill="#64748B" fontFamily="sans-serif">{label}</text>
          </g>
        ))}

        {/* Sidebar bottom */}
        <rect x="14" y="436" width="148" height="28" rx="7" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx="28" cy="450" r="8" fill="#E03060" opacity="0.15" />
        <text x="22" y="454" fontSize="10">T</text>
        <text x="40" y="448" fontSize="9" fill="#334155" fontWeight="600" fontFamily="sans-serif">Tenant Business</text>
        <text x="40" y="458" fontSize="8" fill="#94A3B8" fontFamily="sans-serif">Admin</text>

        {/* ── Main content area ── */}
        {/* Page title */}
        <text x="190" y="96" fontSize="14" fill="#1E293B" fontWeight="700" fontFamily="sans-serif">Udhar Book</text>

        {/* NET BALANCE card */}
        <rect x="182" y="104" width="364" height="80" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="198" y="120" fontSize="8" fill="#64748B" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.5">NET BALANCE</text>
        <text x="198" y="144" fontSize="22" fill="#22C55E" fontWeight="700" fontFamily="sans-serif">₹8,500</text>
        <text x="248" y="144" fontSize="10" fill="#22C55E" fontFamily="sans-serif"> will get</text>

        {/* Will Get / Will Give sub-cards */}
        <rect x="182" y="154" width="178" height="28" rx="0" fill="white" stroke="#E2E8F0" strokeWidth="1" />
        <text x="198" y="164" fontSize="7" fill="#64748B" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.3">WILL GET</text>
        <text x="198" y="175" fontSize="12" fill="#22C55E" fontWeight="700" fontFamily="sans-serif">₹10,000</text>

        <rect x="368" y="154" width="178" height="28" rx="0" fill="white" stroke="#E2E8F0" strokeWidth="1" />
        <text x="384" y="164" fontSize="7" fill="#64748B" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.3">WILL GIVE</text>
        <text x="384" y="175" fontSize="12" fill="#E03060" fontWeight="700" fontFamily="sans-serif">₹1,500</text>

        {/* Search bar */}
        <rect x="182" y="192" width="364" height="26" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="200" y="209" fontSize="9" fill="#CBD5E1" fontFamily="sans-serif">Search parties...</text>
        <circle cx="194" cy="205" r="4" stroke="#CBD5E1" strokeWidth="1.2" fill="none" />

        {/* Filter tabs */}
        <rect x="182" y="226" width="34" height="18" rx="9" fill="#E03060" />
        <text x="191" y="239" fontSize="8" fill="white" fontWeight="600" fontFamily="sans-serif">All</text>
        {[{ x: 220, label: "Will Get" }, { x: 272, label: "Will Give" }, { x: 330, label: "Settled" }].map(({ x, label }) => (
          <g key={x}>
            <rect x={x} y="226" width={label.length * 6 + 12} height="18" rx="9" fill="white" stroke="#E2E8F0" strokeWidth="1" />
            <text x={x + 6} y="239" fontSize="8" fill="#64748B" fontFamily="sans-serif">{label}</text>
          </g>
        ))}

        {/* Party rows */}
        {[
          { name: "Gaurav", initials: "G", time: "just now", amt: "₹10,000", amtLabel: "WILL GIVE", amtColor: "#22C55E", bg: "#D1FAE5" },
          { name: "Aryan Sharma", initials: "AS", time: "2 hours ago", amt: "₹1,500", amtLabel: "YOU WILL GIVE", amtColor: "#E03060", bg: "#FEE2E8" },
          { name: "Ravi Kumar", initials: "RK", time: "yesterday", amt: "₹5,200", amtLabel: "WILL GIVE", amtColor: "#22C55E", bg: "#D1FAE5" },
        ].map(({ name, initials, time, amt, amtLabel, amtColor, bg }, i) => (
          <g key={name}>
            <rect x="182" y={254 + i * 48} width="364" height="40" rx="8" fill="white" stroke="#F1F5F9" strokeWidth="1" />
            <circle cx="204" cy={274 + i * 48} r="14" fill={bg} />
            <text x={204 - initials.length * 3.5} y={278 + i * 48} fontSize="9" fill={amtColor} fontWeight="600" fontFamily="sans-serif">{initials}</text>
            <text x="224" y={270 + i * 48} fontSize="10" fill="#1E293B" fontWeight="600" fontFamily="sans-serif">{name}</text>
            <text x="224" y={282 + i * 48} fontSize="8" fill="#94A3B8" fontFamily="sans-serif">{time}</text>
            <text x="518" y={270 + i * 48} fontSize="11" fill={amtColor} fontWeight="700" fontFamily="sans-serif" textAnchor="end">{amt}</text>
            <text x="518" y={282 + i * 48} fontSize="7" fill={amtColor} fontFamily="sans-serif" textAnchor="end">{amtLabel}</text>
          </g>
        ))}

        {/* Add Party button */}
        <rect x="462" y="444" width="90" height="26" rx="13" fill="#E03060" />
        <text x="470" y="461" fontSize="9" fill="white" fontWeight="600" fontFamily="sans-serif">+ Add Party</text>
      </g>

      {/* ═══════════════════════════════════════════════════
          MOBILE PHONE MOCKUP  (front-right, overlapping)
          ═══════════════════════════════════════════════════ */}
      <g transform="translate(490, 60)">
        {/* Phone shell */}
        <rect x="0" y="0" width="200" height="390" rx="28" fill="#1E293B" stroke="#334155" strokeWidth="2" />
        {/* Screen bezel */}
        <rect x="8" y="12" width="184" height="366" rx="22" fill="#F8FAFC" />
        {/* Notch */}
        <rect x="72" y="12" width="56" height="18" rx="9" fill="#1E293B" />
        {/* Status bar */}
        <text x="20" y="40" fontSize="8" fill="#1E293B" fontWeight="600" fontFamily="monospace">9:30</text>
        <text x="158" y="40" fontSize="7" fill="#1E293B" fontFamily="sans-serif">●●●</text>

        {/* Mobile top bar */}
        <rect x="8" y="44" width="184" height="36" rx="0" fill="white" />
        {/* DigiKhaato logo in mobile */}
        <rect x="18" y="52" width="22" height="22" rx="6" fill="#E03060" />
        <text x="23" y="68" fontSize="12" fill="white" fontWeight="bold">₹</text>
        <text x="46" y="62" fontSize="10" fill="#E03060" fontWeight="700" fontFamily="sans-serif">Digi</text>
        <text x="68" y="62" fontSize="10" fill="#1E293B" fontWeight="700" fontFamily="sans-serif">Khaato</text>
        {/* Hamburger + bell */}
        <rect x="168" y="53" width="20" height="20" rx="5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="172" y1="59" x2="184" y2="59" stroke="#64748B" strokeWidth="1.5" />
        <line x1="172" y1="63" x2="184" y2="63" stroke="#64748B" strokeWidth="1.5" />
        <line x1="172" y1="67" x2="184" y2="67" stroke="#64748B" strokeWidth="1.5" />

        {/* Divider */}
        <line x1="8" y1="80" x2="192" y2="80" stroke="#F1F5F9" strokeWidth="1" />

        {/* Page heading */}
        <text x="18" y="100" fontSize="14" fill="#1E293B" fontWeight="700" fontFamily="sans-serif">Udhar Book</text>

        {/* Net balance mobile card */}
        <rect x="12" y="108" width="176" height="72" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="22" y="122" fontSize="7" fill="#64748B" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.3">NET BALANCE</text>
        <text x="22" y="140" fontSize="18" fill="#22C55E" fontWeight="700" fontFamily="sans-serif">₹8,500</text>
        <text x="100" y="140" fontSize="8" fill="#22C55E" fontFamily="sans-serif"> will get</text>
        {/* Will Get / Will Give */}
        <line x1="12" y1="150" x2="188" y2="150" stroke="#E2E8F0" strokeWidth="1" />
        <rect x="12" y="150" width="88" height="28" rx="0" fill="white" />
        <text x="22" y="161" fontSize="6" fill="#64748B" fontWeight="600" fontFamily="sans-serif">WILL GET</text>
        <text x="22" y="172" fontSize="11" fill="#22C55E" fontWeight="700" fontFamily="sans-serif">₹10,000</text>
        <rect x="100" y="150" width="88" height="28" rx="0" fill="white" />
        <text x="110" y="161" fontSize="6" fill="#64748B" fontWeight="600" fontFamily="sans-serif">WILL GIVE</text>
        <text x="110" y="172" fontSize="11" fill="#E03060" fontWeight="700" fontFamily="sans-serif">₹1,500</text>

        {/* Search bar mobile */}
        <rect x="12" y="188" width="176" height="24" rx="7" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="28" y="204" fontSize="8" fill="#CBD5E1" fontFamily="sans-serif">Search parties...</text>
        <circle cx="22" cy="200" r="4" stroke="#CBD5E1" strokeWidth="1.2" fill="none" />

        {/* Filter chips */}
        <rect x="12" y="218" width="22" height="16" rx="8" fill="#E03060" />
        <text x="17" y="230" fontSize="7" fill="white" fontWeight="600" fontFamily="sans-serif">All</text>
        {[{ x: 38, w: 46, label: "Will Get" }, { x: 88, w: 46, label: "Will Give" }, { x: 138, w: 42, label: "Settled" }].map(({ x, w, label }) => (
          <g key={x}>
            <rect x={x} y="218" width={w} height="16" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
            <text x={x + 5} y="230" fontSize="7" fill="#64748B" fontFamily="sans-serif">{label}</text>
          </g>
        ))}

        {/* Party rows mobile */}
        {[
          { name: "Gaurav", initials: "G", time: "just now", amt: "₹10,000", label: "WILL GIVE", amtColor: "#22C55E", bg: "#D1FAE5" },
          { name: "Aryan Sharma", initials: "AS", time: "just now", amt: "₹1,500", label: "YOU WILL GIVE", amtColor: "#E03060", bg: "#FEE2E8" },
        ].map(({ name, initials, time, amt, label, amtColor, bg }, i) => (
          <g key={name}>
            <rect x="12" y={242 + i * 52} width="176" height="44" rx="8" fill="white" stroke="#F1F5F9" strokeWidth="1" />
            <circle cx="30" cy={264 + i * 52} r="12" fill={bg} />
            <text x={30 - initials.length * 3} y={268 + i * 52} fontSize="8" fill={amtColor} fontWeight="600" fontFamily="sans-serif">{initials}</text>
            <text x="48" y={260 + i * 52} fontSize="10" fill="#1E293B" fontWeight="600" fontFamily="sans-serif">{name}</text>
            <text x="48" y={271 + i * 52} fontSize="7.5" fill="#94A3B8" fontFamily="sans-serif">{time}</text>
            <text x="178" y={260 + i * 52} fontSize="11" fill={amtColor} fontWeight="700" fontFamily="sans-serif" textAnchor="end">{amt}</text>
            <text x="178" y={272 + i * 52} fontSize="7" fill={amtColor} fontFamily="sans-serif" textAnchor="end">{label}</text>
          </g>
        ))}

        {/* Add Party FAB mobile */}
        <rect x="88" y="352" width="100" height="28" rx="14" fill="#E03060" />
        <text x="100" y="370" fontSize="9" fill="white" fontWeight="600" fontFamily="sans-serif">+ Add Party</text>

        {/* Home indicator */}
        <rect x="74" y="390" width="52" height="4" rx="2" fill="#334155" opacity="0.3" />
      </g>
    </svg>
  );
}
