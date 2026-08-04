import {
  CardType,
  MemorabiliaType,
  OddsScope,
  Position,
  PrismaClient,
  ProductFormat,
  Rarity,
  SetType,
  TournamentType,
  PlayerEra,
} from "@prisma/client";
import { listProductConfigSlugs, loadProductConfig, slugifyName } from "../src/lib/product-config";
import { assignSerialFromId } from "../src/lib/card-serial";
import { estimateValueCents } from "../src/lib/pricing";

const prisma = new PrismaClient();

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina",
  PT: "Portugal",
  FR: "France",
  BR: "Brazil",
  ES: "Spain",
  ENG: "England",
  NO: "Norway",
  DE: "Germany",
  US: "United States",
  IT: "Italy",
  NL: "Netherlands",
  BE: "Belgium",
  PL: "Poland",
  TR: "Turkey",
  EG: "Egypt",
  CI: "Côte d'Ivoire",
  GE: "Georgia",
  UY: "Uruguay",
  NG: "Nigeria",
  SE: "Sweden",
  MA: "Morocco",
  RS: "Serbia",
  HU: "Hungary",
  HR: "Croatia",
  GN: "Guinea",
  KR: "South Korea",
  SA: "Saudi Arabia",
  DK: "Denmark",
  IE: "Ireland",
  UA: "Ukraine",
  CM: "Cameroon",
  EC: "Ecuador",
  SN: "Senegal",
  JP: "Japan",
  CO: "Colombia",
};

