"use client";

import { useState } from "react";

export function useBorrowerFilters() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "">("");
  return { search, setSearch, status, setStatus };
}
