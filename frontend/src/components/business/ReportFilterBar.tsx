"use client";

import { DatePicker } from "@/components/ui/DatePicker";

export function ReportFilterBar({ date, onDateChange }: { date: string; onDateChange: (value: string) => void }) {
  return (
    <div className="mb-3 rounded-xl border border-gray-200 p-3">
      <DatePicker
        name="report_filter_date"
        label="Report Date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
      />
    </div>
  );
}
