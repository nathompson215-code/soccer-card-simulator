"use client";

import { useState } from "react";

export function CollectionActions({ cardId }: { cardId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (action: "favorite" | "wishlist") => {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, cardId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (action === "favorite") {
        setMessage(data.favorited ? "Added to favorites" : "Removed from favorites");
      } else {
        setMessage(data.wishlisted ? "Added to wishlist" : "Removed from wishlist");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("favorite")}
        className="rounded-full border border-white/15 px-4 py-3 text-sm text-ink disabled:opacity-60"
      >
        Favorite
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("wishlist")}
        className="rounded-full border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft disabled:opacity-60"
      >
        Wishlist
      </button>
      {message ? <span className="text-xs text-ink-muted">{message}</span> : null}
    </div>
  );
}
