const DEFAULT_INACTIVITY_TIMEOUT_SECONDS = 0;
const DEFAULT_WARNING_LEAD_SECONDS = 60;

const toNonNegativeInteger = (rawValue: string | undefined, fallback: number) => {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const inactivityTimeoutSeconds = toNonNegativeInteger(
  process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT_SECONDS,
  DEFAULT_INACTIVITY_TIMEOUT_SECONDS,
);

const warningLeadSeconds = toNonNegativeInteger(
  process.env.NEXT_PUBLIC_INACTIVITY_WARNING_SECONDS,
  DEFAULT_WARNING_LEAD_SECONDS,
);

const hasInactivityTimeout = inactivityTimeoutSeconds > 0;

export const SESSION_CONFIG = {
  inactivityTimeoutMs: inactivityTimeoutSeconds * 1000,
  warningLeadMs: hasInactivityTimeout
    ? Math.min(warningLeadSeconds * 1000, Math.max(inactivityTimeoutSeconds * 1000 - 1000, 1000))
    : 0,
  hasInactivityTimeout,
  syncChannel: process.env.NEXT_PUBLIC_SESSION_SYNC_CHANNEL?.trim() || "digikhaato-session",
  lastActivityKey: "digikhaato:last-activity-at",
  eventKey: "digikhaato:session-event",
};

export const AUTH_PUBLIC_PATH_PREFIXES = ["/login", "/signup"];
