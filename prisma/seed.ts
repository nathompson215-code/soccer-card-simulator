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

const prisma = new PrismaClient();

function estimateValueCents(rarity: Rarity, printRun: number | null, year: number, tier?: string) {
  const base: Record<Rarity, number> = {
    COMMON: 35,
    UNCOMMON: 275,
    RARE: 1400,
    ULTRA_RARE: 5200,
    MYTHIC: 22000,
    LEGENDARY: 90000,
  };
  let value = base[rarity];
  if (printRun === 1) value *= 28;
  else if (printRun && printRun <= 10) value *= 9;
  else if (printRun && printRun <= 25) value *= 4.5;
  else if (printRun && printRun <= 99) value *= 2.2;
  else if (printRun && printRun <= 299) value *= 1.35;

  const tierBoost: Record<string, number> = {
    legend: 1.8,
    star: 1.45,
    rookie: 1.35,
    veteran: 1.15,
    common: 1,
  };
  value *= tierBoost[tier ?? "common"] ?? 1;
  const ageBoost = Math.max(1, (2026 - year) * 0.03 + 1);
  return Math.round(value * ageBoost);
}

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

  const slugs = listProductConfigSlugs();
  if (slugs.length === 0) {
    throw new Error("No product configs found under data/products/");
  }

  let totalCards = 0;
  let totalPlayers = 0;
  let totalProducts = 0;

  for (const slug of slugs) {
    const cfg = loadProductConfig(slug);
    if (!cfg) continue;
    const { product: p, players: roster, sets: setsCfg } = cfg;

    const countryCodes = new Set<string>();
    for (const club of roster.clubs) countryCodes.add(club.country);
    for (const player of roster.players) countryCodes.add(player.country);

    const countryNameFallback: Record<string, string> = {
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
    };

    const countries = [];
    for (const code of countryCodes) {
      countries.push(
        await prisma.country.create({
          data: {
            code,
            name: countryNameFallback[code] ?? code,
          },
        }),
      );
    }
    const countryByCode = Object.fromEntries(countries.map((c) => [c.code, c]));

    const premier = await prisma.league.create({
      data: {
        slug: "premier-league",
        name: "Premier League",
        countryId: countryByCode.ENG?.id,
      },
    });
    const laLiga = await prisma.league.create({
      data: {
        slug: "la-liga",
        name: "La Liga",
        countryId: countryByCode.ES?.id,
      },
    });
    const leagueBySlug: Record<string, string> = {
      "premier-league": premier.id,
      "la-liga": laLiga.id,
    };

    const clubs = [];
    for (const club of roster.clubs) {
      clubs.push(
        await prisma.club.create({
          data: {
            slug: club.slug,
            name: club.name,
            countryId: countryByCode[club.country]?.id,
            leagueId: club.league ? leagueBySlug[club.league] : undefined,
          },
        }),
      );
    }
    const clubBySlug = Object.fromEntries(clubs.map((c) => [c.slug, c]));

    const ntByCode: Record<string, { id: string }> = {};
    for (const c of countries) {
      const nt = await prisma.nationalTeam.create({
        data: {
          slug: slugifyName(c.name),
          name: c.name,
          countryId: c.id,
        },
      });
      ntByCode[c.code] = nt;
    }

    const players = [];
    for (const def of roster.players) {
      const parts = def.name.split(" ");
      const playerSlug = slugifyName(def.name);
      players.push(
        await prisma.player.create({
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
        }),
      );
    }
    const playerBySlug = Object.fromEntries(players.map((pl) => [pl.slug, pl]));
    const tierByPlayerId = Object.fromEntries(
      roster.players.map((def) => [playerBySlug[slugifyName(def.name)]?.id, def.tier]),
    );

    const manufacturer = await prisma.manufacturer.create({
      data: {
        slug: p.manufacturer.slug,
        name: p.manufacturer.name,
        foundedYear: p.manufacturer.foundedYear,
        country: p.manufacturer.country,
        colorHex: p.manufacturer.colorHex,
      },
    });

    const brand = await prisma.brand.create({
      data: {
        slug: p.brand.slug,
        name: p.brand.name,
        manufacturerId: manufacturer.id,
      },
    });

    const tournament = await prisma.tournament.create({
      data: {
        slug: p.tournament.slug,
        name: p.tournament.name,
        type: p.tournament.type as TournamentType,
      },
    });

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
          const card = await prisma.card.create({
            data: {
              checklistEntryId: entry.id,
              parallelId: parallel.id,
              slug: cardSlug,
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

      // Odds rules linked when labels match set pools
      if (setDef.setType === "INSERT" && setDef.slug === "wonderkids") {
        // primary insert odds attached once below
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

    totalPlayers += players.length;
    totalProducts += 1;
  }

  console.log("Seed complete:", {
    users: 1,
    products: totalProducts,
    players: totalPlayers,
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
