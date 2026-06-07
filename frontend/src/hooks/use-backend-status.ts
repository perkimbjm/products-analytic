import { useFilters } from "../lib/api/hooks";

export type BackendStatus = "checking" | "online" | "offline";

export interface BackendStatusResult {
  status: BackendStatus;
  isOffline: boolean;
  /** Re-run the probe query (used by the "Retry" action). */
  retry: () => void;
}

/**
 * Connectivity signal for the backend, derived from the shared `filters` query
 * that both pages already load — so this adds no extra network request. Treats
 * any settled error as "offline" (the backend is down or not responding).
 */
export function useBackendStatus(): BackendStatusResult {
  const { isError, isSuccess, refetch } = useFilters();

  const status: BackendStatus = isSuccess ? "online" : isError ? "offline" : "checking";

  return {
    status,
    isOffline: status === "offline",
    retry: () => void refetch(),
  };
}
