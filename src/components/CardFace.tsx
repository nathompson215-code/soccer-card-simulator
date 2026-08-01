"use client";

import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { TradingCardArt } from "@/components/TradingCardArt";
import { hasAuthorizedCardArt, imageSrcSet } from "@/lib/assets";
import { resolveCardVisual } from "@/lib/card-visual";
import type { CardDTO, Celebration } from "@/lib/types";

interface CardFaceProps {
  card: CardDTO;
  serialDisplay?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  celebration?: Celebration;
  onClick?: () => void;
  className?: string;
  href?: string;
  interactiveFoil?: boolean;
  revealActive?: boolean;
  /** Allow flipping between front and authorized (or generated) back. */
  enableFlip?: boolean;
  /** Click / button opens a high-resolution zoom overlay. */
  enableZoom?: boolean;
  /** Prefer HD assets when available (detail / zoom). */
  preferHd?: boolean;
  /** Start showing the reverse face. */
  initialFace?: "front" | "back";
}

const SIZE_WIDTH: Record<NonNullable<CardFaceProps["size"]>, string> = {
  sm: "w-[132px]",
  md: "w-[180px]",
  lg: "w-[240px]",
  xl: "w-[min(92vw,360px)]",
};

export function CardFace({
  card,
  serialDisplay,
  size = "md",
  celebration = "none",
  onClick,
  className = "",
  interactiveFoil = false,
  revealActive = false,
  enableFlip = false,
  enableZoom = false,
  preferHd = false,
  initialFace = "front",
}: CardFaceProps) {
  const visual = resolveCardVisual(card, celebration);
  const [face, setFace] = useState<"front" | "back">(initialFace);
  const [zoomed, setZoomed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasArt = hasAuthorizedCardArt(card.frontImageUrl) && !photoFailed;
  const showPhoto = hasArt && face === "front";
  const showPhotoBack = hasArt && face === "back" && Boolean(card.backImageUrl);

  useEffect(() => {
    setPhotoFailed(false);
    setImageLoaded(false);
    setFace(initialFace);
  }, [card.id, card.frontImageUrl, initialFace]);

  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(40);
  const smx = useSpring(mx, { stiffness: 180, damping: 22 });
  const smy = useSpring(my, { stiffness: 180, damping: 22 });
  const shine = useMotionTemplate`radial-gradient(460px circle at ${smx}% ${smy}%, rgba(255,255,255,0.42), transparent 42%)`;
  const tiltX = useSpring(0, { stiffness: 200, damping: 20 });
  const tiltY = useSpring(0, { stiffness: 200, damping: 20 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!interactiveFoil || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    mx.set(px);
    my.set(py);
    tiltY.set((px - 50) / 4);
    tiltX.set((50 - py) / 5);
  };

  const onLeave = () => {
    mx.set(50);
    my.set(40);
    tiltX.set(0);
    tiltY.set(0);
  };

  const borderClass =
    celebration === "jackpot" || visual.borderTone === "rainbow"
      ? "hit-pulse border-gold card-frame-jackpot"
      : celebration === "hit" || visual.borderTone === "gold" || visual.borderTone === "case"
        ? "hit-pulse border-gold"
        : visual.borderTone === "metal" || celebration === "foil"
          ? "border-sky-300/50 card-frame-foil"
          : visual.borderTone === "plate"
            ? "border-cyan-200/40"
            : celebration === "glow"
              ? "border-pitch-400/60"
              : "border-white/20";

  const handlePrimaryClick = () => {
    if (enableZoom) {
      setZoomed(true);
      return;
    }
    onClick?.();
  };

  const frontSrc =
    preferHd && card.frontImageUrlHd ? card.frontImageUrlHd : card.frontImageUrl;
  const backSrc =
    preferHd && card.backImageUrlHd ? card.backImageUrlHd : card.backImageUrl;
  const frontSrcSet = imageSrcSet(card.frontImageUrl, card.frontImageUrlHd);
  const backSrcSet = imageSrcSet(card.backImageUrl, card.backImageUrlHd);

  return (
    <>
      <div className={`relative ${SIZE_WIDTH[size]} shrink-0 ${className}`}>
        <motion.div
          ref={ref}
          role={onClick || enableZoom ? "button" : undefined}
          tabIndex={onClick || enableZoom ? 0 : undefined}
          onClick={handlePrimaryClick}
          onKeyDown={
            onClick || enableZoom
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handlePrimaryClick();
                  }
                }
              : undefined
          }
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          whileHover={
            (onClick || enableZoom) && !interactiveFoil ? { y: -6 } : undefined
          }
          style={
            interactiveFoil
              ? { rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }
              : { transformStyle: "preserve-3d" }
          }
          animate={{ rotateY: face === "back" ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          className={`relative aspect-[5/7] w-full text-left ${
            onClick || enableZoom ? "cursor-pointer" : ""
          }`}
        >
          {/* Front */}
          <div
            className={`absolute inset-0 overflow-hidden rounded-[14px] border shadow-2xl transition ${borderClass} ${
              revealActive ? "card-reveal-pop" : ""
            }`}
            style={{ backfaceVisibility: "hidden" }}
          >
            {showPhoto ? (
              <AuthorizedCardImage
                src={frontSrc!}
                srcSet={frontSrcSet}
                alt={`${card.playerName} — ${card.parallelName}`}
                loaded={imageLoaded}
                onLoad={() => setImageLoaded(true)}
                onError={() => setPhotoFailed(true)}
              />
            ) : face === "front" ? (
              <TradingCardArt
                card={card}
                visual={visual}
                serialDisplay={serialDisplay}
                compact={size === "sm"}
              />
            ) : null}

            {face === "front" ? (
              <>
                {visual.showFoil && showPhoto ? (
                  <>
                    <div className="foil-prism pointer-events-none absolute inset-0 z-30 opacity-30 mix-blend-color-dodge" />
                    <div className="foil-shine pointer-events-none absolute inset-0 z-30 mix-blend-screen opacity-40" />
                  </>
                ) : null}
                {visual.showFoil && !showPhoto ? (
                  <>
                    <div className="foil-prism pointer-events-none absolute inset-0 z-30 opacity-45 mix-blend-color-dodge" />
                    <div className="foil-shine pointer-events-none absolute inset-0 z-30 mix-blend-screen opacity-65" />
                  </>
                ) : null}
                {visual.showChrome ? (
                  <div className="d11-chrome-sheen pointer-events-none absolute inset-0 z-30 opacity-50" />
                ) : null}
                {visual.showHolo ? (
                  <div className="d11-holo-wave pointer-events-none absolute inset-0 z-30 opacity-40 mix-blend-overlay" />
                ) : null}
                {interactiveFoil && (visual.showFoil || visual.showChrome || visual.showHolo) ? (
                  <motion.div
                    className="pointer-events-none absolute inset-0 z-30 mix-blend-soft-light"
                    style={{ background: shine }}
                  />
                ) : null}
                {(celebration === "jackpot" || celebration === "hit") && (
                  <div className="pointer-events-none absolute inset-0 z-30 card-sparkle opacity-70" />
                )}
              </>
            ) : null}
          </div>

          {/* Back */}
          <div
            className={`absolute inset-0 overflow-hidden rounded-[14px] border shadow-2xl ${borderClass}`}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {showPhotoBack ? (
              <AuthorizedCardImage
                src={backSrc!}
                srcSet={backSrcSet}
                alt={`${card.playerName} — card back`}
                loaded={imageLoaded}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  /* keep generated back */
                }}
              />
            ) : (
              <GeneratedCardBack card={card} />
            )}
          </div>
        </motion.div>

        {enableFlip || enableZoom ? (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {enableFlip ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFace((f) => (f === "front" ? "back" : "front"));
                  setImageLoaded(false);
                }}
                className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink hover:border-white/30"
              >
                {face === "front" ? "Flip to back" : "Flip to front"}
              </button>
            ) : null}
            {enableZoom ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed(true);
                }}
                className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink hover:border-white/30"
              >
                Zoom
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {zoomed ? (
          <motion.div
            key="zoom"
            role="dialog"
            aria-modal="true"
            aria-label="Card zoom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="relative max-h-[92vh] w-full max-w-[420px]"
              onClick={(e) => e.stopPropagation()}
            >
              <CardFace
                card={card}
                serialDisplay={serialDisplay}
                size="xl"
                celebration={celebration}
                enableFlip
                preferHd
                interactiveFoil={celebration !== "none"}
                initialFace={face}
              />
              <button
                type="button"
                onClick={() => setZoomed(false)}
                className="absolute -right-1 -top-10 rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function AuthorizedCardImage({
  src,
  srcSet,
  alt,
  loaded,
  onLoad,
  onError,
}: {
  src: string;
  srcSet?: string;
  alt: string;
  loaded: boolean;
  onLoad: () => void;
  onError: () => void;
}) {
  return (
    <div className="relative h-full w-full bg-pitch-900">
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-pitch-800 via-pitch-900 to-pitch-950" />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        srcSet={srcSet}
        sizes="(max-width: 768px) 60vw, 360px"
        alt={alt}
        decoding="async"
        loading="lazy"
        onLoad={onLoad}
        onError={onError}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
      />
    </div>
  );
}

function GeneratedCardBack({ card }: { card: CardDTO }) {
  return (
    <div className="card-back relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 pack-hologram opacity-80" />
      <div className="foil-shine absolute inset-0 mix-blend-screen opacity-50" />
      <div className="absolute inset-[6%] rounded-xl border border-white/15" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="display text-4xl text-white/85">D11</div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/45">
            Draft Eleven
          </div>
          <div className="mt-4 max-w-[10rem] text-[10px] text-white/55">{card.playerName}</div>
        </div>
      </div>
    </div>
  );
}
