"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent } from "react";

export function FavoriteStar({
  cardId,
  initialFavorited = false,
  size = "md",
  className = "",
}: {
  cardId: string;
  initialFavorited?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  const toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      try {
        const res = await fetch("/api/collection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "favorite", cardId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setFavorited(Boolean(data.favorited));
        router.refresh();
      } catch {
        setFavorited(!next);
      }
    });
  };

  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <button
      type="button"
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      disabled={pending}
      onClick={toggle}
      className={`inline-grid place-items-center rounded-full border transition ${dim} ${
        favorited
          ? "border-gold/50 bg-gold/15 text-gold"
          : "border-white/15 bg-black/30 text-ink-muted hover:border-gold/40 hover:text-gold-soft"
      } disabled:opacity-60 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={size === "sm" ? "h-4 w-4" : "h-5 w-5"}
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <path d="M12 3.6l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 16.8l-4.8 2.56.92-5.34L4.24 9.24l5.36-.78L12 3.6z" />
      </svg>
    </button>
  );
}
