import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginatedResponse } from "@/types/api";

/**
 * Accumulates paginated RTK Query results for infinite scroll.
 * - page === 1 → replace items (filter/search reset)
 * - page > 1  → append items
 * - Sentinel div at list bottom triggers next page via IntersectionObserver
 */
export function useInfiniteItems<T>(
  data: PaginatedResponse<T> | undefined,
  isFetching: boolean,
  page: number,
  loadMore: () => void,
) {
  const [items, setItems] = useState<T[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data?.results) return;
    setItems((prev) => (page === 1 ? data.results : [...prev, ...data.results]));
  }, [data, page]);

  const hasMore = (data?.count ?? 0) > items.length;

  const stableLoadMore = useCallback(loadMore, [loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isFetching) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) stableLoadMore();
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, isFetching, stableLoadMore]);

  return { items, hasMore, sentinelRef };
}
