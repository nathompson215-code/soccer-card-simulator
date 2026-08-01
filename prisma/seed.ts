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

const prisma = new PrismaClient();

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function estimateValueCents(rarity: Rarity, printRun: number | null, year: number) {
  const base: Record<Rarity, number> = {
    COMMON: 35,
    UNCOMMON: 250,
    RARE: 1200,
    ULTRA_RARE: 4500,
    MYTHIC: 18000,
    LEGENDARY: 75000,
  };
  let value = base[rarity];
  if (printRun === 1) value *= 25;
  else if (printRun && printRun <= 10) value *= 8;
  else if (printRun && printRun <= 25) value *= 4;
  else if (printRun && printRun <= 99) value *= 2;
  const ageBoost = Math.max(1, (2026 - year) * 0.03 + 1);
  return Math.round(value * ageBoost);
}

async function main() {
  // Wipe sample data for idempotent local seeding
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

  const user = await prisma.user.create({
    data: {
      email: "collector@drafteleven.local",
      displayName: "Demo Collector",
    },
  });

  const countries = await Promise.all(
    [
      ["AR", "Argentina"],
      ["PT", "Portugal"],
      ["FR", "France"],
      ["BR", "Brazil"],
      ["ES", "Spain"],
      ["ENG", "England"],
      ["NO", "Norway"],
      ["DE", "Germany"],
      ["US", "United States"],
      ["IT", "Italy"],
    ].map(([code, name]) => prisma.country.create({ data: { code, name } })),
  );
  const countryByCode = Object.fromEntries(countries.map((c) => [c.code, c]));

  const premier = await prisma.league.create({
    data: {
      slug: "premier-league",
      name: "Premier League",
      countryId: countryByCode.ENG.id,
    },
  });
  const laLiga = await prisma.league.create({
    data: {
      slug: "la-liga",
      name: "La Liga",
      countryId: countryByCode.ES.id,
    },
  });

  const clubs = await Promise.all(
    [
      ["inter-miami", "Inter Miami", premier.id, countryByCode.US.id],
      ["al-nassr", "Al Nassr", null, null],
      ["real-madrid", "Real Madrid", laLiga.id, countryByCode.ES.id],
      ["manchester-city", "Manchester City", premier.id, countryByCode.ENG.id],
      ["barcelona", "Barcelona", laLiga.id, countryByCode.ES.id],
      ["liverpool", "Liverpool", premier.id, countryByCode.ENG.id],
      ["bayern-munich", "Bayern Munich", null, countryByCode.DE.id],
      ["arsenal", "Arsenal", premier.id, countryByCode.ENG.id],
    ].map(([slug, name, leagueId, countryId]) =>
      prisma.club.create({
        data: {
          slug: slug as string,
          name: name as string,
          leagueId: (leagueId as string | null) ?? undefined,
          countryId: (countryId as string | null) ?? undefined,
        },
      }),
    ),
  );
  const clubBySlug = Object.fromEntries(clubs.map((c) => [c.slug, c]));

  const nationalTeams = await Promise.all(
    countries.map((c) =>
      prisma.nationalTeam.create({
        data: {
          slug: slugify(c.name),
          name: c.name,
          countryId: c.id,
          confederation:
            ["US", "ENG", "ES", "FR", "DE", "IT", "PT", "NO"].includes(c.code)
              ? c.code === "US"
                ? "CONCACAF"
                : "UEFA"
              : c.code === "BR" || c.code === "AR"
                ? "CONMEBOL"
                : null,
        },
      }),
    ),
  );
  const ntByName = Object.fromEntries(nationalTeams.map((n) => [n.name, n]));

  const playerDefs: Array<{
    name: string;
    country: string;
    club: string;
    position: Position;
    era: PlayerEra;
    birthYear: number;
  }> = [
    { name: "Lionel Messi", country: "Argentina", club: "inter-miami", position: "FWD", era: "LEGEND", birthYear: 1987 },
    { name: "Cristiano Ronaldo", country: "Portugal", club: "al-nassr", position: "FWD", era: "LEGEND", birthYear: 1985 },
    { name: "Kylian Mbappé", country: "France", club: "real-madrid", position: "FWD", era: "CURRENT", birthYear: 1998 },
    { name: "Erling Haaland", country: "Norway", club: "manchester-city", position: "FWD", era: "CURRENT", birthYear: 2000 },
    { name: "Vinícius Júnior", country: "Brazil", club: "real-madrid", position: "FWD", era: "CURRENT", birthYear: 2000 },
    { name: "Jude Bellingham", country: "England", club: "real-madrid", position: "MID", era: "CURRENT", birthYear: 2003 },
    { name: "Lamine Yamal", country: "Spain", club: "barcelona", position: "FWD", era: "ROOKIE", birthYear: 2007 },
    { name: "Mohamed Salah", country: "Egypt" as never, club: "liverpool", position: "FWD", era: "CURRENT", birthYear: 1992 },
    { name: "Aitana Bonmatí", country: "Spain", club: "barcelona", position: "MID", era: "CURRENT", birthYear: 1998 },
    { name: "Bukayo Saka", country: "England", club: "arsenal", position: "FWD", era: "CURRENT", birthYear: 2001 },
    { name: "Harry Kane", country: "England", club: "bayern-munich", position: "FWD", era: "CURRENT", birthYear: 1993 },
    { name: "Pedri", country: "Spain", club: "barcelona", position: "MID", era: "CURRENT", birthYear: 2002 },
  ];

  // Egypt not in country list — add it
  const egypt = await prisma.country.upsert({
    where: { code: "EG" },
    update: {},
    create: { code: "EG", name: "Egypt" },
  });
  const egyptNt = await prisma.nationalTeam.upsert({
    where: { slug: "egypt" },
    update: {},
    create: {
      slug: "egypt",
      name: "Egypt",
      countryId: egypt.id,
      confederation: "CAF",
    },
  });
  ntByName.Egypt = egyptNt;
  countryByCode.EG = egypt;

  const players = [];
  for (const def of playerDefs) {
    const country =
      def.country === "Egypt"
        ? egypt
        : countries.find((c) => c.name === def.country) ?? egypt;
    const nt = ntByName[def.country] ?? egyptNt;
    const parts = def.name.split(" ");
    players.push(
      await prisma.player.create({
        data: {
          slug: slugify(def.name),
          fullName: def.name,
          firstName: parts[0],
          lastName: parts.slice(1).join(" "),
          nationalityId: country.id,
          nationalTeamId: nt.id,
          clubId: clubBySlug[def.club].id,
          position: def.position,
          era: def.era,
          birthYear: def.birthYear,
        },
      }),
    );
  }

  const topps = await prisma.manufacturer.create({
    data: {
      slug: "topps",
      name: "Topps",
      foundedYear: 1938,
      country: "USA",
      colorHex: "#C8102E",
    },
  });
  const panini = await prisma.manufacturer.create({
    data: {
      slug: "panini",
      name: "Panini",
      foundedYear: 1961,
      country: "Italy",
      colorHex: "#003DA5",
    },
  });

  const chromeBrand = await prisma.brand.create({
    data: { slug: "chrome-ucl", name: "Chrome UCL", manufacturerId: topps.id },
  });
  const stickerBrand = await prisma.brand.create({
    data: {
      slug: "fifa-world-cup-stickers",
      name: "FIFA World Cup Stickers",
      manufacturerId: panini.id,
    },
  });
  const prizmBrand = await prisma.brand.create({
    data: {
      slug: "prizm-premier-league",
      name: "Prizm Premier League",
      manufacturerId: panini.id,
    },
  });

  const wc = await prisma.tournament.create({
    data: {
      slug: "fifa-world-cup",
      name: "FIFA World Cup",
      type: TournamentType.FIFA_WORLD_CUP,
    },
  });
  const ucl = await prisma.tournament.create({
    data: {
      slug: "uefa-champions-league",
      name: "UEFA Champions League",
      type: TournamentType.UEFA_CHAMPIONS_LEAGUE,
    },
  });

  type ProductSeed = {
    slug: string;
    name: string;
    manufacturerId: string;
    brandId: string;
    year: number;
    season: string;
    releaseYear: number;
    tournamentId?: string;
    leagueId?: string;
    format: ProductFormat;
    description: string;
    accentHex: string;
    featured: boolean;
    packsPerBox: number;
    cardsPerPack: number;
    baseCount: number;
  };

  const productSeeds: ProductSeed[] = [
    {
      slug: "topps-chrome-ucl-2024-25",
      name: "Topps Chrome UEFA Club Competitions 2024-25",
      manufacturerId: topps.id,
      brandId: chromeBrand.id,
      year: 2025,
      season: "2024-25",
      releaseYear: 2025,
      tournamentId: ucl.id,
      format: ProductFormat.HOBBY_BOX,
      description: "Flagship chrome product for European nights with refractors and hobby hits.",
      accentHex: "#001F5B",
      featured: true,
      packsPerBox: 20,
      cardsPerPack: 4,
      baseCount: 12,
    },
    {
      slug: "panini-wc-2022",
      name: "Panini Qatar 2022",
      manufacturerId: panini.id,
      brandId: stickerBrand.id,
      year: 2022,
      season: "2022",
      releaseYear: 2022,
      tournamentId: wc.id,
      format: ProductFormat.ALBUM,
      description: "Messi's crowning World Cup — sample sticker checklist for development.",
      accentHex: "#8E24AA",
      featured: true,
      packsPerBox: 100,
      cardsPerPack: 5,
      baseCount: 12,
    },
    {
      slug: "panini-prizm-pl-2023-24",
      name: "Panini Prizm Premier League 2023-24",
      manufacturerId: panini.id,
      brandId: prizmBrand.id,
      year: 2024,
      season: "2023-24",
      releaseYear: 2024,
      leagueId: premier.id,
      format: ProductFormat.HOBBY_BOX,
      description: "Silver prizms of Premier League stars — development sample set.",
      accentHex: "#38003C",
      featured: true,
      packsPerBox: 12,
      cardsPerPack: 5,
      baseCount: 12,
    },
  ];

  for (const seed of productSeeds) {
    const product = await prisma.product.create({
      data: {
        slug: seed.slug,
        name: seed.name,
        manufacturerId: seed.manufacturerId,
        brandId: seed.brandId,
        year: seed.year,
        season: seed.season,
        releaseYear: seed.releaseYear,
        tournamentId: seed.tournamentId,
        leagueId: seed.leagueId,
        format: seed.format,
        description: seed.description,
        accentHex: seed.accentHex,
        featured: seed.featured,
        packsPerBox: seed.packsPerBox,
        cardsPerPack: seed.cardsPerPack,
      },
    });

    await prisma.box.create({
      data: {
        productId: product.id,
        label: "Hobby / Retail Box",
        packsCount: seed.packsPerBox,
      },
    });

    for (let i = 0; i < seed.packsPerBox; i++) {
      await prisma.pack.create({
        data: {
          productId: product.id,
          label: `Pack ${i + 1}`,
          sortOrder: i + 1,
        },
      });
    }

    const baseSet = await prisma.cardSet.create({
      data: {
        productId: product.id,
        slug: "base",
        name: "Base Set",
        setType: SetType.BASE,
        sortOrder: 0,
      },
    });

    const inserts = await prisma.cardSet.create({
      data: {
        productId: product.id,
        slug: "net-marvels",
        name: "Net Marvels",
        setType: SetType.INSERT,
        sortOrder: 1,
      },
    });

    const autos = await prisma.cardSet.create({
      data: {
        productId: product.id,
        slug: "signature-stars",
        name: "Signature Stars",
        setType: SetType.AUTOGRAPH,
        sortOrder: 2,
      },
    });

    const relics = await prisma.cardSet.create({
      data: {
        productId: product.id,
        slug: "match-worn-patches",
        name: "Match-Worn Patches",
        setType: SetType.RELIC,
        sortOrder: 3,
      },
    });

    const baseParallels = await Promise.all(
      [
        {
          slug: "base",
          name: "Base",
          printRun: null,
          colorHex: "#E8E4D9",
          isFoil: false,
          rarity: Rarity.COMMON,
          cardType: CardType.BASE,
          weight: 1,
        },
        {
          slug: "silver",
          name: "Silver Parallel",
          printRun: 299,
          colorHex: "#C0C0C0",
          isFoil: true,
          rarity: Rarity.UNCOMMON,
          cardType: CardType.REFRACTOR,
          weight: 0.12,
        },
        {
          slug: "gold",
          name: "Gold Parallel",
          printRun: 99,
          colorHex: "#D4AF37",
          isFoil: true,
          rarity: Rarity.RARE,
          cardType: CardType.PARALLEL,
          weight: 0.05,
        },
        {
          slug: "superfractor",
          name: "Superfractor",
          printRun: 1,
          colorHex: "#FFD700",
          isFoil: true,
          rarity: Rarity.LEGENDARY,
          cardType: CardType.ONE_OF_ONE,
          weight: 0.001,
        },
      ].map((p) =>
        prisma.parallel.create({
          data: {
            productId: product.id,
            cardSetId: baseSet.id,
            ...p,
          },
        }),
      ),
    );

    const insertParallel = await prisma.parallel.create({
      data: {
        productId: product.id,
        cardSetId: inserts.id,
        slug: "insert-base",
        name: "Net Marvels",
        printRun: null,
        colorHex: seed.accentHex,
        isFoil: true,
        rarity: Rarity.RARE,
        cardType: CardType.INSERT,
        weight: 1,
      },
    });

    const autoParallel = await prisma.parallel.create({
      data: {
        productId: product.id,
        cardSetId: autos.id,
        slug: "on-card-auto",
        name: "On-Card Autograph",
        printRun: 99,
        colorHex: "#F5F5DC",
        isFoil: true,
        rarity: Rarity.MYTHIC,
        cardType: CardType.AUTOGRAPH,
        weight: 1,
      },
    });

    const relicParallel = await prisma.parallel.create({
      data: {
        productId: product.id,
        cardSetId: relics.id,
        slug: "patch",
        name: "Patch",
        printRun: 49,
        colorHex: "#8D6E63",
        isFoil: false,
        rarity: Rarity.MYTHIC,
        cardType: CardType.PATCH,
        weight: 1,
      },
    });

    const caseHits =
      seed.format === ProductFormat.ALBUM
        ? null
        : await prisma.cardSet.create({
            data: {
              productId: product.id,
              slug: "stadium-shockers",
              name: "Stadium Shockers",
              setType: SetType.CASE_HIT,
              sortOrder: 4,
            },
          });
    const booklets =
      seed.format === ProductFormat.ALBUM
        ? null
        : await prisma.cardSet.create({
            data: {
              productId: product.id,
              slug: "dual-booklets",
              name: "Dual Booklets",
              setType: SetType.BOOKLET,
              sortOrder: 5,
            },
          });
    const plates =
      seed.format === ProductFormat.ALBUM
        ? null
        : await prisma.cardSet.create({
            data: {
              productId: product.id,
              slug: "cyan-plates",
              name: "Cyan Plates",
              setType: SetType.PRINTING_PLATE,
              sortOrder: 6,
            },
          });
    const patchAutos =
      seed.format === ProductFormat.ALBUM
        ? null
        : await prisma.cardSet.create({
            data: {
              productId: product.id,
              slug: "inked-relics",
              name: "Inked Relics",
              setType: SetType.AUTOGRAPH,
              sortOrder: 7,
            },
          });

    const caseParallel = caseHits
      ? await prisma.parallel.create({
          data: {
            productId: product.id,
            cardSetId: caseHits.id,
            slug: "case-hit",
            name: "Case Hit",
            printRun: 10,
            colorHex: "#FFB300",
            isFoil: true,
            rarity: Rarity.LEGENDARY,
            cardType: CardType.CASE_HIT,
            weight: 1,
          },
        })
      : null;
    const bookletParallel = booklets
      ? await prisma.parallel.create({
          data: {
            productId: product.id,
            cardSetId: booklets.id,
            slug: "booklet",
            name: "Booklet",
            printRun: 25,
            colorHex: "#5D4037",
            isFoil: true,
            rarity: Rarity.ULTRA_RARE,
            cardType: CardType.BOOKLET,
            weight: 1,
          },
        })
      : null;
    const plateParallel = plates
      ? await prisma.parallel.create({
          data: {
            productId: product.id,
            cardSetId: plates.id,
            slug: "cyan-plate",
            name: "Cyan Plate",
            printRun: 1,
            colorHex: "#4FC3F7",
            isFoil: false,
            rarity: Rarity.LEGENDARY,
            cardType: CardType.PRINTING_PLATE,
            weight: 1,
          },
        })
      : null;
    const patchAutoParallel = patchAutos
      ? await prisma.parallel.create({
          data: {
            productId: product.id,
            cardSetId: patchAutos.id,
            slug: "patch-auto",
            name: "Patch Autograph",
            printRun: 25,
            colorHex: "#A1887F",
            isFoil: true,
            rarity: Rarity.MYTHIC,
            cardType: CardType.PATCH,
            weight: 1,
          },
        })
      : null;

    await prisma.packOddsRule.createMany({
      data: [
        {
          productId: product.id,
          cardSetId: inserts.id,
          label: "Insert per pack",
          scope: OddsScope.PER_PACK,
          expectedCount: seed.format === ProductFormat.ALBUM ? 0.15 : 0.45,
        },
        {
          productId: product.id,
          parallelId: baseParallels[1].id,
          label: "Parallel per pack",
          scope: OddsScope.PER_PACK,
          expectedCount: seed.format === ProductFormat.ALBUM ? 0.08 : 0.55,
        },
        {
          productId: product.id,
          cardSetId: autos.id,
          label: "Autograph per box",
          scope: OddsScope.PER_BOX,
          expectedCount: seed.format === ProductFormat.ALBUM ? 0 : 2,
        },
        {
          productId: product.id,
          cardSetId: relics.id,
          label: "Relic per box",
          scope: OddsScope.PER_BOX,
          expectedCount: seed.format === ProductFormat.ALBUM ? 0 : 1.5,
        },
      ],
    });

    // Base checklist: all sample players
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const entry = await prisma.checklistEntry.create({
        data: {
          cardSetId: baseSet.id,
          playerId: player.id,
          cardNumber: String(i + 1),
          sortOrder: i + 1,
        },
      });

      for (const parallel of baseParallels) {
        const card = await prisma.card.create({
          data: {
            checklistEntryId: entry.id,
            parallelId: parallel.id,
            slug: `${product.slug}__base__${i + 1}__${parallel.slug}`,
            estimatedValueCents: estimateValueCents(
              parallel.rarity,
              parallel.printRun,
              seed.year,
            ),
          },
        });
        if (parallel.printRun) {
          await prisma.numberingSpec.create({
            data: { cardId: card.id, printRun: parallel.printRun },
          });
        }
      }
    }

    // Insert / auto / relic checklists (subset of players)
    const hitPlayers = players.slice(0, 6);
    for (let i = 0; i < hitPlayers.length; i++) {
      const player = hitPlayers[i];

      const insertEntry = await prisma.checklistEntry.create({
        data: {
          cardSetId: inserts.id,
          playerId: player.id,
          cardNumber: `NM-${i + 1}`,
          sortOrder: i + 1,
        },
      });
      await prisma.card.create({
        data: {
          checklistEntryId: insertEntry.id,
          parallelId: insertParallel.id,
          slug: `${product.slug}__net-marvels__${i + 1}__insert-base`,
          estimatedValueCents: estimateValueCents(Rarity.RARE, null, seed.year),
        },
      });

      const autoEntry = await prisma.checklistEntry.create({
        data: {
          cardSetId: autos.id,
          playerId: player.id,
          cardNumber: `AU-${i + 1}`,
          sortOrder: i + 1,
        },
      });
      await prisma.autographSpec.create({
        data: { checklistEntryId: autoEntry.id, signerCount: 1, onCard: true },
      });
      const autoCard = await prisma.card.create({
        data: {
          checklistEntryId: autoEntry.id,
          parallelId: autoParallel.id,
          slug: `${product.slug}__signature-stars__${i + 1}__on-card-auto`,
          estimatedValueCents: estimateValueCents(Rarity.MYTHIC, 99, seed.year),
        },
      });
      await prisma.numberingSpec.create({
        data: { cardId: autoCard.id, printRun: 99 },
      });

      const relicEntry = await prisma.checklistEntry.create({
        data: {
          cardSetId: relics.id,
          playerId: player.id,
          cardNumber: `P-${i + 1}`,
          sortOrder: i + 1,
        },
      });
      await prisma.memorabiliaSpec.create({
        data: {
          checklistEntryId: relicEntry.id,
          memorabiliaType: MemorabiliaType.PATCH,
        },
      });
      const relicCard = await prisma.card.create({
        data: {
          checklistEntryId: relicEntry.id,
          parallelId: relicParallel.id,
          slug: `${product.slug}__match-worn-patches__${i + 1}__patch`,
          estimatedValueCents: estimateValueCents(Rarity.MYTHIC, 49, seed.year),
        },
      });
      await prisma.numberingSpec.create({
        data: { cardId: relicCard.id, printRun: 49 },
      });

      if (i < 3 && caseHits && caseParallel) {
        const caseEntry = await prisma.checklistEntry.create({
          data: {
            cardSetId: caseHits.id,
            playerId: player.id,
            cardNumber: `CH-${i + 1}`,
            sortOrder: i + 1,
          },
        });
        const caseCard = await prisma.card.create({
          data: {
            checklistEntryId: caseEntry.id,
            parallelId: caseParallel.id,
            slug: `${product.slug}__stadium-shockers__${i + 1}__case-hit`,
            estimatedValueCents: estimateValueCents(Rarity.LEGENDARY, 10, seed.year),
          },
        });
        await prisma.numberingSpec.create({ data: { cardId: caseCard.id, printRun: 10 } });
      }

      if (i < 2 && booklets && bookletParallel) {
        const bookletEntry = await prisma.checklistEntry.create({
          data: {
            cardSetId: booklets.id,
            playerId: player.id,
            cardNumber: `BK-${i + 1}`,
            sortOrder: i + 1,
          },
        });
        const bookletCard = await prisma.card.create({
          data: {
            checklistEntryId: bookletEntry.id,
            parallelId: bookletParallel.id,
            slug: `${product.slug}__dual-booklets__${i + 1}__booklet`,
            estimatedValueCents: estimateValueCents(Rarity.ULTRA_RARE, 25, seed.year),
          },
        });
        await prisma.numberingSpec.create({ data: { cardId: bookletCard.id, printRun: 25 } });
      }

      if (i < 2 && plates && plateParallel) {
        const plateEntry = await prisma.checklistEntry.create({
          data: {
            cardSetId: plates.id,
            playerId: player.id,
            cardNumber: `PL-${i + 1}`,
            sortOrder: i + 1,
          },
        });
        const plateCard = await prisma.card.create({
          data: {
            checklistEntryId: plateEntry.id,
            parallelId: plateParallel.id,
            slug: `${product.slug}__cyan-plates__${i + 1}__cyan-plate`,
            estimatedValueCents: estimateValueCents(Rarity.LEGENDARY, 1, seed.year),
          },
        });
        await prisma.numberingSpec.create({ data: { cardId: plateCard.id, printRun: 1 } });
      }

      if (i < 2 && patchAutos && patchAutoParallel) {
        const paEntry = await prisma.checklistEntry.create({
          data: {
            cardSetId: patchAutos.id,
            playerId: player.id,
            cardNumber: `PA-${i + 1}`,
            sortOrder: i + 1,
          },
        });
        await prisma.autographSpec.create({
          data: { checklistEntryId: paEntry.id, signerCount: 1, onCard: true },
        });
        await prisma.memorabiliaSpec.create({
          data: {
            checklistEntryId: paEntry.id,
            memorabiliaType: MemorabiliaType.PATCH,
          },
        });
        const paCard = await prisma.card.create({
          data: {
            checklistEntryId: paEntry.id,
            parallelId: patchAutoParallel.id,
            slug: `${product.slug}__inked-relics__${i + 1}__patch-auto`,
            estimatedValueCents: estimateValueCents(Rarity.MYTHIC, 25, seed.year),
          },
        });
        await prisma.numberingSpec.create({ data: { cardId: paCard.id, printRun: 25 } });
      }
    }
  }

  const counts = {
    users: await prisma.user.count(),
    manufacturers: await prisma.manufacturer.count(),
    products: await prisma.product.count(),
    players: await prisma.player.count(),
    cards: await prisma.card.count(),
    checklistEntries: await prisma.checklistEntry.count(),
  };

  console.log("Seed complete:", counts);
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
