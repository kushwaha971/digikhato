import { SESSION_CONFIG } from "@/lib/session-config";

export type SessionSyncEvent =
  | { type: "activity"; at: number; id: string }
  | { type: "logout"; at: number; id: string };

const createEventId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const canUseBrowserStorage = () => typeof window !== "undefined";

let channel: BroadcastChannel | null = null;

const getChannel = () => {
  if (!canUseBrowserStorage() || typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!channel) {
    channel = new BroadcastChannel(SESSION_CONFIG.syncChannel);
  }

  return channel;
};

const emitEvent = (event: SessionSyncEvent) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(SESSION_CONFIG.eventKey, JSON.stringify(event));
  } catch {
    // Ignore storage quota/private mode failures.
  }

  const activeChannel = getChannel();
  if (activeChannel) {
    activeChannel.postMessage(event);
  }
};

export const setLastActivityAt = (timestamp: number) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(SESSION_CONFIG.lastActivityKey, String(timestamp));
  } catch {
    // Ignore storage quota/private mode failures.
  }
};

export const getLastActivityAt = () => {
  if (!canUseBrowserStorage()) {
    return Date.now();
  }

  const rawValue = window.localStorage.getItem(SESSION_CONFIG.lastActivityKey);
  const parsed = Number(rawValue);
  if (!rawValue || !Number.isFinite(parsed) || parsed <= 0) {
    return Date.now();
  }

  return parsed;
};

export const broadcastSessionActivity = (timestamp = Date.now()) => {
  setLastActivityAt(timestamp);
  emitEvent({ type: "activity", at: timestamp, id: createEventId() });
};

export const broadcastSessionLogout = (timestamp = Date.now()) => {
  emitEvent({ type: "logout", at: timestamp, id: createEventId() });
};

const parseEvent = (payload: unknown): SessionSyncEvent | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Partial<SessionSyncEvent>;
  if ((candidate.type !== "activity" && candidate.type !== "logout") || typeof candidate.at !== "number" || typeof candidate.id !== "string") {
    return null;
  }

  return candidate as SessionSyncEvent;
};

export const subscribeToSessionSync = (listener: (event: SessionSyncEvent) => void) => {
  if (!canUseBrowserStorage()) {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SESSION_CONFIG.eventKey || !event.newValue) {
      return;
    }

    try {
      const parsed = parseEvent(JSON.parse(event.newValue));
      if (parsed) {
        listener(parsed);
      }
    } catch {
      // Ignore malformed storage payloads.
    }
  };

  window.addEventListener("storage", onStorage);

  const activeChannel = getChannel();
  const onChannelMessage = (event: MessageEvent<unknown>) => {
    const parsed = parseEvent(event.data);
    if (parsed) {
      listener(parsed);
    }
  };

  if (activeChannel) {
    activeChannel.addEventListener("message", onChannelMessage as EventListener);
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    if (activeChannel) {
      activeChannel.removeEventListener("message", onChannelMessage as EventListener);
    }
  };
};
