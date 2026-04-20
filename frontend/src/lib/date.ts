const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T/;

function toTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIsoDate(value: Date): string {
  return `${value.getFullYear()}-${toTwoDigits(value.getMonth() + 1)}-${toTwoDigits(value.getDate())}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function formatDateToDMY(
  value: string | Date | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback;
    return `${toTwoDigits(value.getDate())}/${toTwoDigits(value.getMonth() + 1)}/${value.getFullYear()}`;
  }

  const isoDateMatch = value.match(ISO_DATE_RE);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  const isoDateTimeMatch = value.match(ISO_DATETIME_RE);
  if (isoDateTimeMatch) {
    const [, year, month, day] = isoDateTimeMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return `${toTwoDigits(parsed.getDate())}/${toTwoDigits(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}
