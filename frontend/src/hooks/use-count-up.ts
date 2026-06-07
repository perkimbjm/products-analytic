import { useEffect, useState } from "react";

/**
 * Animate a number from 0 to target over duration ms on mount.
 * Returns the animated value; use in a component that displays it
 * to get the count-up effect. (For performance, the number updates
 * discretely, not continuously.)
 */
export function useCountUp(target: number, duration = 300): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(target * progress));
      if (progress === 1) clearInterval(interval);
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, [target, duration]);

  return value;
}
