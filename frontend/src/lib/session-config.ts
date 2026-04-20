const DEFAULT_INACTIVITY_TIMEOUT_SECONDS = 15 * 60;
const DEFAULT_WARNING_LEAD_SECONDS = 60;

const toPositiveInteger = (rawValue: string | undefined, fallback: number) => {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const inactivityTimeoutSeconds = toPositiveInteger(
  process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT_SECONDS,
  DEFAULT_INACTIVITY_TIMEOUT_SECONDS,
);

const warningLeadSeconds = toPositiveInteger(
  process.env.NEXT_PUBLIC_INACTIVITY_WARNING_SECONDS,
  DEFAULT_WARNING_LEAD_SECONDS,
);

export const SESSION_CONFIG = {
  inactivityTimeoutMs: inactivityTimeoutSeconds * 1000,
  warningLeadMs: Math.min(warningLeadSeconds * 1000, Math.max(inactivityTimeoutSeconds * 1000 - 1000, 1000)),
  syncChannel: process.env.NEXT_PUBLIC_SESSION_SYNC_CHANNEL?.trim() || "digikhaato-session",
  lastActivityKey: "digikhaato:last-activity-at",
  eventKey: "digikhaato:session-event",
};

export const AUTH_PUBLIC_PATH_PREFIXES = ["/login", "/signup"];
