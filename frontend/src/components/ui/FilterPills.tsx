"use client";

interface Option {
  label: string;
  value: string;
}

interface FilterPillsProps {
  readonly options: Option[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function FilterPills({ options, value, onChange }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
            value === opt.value
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-surface text-muted border-border hover:border-primary-400 hover:text-text"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
