import { useCallback, useState } from "react";

/**
 * Generic draft-then-apply filter state.
 * "Draft" values are edited in the filter panel.
 * "Applied" values are committed to the query only when applyFilters() is called.
 * resetFilters() clears both draft and applied simultaneously.
 */
export function useDraftFilters<T extends Record<string, string>>(initial: T) {
  const [applied, setApplied] = useState<T>(initial);
  const [draft, setDraft] = useState<T>(initial);

  const setDraftField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback((onApply?: () => void) => {
    setApplied(draft);
    onApply?.();
  }, [draft]);

  const resetFilters = useCallback(() => {
    setDraft(initial);
    setApplied(initial);
  }, [initial]);

  const hasFilters = Object.values(applied).some(Boolean);

  return { applied, draft, setDraftField, applyFilters, resetFilters, hasFilters };
}
