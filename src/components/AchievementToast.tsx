"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { AchievementDTO } from "@/lib/types";

export function AchievementToast({
  achievements,
}: {
  achievements: AchievementDTO[];
}) {
  const [queue, setQueue] = useState<AchievementDTO[]>([]);
  const [current, setCurrent] = useState<AchievementDTO | null>(null);

  useEffect(() => {
    if (!achievements.length) return;
    setQueue((prev) => {
      const keys = new Set(prev.map((a) => a.key));
      if (current) keys.add(current.key);
      const next = achievements.filter((a) => !keys.has(a.key));
      return next.length ? [...prev, ...next] : prev;
    });
  }, [achievements, current]);

  useEffect(() => {
    if (current || !queue.length) return;
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
  }, [current, queue]);

  useEffect(() => {
    if (!current) return;
    const id = window.setTimeout(() => setCurrent(null), 4200);
    return () => window.clearTimeout(id);
  }, [current]);

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[120] flex max-w-sm flex-col gap-2 md:right-6 md:top-4">
      <AnimatePresence>
        {current ? (
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto rounded-2xl border border-gold/35 bg-[#0b1a14]/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/15 text-[11px] font-bold tracking-wide text-gold-soft">
                {current.mark}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  Achievement unlocked
                </div>
                <div className="display mt-0.5 text-2xl text-ink">{current.title}</div>
                <p className="mt-0.5 text-xs text-ink-muted">{current.description}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
