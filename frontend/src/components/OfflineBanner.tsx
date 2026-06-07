import { useEffect, useState } from "react";
import { useBackendStatus } from "../hooks/use-backend-status";
import { Icon } from "./Icon";

/**
 * Global, dismissible banner shown when the backend can't be reached. Rendered
 * once at the root so every screen gets the same fallback signal. Fixed-position
 * so it overlays without disturbing the map's full-screen layout.
 */
export function OfflineBanner() {
  const { isOffline, retry } = useBackendStatus();
  const [dismissed, setDismissed] = useState(false);

  // Re-arm the banner for the next outage once the backend recovers.
  useEffect(() => {
    if (!isOffline) setDismissed(false);
  }, [isOffline]);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed top-header-height left-1/2 -translate-x-1/2 mt-3 z-[200] w-[calc(100vw-2rem)] max-w-md flex items-start gap-3 rounded-xl bg-amber-500 text-white px-4 py-3 shadow-2xl"
    >
      <Icon name="cloud_off" className="text-[20px] mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">Backend not reachable</p>
        <p className="text-xs text-white/90 mt-0.5">
          Showing no data. Start the API server, then retry.
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={retry}
          className="flex items-center gap-1 rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-xs font-medium transition-colors"
        >
          <Icon name="refresh" className="text-[14px]" /> Retry
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded-lg p-1 hover:bg-white/20 transition-colors"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}
