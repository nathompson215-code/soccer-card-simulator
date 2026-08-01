import Link from "next/link";
import { notFound } from "next/navigation";
import { CardFace } from "@/components/CardFace";
import { getPlayerBySlug, listCards } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  if (!player) notFound();

  const { cards } = await listCards({ playerSlug: slug, limit: 48 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Link href="/players" className="text-sm text-pitch-400">
        ← All players
      </Link>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">
          {player.position} · {player.era}
        </div>
        <h1 className="display mt-2 text-5xl text-ink md:text-6xl">{player.fullName}</h1>
        <p className="mt-3 text-ink-muted">
          {[player.clubName, player.nationalTeamName, player.leagueName, player.birthYear]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-2 text-sm text-ink-muted">{player.cardCount} cards in the database</p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {cards.map((card) => (
          <Link key={card.id} href={`/cards/${card.slug}`} className="mx-auto">
            <CardFace card={card} size="sm" />
          </Link>
        ))}
      </div>
    </div>
  );
}
