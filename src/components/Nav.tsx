"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/products", label: "Products" },
  { href: "/cards", label: "Cards" },
  { href: "/players", label: "Players" },
  { href: "/collection", label: "Collection" },
];

export function Nav() {
  const pathname = usePathname();
  const [ownedCount, setOwnedCount] = useState(0);

  useEffect(() => {
    fetch("/api/collection")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.totalOwned != null) setOwnedCount(data.totalOwned);
      })
      .catch(() => undefined);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07110d]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-pitch-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(34,160,107,0.45)] transition group-hover:scale-105">
            SC
          </span>
          <div className="leading-tight">
            <div className="display text-2xl tracking-[0.08em] text-ink">STRIKER CARDS</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">
              Soccer Collection Simulator
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 text-ink"
                    : "text-ink-muted hover:bg-white/5 hover:text-ink"
                }`}
              >
                {link.label}
                {link.href === "/collection" && ownedCount > 0 ? (
                  <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold-soft">
                    {ownedCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/products"
          className="rounded-full bg-pitch-500 px-4 py-2 text-sm font-semibold text-pitch-950 transition hover:bg-pitch-400"
        >
          Open Packs
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                active ? "bg-white/10 text-ink" : "text-ink-muted"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
