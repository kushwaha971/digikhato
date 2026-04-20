"use client";

import { useState } from "react";

export function usePagination(defaultPage = 1) {
  const [page, setPage] = useState(defaultPage);
  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  return { page, setPage, nextPage, prevPage };
}
