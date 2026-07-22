"use client";

import { useEffect, useState } from "react";

// A ticking clock is an instrument reading, not decoration — fits the
// "industrial panel" vibe without being gratuitous motion.
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    // deferred via setTimeout rather than called synchronously in the effect body,
    // so the first paint still avoids an SSR/client hydration mismatch
    const initial = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, []);

  if (!now) {
    return <span className="font-mono text-body-sm text-muted">--:--:--</span>;
  }

  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  const date = now
    .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    .toUpperCase();

  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-body-sm tabular-nums text-foreground">{time}</span>
      <span className="label">{date}</span>
    </div>
  );
}
