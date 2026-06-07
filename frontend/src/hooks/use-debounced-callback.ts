import { useEffect, useRef } from "react";

/**
 * Returns a stable debounced wrapper around `callback`. Each call resets the
 * timer; the callback fires `delay` ms after the last invocation. The pending
 * timer is cleared on unmount.
 *
 * Replaces the per-route ad-hoc `setTimeout` debounce in the Map and Dashboard
 * search inputs (single source of truth).
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep the latest callback without re-creating the debounced function.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (...args: Args): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
  };
}