async function wipe() {
  await prisma.showcaseItem.deleteMany();
  await prisma.binderSlot.deleteMany();
  await prisma.binderPage.deleteMany();
  await prisma.binder.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.userCard.deleteMany();
  await prisma.numberingSpec.deleteMany();
  await prisma.autographSpec.deleteMany();
  await prisma.memorabiliaSpec.deleteMany();
  await prisma.card.deleteMany();
  await prisma.checklistEntry.deleteMany();
  await prisma.packOddsRule.deleteMany();
  await prisma.parallel.deleteMany();
  await prisma.pack.deleteMany();
  await prisma.box.deleteMany();
  await prisma.cardSet.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.manufacturer.deleteMany();
  await prisma.player.deleteMany();
  await prisma.club.deleteMany();
  await prisma.nationalTeam.deleteMany();
  await prisma.league.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.country.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await wipe();

  const user = await prisma.user.create({
    data: {
      email: "collector@drafteleven.local",
      displayName: "Demo Collector",
    },
  });

  const slugs = listProductConfigSlugs().sort();
  if (slugs.length === 0) {
    throw new Error("No product configs found under data/products/");
  }

  const countryByCode: Record<string, { id: string; code: string; name: string }> = {};
  const leagueBySlug: Record<string, { id: string; slug: string }> = {};
  const clubBySlug: Record<string, { id: string; slug: string }> = {};
  const ntByCode: Record<string, { id: string }> = {};
  const playerBySlug: Record<string, { id: string; slug: string }> = {};
  const manufacturerBySlug: Record<string, { id: string; slug: string }> = {};
  const brandBySlug: Record<string, { id: string; slug: string }> = {};
  const tournamentBySlug: Record<string, { id: string; slug: string }> = {};

  let totalCards = 0;
  let totalPlayersCreated = 0;
  let totalProducts = 0;

  for (const slug of slugs) {
    const cfg = loadProductConfig(slug);
    if (!cfg) continue;
    const { product: p, players: roster, sets: setsCfg } = cfg;

    for (const club of roster.clubs) {
      if (!countryByCode[club.country]) {
        countryByCode[club.country] = await prisma.country.create({
          data: {
            code: club.country,
            name: COUNTRY_NAMES[club.country] ?? club.country,
          },
        });
      }
    }
    for (const player of roster.players) {
      if (!countryByCode[player.country]) {
        countryByCode[player.country] = await prisma.country.create({
          data: {
            code: player.country,
            name: COUNTRY_NAMES[player.country] ?? player.country,
          },
        });
      }
    }

    const ensureLeague = async (leagueSlug: string, name: string, countryCode?: string) => {
      if (leagueBySlug[leagueSlug]) return leagueBySlug[leagueSlug];
      const created = await prisma.league.create({
        data: {
          slug: leagueSlug,
          name,
          countryId: countryCode ? countryByCode[countryCode]?.id : undefined,
        },
      });
      leagueBySlug[leagueSlug] = created;
      return created;
    };

    // Common leagues referenced by club.league
    if (roster.clubs.some((c) => c.league === "premier-league") || p.league?.slug === "premier-league") {
      await ensureLeague("premier-league", "Premier League", "ENG");
    }
    if (roster.clubs.some((c) => c.league === "la-liga")) {
      await ensureLeague("la-liga", "La Liga", "ES");
    }
    if (p.league && !leagueBySlug[p.league.slug]) {
      await ensureLeague(p.league.slug, p.league.name, "ENG");
    }

    for (const club of roster.clubs) {
      if (clubBySlug[club.slug]) continue;
      clubBySlug[club.slug] = await prisma.club.create({
        data: {
          slug: club.slug,
          name: club.name,
          countryId: countryByCode[club.country]?.id,
          leagueId: club.league ? leagueBySlug[club.league]?.id : undefined,
        },
      });
    }

    for (const c of Object.values(countryByCode)) {
      if (ntByCode[c.code]) continue;
      ntByCode[c.code] = await prisma.nationalTeam.create({
        data: {
          slug: slugifyName(c.name),
          name: c.name,
          countryId: c.id,
        },
      });
    }

    for (const def of roster.players) {
      const playerSlug = slugifyName(def.name);
      if (playerBySlug[playerSlug]) continue;
      const parts = def.name.split(" ");
      playerBySlug[playerSlug] = await prisma.player.create({
        data: {
          slug: playerSlug,
          fullName: def.name,
          firstName: parts[0],
          lastName: parts.slice(1).join(" "),
          nationalityId: countryByCode[def.country]?.id,
          nationalTeamId: ntByCode[def.country]?.id,
          clubId: clubBySlug[def.club]?.id,
          position: def.position as Position,
          era: def.era as PlayerEra,
          birthYear: def.birthYear,
        },
      });
      totalPlayersCreated += 1;
    }

    const tierByPlayerId = Object.fromEntries(
      roster.players.map((def) => [playerBySlug[slugifyName(def.name)]?.id, def.tier]),
    );

    if (!manufacturerBySlug[p.manufacturer.slug]) {
      manufacturerBySlug[p.manufacturer.slug] = await prisma.manufacturer.create({
        data: {
          slug: p.manufacturer.slug,
          name: p.manufacturer.name,
          foundedYear: p.manufacturer.foundedYear,
          country: p.manufacturer.country,
          colorHex: p.manufacturer.colorHex,
        },
      });
    }
    const manufacturer = manufacturerBySlug[p.manufacturer.slug];

    if (!brandBySlug[p.brand.slug]) {
      brandBySlug[p.brand.slug] = await prisma.brand.create({
        data: {
          slug: p.brand.slug,
          name: p.brand.name,
          manufacturerId: manufacturer.id,
        },
      });
    }
    const brand = brandBySlug[p.brand.slug];

    if (!tournamentBySlug[p.tournament.slug]) {
      tournamentBySlug[p.tournament.slug] = await prisma.tournament.create({
        data: {
          slug: p.tournament.slug,
          name: p.tournament.name,
          type: p.tournament.type as TournamentType,
        },
      });
    }
    const tournament = tournamentBySlug[p.tournament.slug];

    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        manufacturerId: manufacturer.id,
        brandId: brand.id,
        year: p.year,
        season: p.season,
        releaseYear: p.releaseYear,
        tournamentId: tournament.id,
        leagueId: p.league ? leagueBySlug[p.league.slug]?.id : undefined,
        format: p.format as ProductFormat,
        description: p.description,
        accentHex: p.accentHex,
        featured: p.featured,
        packsPerBox: p.box.packsPerBox,
        cardsPerPack: p.box.cardsPerPack,
      },
    });

    await prisma.box.create({
      data: {
        productId: product.id,
        label: "Hobby Box",
        packsCount: p.box.packsPerBox,
      },
    });

    for (let i = 0; i < p.box.packsPerBox; i++) {
      await prisma.pack.create({
        data: {
          productId: product.id,
          label: `Pack ${i + 1}`,
          sortOrder: i + 1,
        },
      });
    }

    const allPlayersSorted = [...roster.players].sort((a, b) => a.name.localeCompare(b.name));

    const filterPlayers = (filter: {
      all?: boolean;
      tiers?: string[];
      limit?: number;
    }) => {
      let list = allPlayersSorted;
      if (!filter.all && filter.tiers?.length) {
        list = list.filter((pl) => filter.tiers!.includes(pl.tier));
      }
      if (filter.limit) list = list.slice(0, filter.limit);
      return list;
    };

    for (const setDef of setsCfg.sets) {
      const cardSet = await prisma.cardSet.create({
        data: {
          productId: product.id,
          slug: setDef.slug,
          name: setDef.name,
          setType: setDef.setType as SetType,
          sortOrder: setDef.sortOrder,
        },
      });

      const parallelDefs =
        setDef.parallels === "baseParallels"
          ? setsCfg.baseParallels
          : setDef.setParallels?.length
            ? setDef.setParallels
            : setDef.parallel
              ? [setDef.parallel]
              : [];

      const parallels = [];
      for (const par of parallelDefs) {
        parallels.push(
          await prisma.parallel.create({
            data: {
              productId: product.id,
              cardSetId: cardSet.id,
              slug: par.slug,
              name: par.name,
              printRun: par.printRun,
              colorHex: par.colorHex,
              isFoil: par.isFoil,
              rarity: par.rarity as Rarity,
              cardType: par.cardType as CardType,
              weight: par.weight,
            },
          }),
        );
      }

      const setPlayers = filterPlayers(setDef.playerFilter);
      let number = 1;
      for (const def of setPlayers) {
        const player = playerBySlug[slugifyName(def.name)];
        if (!player) continue;
        const entry = await prisma.checklistEntry.create({
          data: {
            cardSetId: cardSet.id,
            playerId: player.id,
            cardNumber: String(number).padStart(3, "0"),
            sortOrder: number,
            notes: `tier:${def.tier}`,
          },
        });

        if (setDef.autograph) {
          await prisma.autographSpec.create({
            data: { checklistEntryId: entry.id, signerCount: 1, onCard: true },
          });
        }
        if (setDef.memorabilia) {
          await prisma.memorabiliaSpec.create({
            data: {
              checklistEntryId: entry.id,
              memorabiliaType: setDef.memorabilia as MemorabiliaType,
            },
          });
        }

        for (const parallel of parallels) {
          const cardSlug = `${product.slug}__${setDef.slug}__${number}__${parallel.slug}`;
          const assignedSerial = parallel.printRun
            ? assignSerialFromId(cardSlug, parallel.printRun)
            : null;
          const card = await prisma.card.create({
            data: {
              checklistEntryId: entry.id,
              parallelId: parallel.id,
              slug: cardSlug,
              assignedSerial,
              estimatedValueCents: estimateValueCents(
                parallel.rarity,
                parallel.printRun,
                p.year,
                tierByPlayerId[player.id],
              ),
            },
          });
          if (parallel.printRun) {
            await prisma.numberingSpec.create({
              data: { cardId: card.id, printRun: parallel.printRun },
            });
          }
          totalCards += 1;
        }
        number += 1;
      }
    }

    for (const rule of p.oddsLabels) {
      await prisma.packOddsRule.create({
        data: {
          productId: product.id,
          label: rule.label,
          scope: rule.scope as OddsScope,
          expectedCount: rule.expectedCount,
        },
      });
    }

    totalProducts += 1;
  }

  console.log("Seed complete:", {
    users: 1,
    products: totalProducts,
    players: totalPlayersCreated,
    cards: totalCards,
    configs: slugs,
  });
  console.log("Demo user:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
