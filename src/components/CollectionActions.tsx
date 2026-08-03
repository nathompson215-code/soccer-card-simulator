"use client";

import { useState } from "react";
import { FavoriteStar } from "@/components/FavoriteStar";

export function CollectionActions({
  cardId,
  initialFavorited = false,
  initialWishlisted = false,
}: {
  cardId: string;
  initialFavorited?: boolean;
  initialWishlisted?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);

  const runWishlist = async () => {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "wishlist", cardId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setWishlisted(Boolean(data.wishlisted));
      setMessage(data.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <FavoriteStar cardId={cardId} initialFavorited={initialFavorited} />
      <button
        type="button"
        disabled={pending}
        onClick={runWishlist}
        className={`rounded-full border px-4 py-3 text-sm disabled:opacity-60 ${
          wishlisted
            ? "border-gold/40 bg-gold/15 text-gold-soft"
            : "border-white/15 text-ink"
        }`}
      >
        {wishlisted ? "Wishlisted" : "Wishlist"}
      </button>
      {message ? <span className="text-xs text-ink-muted">{message}</span> : null}
    </div>
  );
}
