import Link from "next/link";
import { listPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const players = await listPlayers(params.q, 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Roster</div>
        <h1 className="display mt-2 text-5xl text-ink">Players</h1>
        <p className="mt-3 text-ink-muted">
          Player records come from PostgreSQL and link to every checklist entry and card variation.
        </p>
      </div>

      <form className="mb-8 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search players, clubs, nations..."
          className="min-w-[240px] flex-1 rounded-full border border-white/10 bg-pitch-900 px-4 py-3 text-sm text-ink outline-none focus:border-pitch-400"
        />
        <button
          type="submit"
          className="rounded-full bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950"
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-pitch-900/80 text-xs uppercase tracking-[0.16em] text-ink-muted">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3">Nation</th>
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3">Cards</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link href={`/players/${player.slug}`} className="font-medium text-ink">
                    {player.fullName}
                  </Link>
                  <div className="text-xs text-ink-muted">{player.era}</div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{player.clubName ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{player.nationalTeamName ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{player.position}</td>
                <td className="px-4 py-3 text-ink">{player.cardCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
