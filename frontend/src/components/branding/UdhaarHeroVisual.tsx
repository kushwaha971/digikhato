interface PartyRow {
  name: string;
  balance: string;
  type: "get" | "give";
}

const PARTY_ROWS: PartyRow[] = [
  { name: "Amit Traders", balance: "₹3,200", type: "get" },
  { name: "Riya Garments", balance: "₹1,150", type: "give" },
  { name: "Kumar Stores", balance: "₹2,400", type: "get" },
  { name: "Sharma Foods", balance: "₹650", type: "give" },
];

export function UdhaarHeroVisual() {
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100/70 via-white to-success-100/70 rounded-[2rem] blur-2xl" />
      <div className="relative app-panel p-4 sm:p-5 rounded-[1.75rem] shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">UdhaarBook</p>
                <p className="text-sm font-bold text-text">Party Ledger</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-primary-50 text-primary-600 font-semibold">Live</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-xl border border-success-200 bg-success-50 p-2.5">
                <p className="text-[10px] text-success-700 font-semibold uppercase">You Will Get</p>
                <p className="text-sm font-bold text-success-700">₹5,600</p>
              </div>
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-2.5">
                <p className="text-[10px] text-danger-700 font-semibold uppercase">You Will Give</p>
                <p className="text-sm font-bold text-danger-700">₹1,800</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {PARTY_ROWS.map((row) => (
                <div key={row.name} className="flex items-center justify-between rounded-lg border border-border/70 px-2.5 py-2">
                  <p className="text-xs text-text font-medium">{row.name}</p>
                  <p className={`text-xs font-bold ${row.type === "get" ? "text-success-600" : "text-danger-600"}`}>
                    {row.balance}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-surface2 p-3">
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Transaction Flow</p>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg bg-surface border border-border px-2.5 py-2">
                  Credit Added: <span className="font-semibold text-text">₹1,200</span>
                </div>
                <div className="flex justify-center text-muted">↓</div>
                <div className="rounded-lg bg-surface border border-border px-2.5 py-2">
                  Reminder Sent: <span className="font-semibold text-text">WhatsApp</span>
                </div>
                <div className="flex justify-center text-muted">↓</div>
                <div className="rounded-lg bg-surface border border-border px-2.5 py-2">
                  Payment Received: <span className="font-semibold text-success-600">₹1,200</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-3">
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <span className="rounded-lg bg-primary-50 text-primary-600 text-[11px] font-semibold px-2 py-2 text-center">+ Add Party</span>
                <span className="rounded-lg bg-success-50 text-success-700 text-[11px] font-semibold px-2 py-2 text-center">Record Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
