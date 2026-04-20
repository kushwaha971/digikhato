"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  broadcastSessionActivity,
  getLastActivityAt,
  setLastActivityAt,
  subscribeToSessionSync,
} from "@/lib/auth/session-sync";

interface UseSessionInactivityOptions {
  enabled: boolean;
  inactivityTimeoutMs: number;
  warningLeadMs: number;
  onTimeout: () => void | Promise<void>;
}

interface UseSessionInactivityResult {
  isWarningOpen: boolean;
  secondsUntilTimeout: number;
  markActivity: () => void;
}

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "click",
  "scroll",
];

export function useSessionInactivity({
  enabled,
  inactivityTimeoutMs,
  warningLeadMs,
  onTimeout,
}: UseSessionInactivityOptions): UseSessionInactivityResult {
  const [lastActivityAt, setLastActivityState] = useState<number>(() => getLastActivityAt());
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsUntilTimeout, setSecondsUntilTimeout] = useState(Math.ceil(inactivityTimeoutMs / 1000));

  const timeoutTriggeredRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  const lastWriteRef = useRef(0);

  onTimeoutRef.current = onTimeout;

  const updateLastActivity = useCallback((timestamp: number, shouldBroadcast = true) => {
    setLastActivityState(timestamp);
    setLastActivityAt(timestamp);

    if (shouldBroadcast) {
      broadcastSessionActivity(timestamp);
    }
  }, []);

  const markActivity = useCallback(() => {
    if (!enabled) {
      return;
    }

    const now = Date.now();
    if (now - lastWriteRef.current < 1000) {
      return;
    }

    lastWriteRef.current = now;
    updateLastActivity(now, true);
  }, [enabled, updateLastActivity]);

  useEffect(() => {
    if (!enabled) {
      setIsWarningOpen(false);
      timeoutTriggeredRef.current = false;
      return;
    }

    const initialActivity = getLastActivityAt();
    updateLastActivity(initialActivity, false);
    timeoutTriggeredRef.current = false;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const idleDuration = now - lastActivityAt;

      if (idleDuration >= inactivityTimeoutMs && !timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true;
        setIsWarningOpen(false);
        setSecondsUntilTimeout(0);
        void onTimeoutRef.current();
        return;
      }

      if (idleDuration >= Math.max(inactivityTimeoutMs - warningLeadMs, 0)) {
        setIsWarningOpen(true);
      } else {
        setIsWarningOpen(false);
      }

      const remainingMs = Math.max(inactivityTimeoutMs - idleDuration, 0);
      setSecondsUntilTimeout(Math.ceil(remainingMs / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [enabled, inactivityTimeoutMs, warningLeadMs, lastActivityAt, updateLastActivity]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const listener = () => markActivity();
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, listener, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, listener);
      });
    };
  }, [enabled, markActivity]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return subscribeToSessionSync((event) => {
      if (event.type === "activity" && event.at > lastActivityAt) {
        updateLastActivity(event.at, false);
      }
    });
  }, [enabled, lastActivityAt, updateLastActivity]);

  return {
    isWarningOpen,
    secondsUntilTimeout,
    markActivity,
  };
}
