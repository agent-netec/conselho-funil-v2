import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from previous value to `end` with easeOutCubic.
 * Used for KPI counters in the dashboard.
 */
export function useCountUp(end: number, duration = 800): number {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (end === prevEnd.current) return;
    const start = prevEnd.current;
    prevEnd.current = end;
    const t0 = performance.now();

    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setCount(Math.round(start + (end - start) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration]);

  return count;
}
