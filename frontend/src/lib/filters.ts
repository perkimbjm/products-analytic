import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { z } from "zod";

/**
 * Global filter shared across the Dashboard and Map pages (ADR-006).
 * Persisted in the URL so the active filter is shareable and survives reloads.
 */
export const filterSearchSchema = z.object({
  category: z.string().optional(),
  segment: z.string().optional(),
  q: z.string().optional(),
});

export type GlobalFilters = z.infer<typeof filterSearchSchema>;

/** Drop empty/undefined values so they never appear in the URL. */
function clean(filters: GlobalFilters): GlobalFilters {
  const next: GlobalFilters = {};
  if (filters.category) next.category = filters.category;
  if (filters.segment) next.segment = filters.segment;
  if (filters.q) next.q = filters.q;
  return next;
}

export interface UseGlobalFiltersResult {
  filters: GlobalFilters;
  setFilters: (patch: Partial<GlobalFilters>) => void;
  resetFilters: () => void;
  /** Filters shaped for the API client (array params). */
  apiParams: { categories?: string[]; segments?: string[]; search?: string };
}

/**
 * Reads/writes the global filter from the current route's URL search params.
 * `strict: false` lets the same hook work on any route that registers
 * {@link filterSearchSchema} via `validateSearch`.
 */
export function useGlobalFilters(): UseGlobalFiltersResult {
  const search = useSearch({ strict: false }) as GlobalFilters;
  const navigate = useNavigate();

  const setFilters = useCallback(
    (patch: Partial<GlobalFilters>): void => {
      void navigate({
        to: ".",
        search: (prev: GlobalFilters) => clean({ ...prev, ...patch }),
        replace: true,
      });
    },
    [navigate],
  );

  const resetFilters = useCallback((): void => {
    void navigate({ to: ".", search: {}, replace: true });
  }, [navigate]);

  // Memoize on the raw search primitives so `filters` and `apiParams` keep a
  // stable reference across renders. TanStack Query hashes keys by value, so
  // this is about referential stability for memoized children and effect deps —
  // not about preventing duplicate fetches.
  const filters = useMemo<GlobalFilters>(
    () => ({ category: search.category, segment: search.segment, q: search.q }),
    [search.category, search.segment, search.q],
  );

  const apiParams = useMemo(
    () => ({
      categories: search.category ? [search.category] : undefined,
      segments: search.segment ? [search.segment] : undefined,
      search: search.q || undefined,
    }),
    [search.category, search.segment, search.q],
  );

  return { filters, setFilters, resetFilters, apiParams };
}
