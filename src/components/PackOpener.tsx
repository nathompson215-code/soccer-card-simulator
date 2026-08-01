"use client";

import { useState } from "react";
import { SealedPack } from "@/components/SealedPack";
import { PackOpeningTheater } from "@/components/PackOpeningTheater";
import { packSounds } from "@/lib/pack-sounds";
import type { ProductDTO } from "@/lib/types";

export function PackOpener({ product }: { product: ProductDTO }) {
  const [theaterMode, setTheaterMode] = useState<"pack" | "box" | null>(null);
  const accent = product.accentHex ?? "#001F5B";

  const openTheater = async (mode: "pack" | "box") => {
    await packSounds.unlock();
    packSounds.playUiTap();
    setTheaterMode(mode);
  };

  return (
    <>
      <div className="pitch-panel overflow-hidden rounded-3xl">
        <div className="stadium-lights border-b border-white/10 px-5 py-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">
                Draft Eleven Theater
              </div>
              <h2 className="display mt-1 text-3xl text-ink md:text-4xl">Open {product.name}</h2>
              <p className="mt-2 max-w-xl text-sm text-ink-muted">
                Opens in a dedicated full-screen rip experience — one large card at a time, with
                suspense, foil, and sound.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openTheater("pack")}
                className="rounded-full bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950 transition hover:bg-pitch-400"
              >
                Rip 1 Pack
              </button>
              <button
                type="button"
                onClick={() => openTheater("box")}
                className="rounded-full border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold-soft transition hover:bg-gold/20"
              >
                Open Box
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[360px] flex-col items-center justify-center gap-6 px-4 py-10 md:px-8">
          <SealedPack
            accentHex={accent}
            manufacturer={product.manufacturer.name}
            brandLabel={product.brand?.name ?? product.manufacturer.name}
            subtitle={product.tournament?.name ?? product.league?.name ?? product.name}
            label="Sealed Hobby"
            state="idle"
          />
          <p className="max-w-md text-center text-sm text-ink-muted">
            The checklist stays on this page. Opening a pack or box takes you to a separate screen
            with the product centered, then reveals each card one by one.
          </p>
        </div>
      </div>

      {theaterMode ? (
        <PackOpeningTheater
          product={product}
          mode={theaterMode}
          onClose={() => setTheaterMode(null)}
        />
      ) : null}
    </>
  );
}
