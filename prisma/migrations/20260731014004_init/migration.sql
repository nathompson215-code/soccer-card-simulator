-- CreateEnum
CREATE TYPE "TournamentType" AS ENUM ('FIFA_WORLD_CUP', 'FIFA_WOMENS_WORLD_CUP', 'UEFA_EURO', 'COPA_AMERICA', 'UEFA_CHAMPIONS_LEAGUE', 'UEFA_EUROPA_LEAGUE', 'UEFA_CONFERENCE_LEAGUE', 'FIFA_CLUB_WORLD_CUP', 'OLYMPIC_FOOTBALL', 'DOMESTIC_LEAGUE', 'OTHER');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'DEF', 'MID', 'FWD');

-- CreateEnum
CREATE TYPE "PlayerEra" AS ENUM ('LEGEND', 'MODERN', 'CURRENT', 'ROOKIE', 'PROSPECT');

-- CreateEnum
CREATE TYPE "ProductFormat" AS ENUM ('HOBBY_BOX', 'BLASTER', 'RETAIL_BOX', 'MEGA_BOX', 'HANGER', 'FAT_PACK', 'ALBUM', 'STARTER_PACK', 'SPECIAL_EDITION');

-- CreateEnum
CREATE TYPE "SetType" AS ENUM ('BASE', 'INSERT', 'PARALLEL_SET', 'SP', 'SSP', 'CASE_HIT', 'IMAGE_VARIATION', 'AUTOGRAPH', 'RELIC', 'BOOKLET', 'PRINTING_PLATE', 'OTHER');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'ULTRA_RARE', 'MYTHIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('BASE', 'INSERT', 'PARALLEL', 'REFRACTOR', 'SP', 'SSP', 'CASE_HIT', 'IMAGE_VARIATION', 'AUTOGRAPH', 'DUAL_AUTOGRAPH', 'TRIPLE_AUTOGRAPH', 'QUAD_AUTOGRAPH', 'PATCH', 'JUMBO_PATCH', 'RELIC', 'MEMORABILIA', 'BOOKLET', 'PRINTING_PLATE', 'ONE_OF_ONE', 'SHIELD_PATCH', 'LOGO_PATCH', 'LAUNDRY_TAG', 'CLEAT_RELIC');

-- CreateEnum
CREATE TYPE "MemorabiliaType" AS ENUM ('PATCH', 'JUMBO_PATCH', 'RELIC', 'MEMORABILIA', 'SHIELD_PATCH', 'LOGO_PATCH', 'LAUNDRY_TAG', 'CLEAT_RELIC', 'BOOKLET', 'PRINTING_PLATE');

-- CreateEnum
CREATE TYPE "OddsScope" AS ENUM ('PER_PACK', 'PER_BOX', 'PER_CASE');

-- CreateTable
CREATE TABLE "Manufacturer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "foundedYear" INTEGER,
    "country" TEXT,
    "colorHex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leagueId" TEXT,
    "countryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NationalTeam" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "confederation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NationalTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TournamentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "nationalityId" TEXT,
    "nationalTeamId" TEXT,
    "clubId" TEXT,
    "position" "Position" NOT NULL,
    "era" "PlayerEra" NOT NULL DEFAULT 'CURRENT',
    "birthYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "brandId" TEXT,
    "year" INTEGER NOT NULL,
    "season" TEXT,
    "releaseYear" INTEGER NOT NULL,
    "tournamentId" TEXT,
    "leagueId" TEXT,
    "format" "ProductFormat" NOT NULL,
    "description" TEXT NOT NULL,
    "accentHex" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "packsPerBox" INTEGER NOT NULL,
    "cardsPerPack" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardSet" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setType" "SetType" NOT NULL DEFAULT 'BASE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parallel" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "cardSetId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "printRun" INTEGER,
    "colorHex" TEXT,
    "isFoil" BOOLEAN NOT NULL DEFAULT false,
    "rarity" "Rarity" NOT NULL DEFAULT 'COMMON',
    "cardType" "CardType" NOT NULL DEFAULT 'PARALLEL',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parallel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistEntry" (
    "id" TEXT NOT NULL,
    "cardSetId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "checklistEntryId" TEXT NOT NULL,
    "parallelId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "estimatedValueCents" INTEGER NOT NULL DEFAULT 0,
    "frontImageUrl" TEXT,
    "backImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberingSpec" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "printRun" INTEGER NOT NULL,

    CONSTRAINT "NumberingSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutographSpec" (
    "id" TEXT NOT NULL,
    "checklistEntryId" TEXT NOT NULL,
    "signerCount" INTEGER NOT NULL DEFAULT 1,
    "onCard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AutographSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorabiliaSpec" (
    "id" TEXT NOT NULL,
    "checklistEntryId" TEXT NOT NULL,
    "memorabiliaType" "MemorabiliaType" NOT NULL,
    "isMultiColor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MemorabiliaSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackOddsRule" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cardSetId" TEXT,
    "parallelId" TEXT,
    "label" TEXT NOT NULL,
    "scope" "OddsScope" NOT NULL DEFAULT 'PER_PACK',
    "expectedCount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackOddsRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "packsCount" INTEGER NOT NULL,

    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT NOT NULL DEFAULT 'Collector',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "serialNumber" INTEGER,
    "serialDisplay" TEXT,
    "pulledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("userId","cardId")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","cardId")
);

-- CreateTable
CREATE TABLE "Binder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Binder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderPage" (
    "id" TEXT NOT NULL,
    "binderId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "label" TEXT,

    CONSTRAINT "BinderPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderSlot" (
    "id" TEXT NOT NULL,
    "binderPageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "userCardId" TEXT,

    CONSTRAINT "BinderSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowcaseItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userCardId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ShowcaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_slug_key" ON "Manufacturer"("slug");

-- CreateIndex
CREATE INDEX "Manufacturer_name_idx" ON "Manufacturer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_manufacturerId_idx" ON "Brand"("manufacturerId");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "League_slug_key" ON "League"("slug");

-- CreateIndex
CREATE INDEX "League_countryId_idx" ON "League"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE INDEX "Club_leagueId_idx" ON "Club"("leagueId");

-- CreateIndex
CREATE INDEX "Club_countryId_idx" ON "Club"("countryId");

-- CreateIndex
CREATE INDEX "Club_name_idx" ON "Club"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NationalTeam_slug_key" ON "NationalTeam"("slug");

-- CreateIndex
CREATE INDEX "NationalTeam_countryId_idx" ON "NationalTeam"("countryId");

-- CreateIndex
CREATE INDEX "NationalTeam_name_idx" ON "NationalTeam"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE INDEX "Tournament_type_idx" ON "Tournament"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Player_slug_key" ON "Player"("slug");

-- CreateIndex
CREATE INDEX "Player_fullName_idx" ON "Player"("fullName");

-- CreateIndex
CREATE INDEX "Player_clubId_idx" ON "Player"("clubId");

-- CreateIndex
CREATE INDEX "Player_nationalTeamId_idx" ON "Player"("nationalTeamId");

-- CreateIndex
CREATE INDEX "Player_era_idx" ON "Player"("era");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_manufacturerId_year_idx" ON "Product"("manufacturerId", "year");

-- CreateIndex
CREATE INDEX "Product_tournamentId_idx" ON "Product"("tournamentId");

-- CreateIndex
CREATE INDEX "Product_leagueId_idx" ON "Product"("leagueId");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "Product_releaseYear_idx" ON "Product"("releaseYear");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "CardSet_productId_setType_idx" ON "CardSet"("productId", "setType");

-- CreateIndex
CREATE UNIQUE INDEX "CardSet_productId_slug_key" ON "CardSet"("productId", "slug");

-- CreateIndex
CREATE INDEX "Parallel_productId_idx" ON "Parallel"("productId");

-- CreateIndex
CREATE INDEX "Parallel_cardSetId_idx" ON "Parallel"("cardSetId");

-- CreateIndex
CREATE INDEX "Parallel_slug_idx" ON "Parallel"("slug");

-- CreateIndex
CREATE INDEX "ChecklistEntry_playerId_idx" ON "ChecklistEntry"("playerId");

-- CreateIndex
CREATE INDEX "ChecklistEntry_cardSetId_sortOrder_idx" ON "ChecklistEntry"("cardSetId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistEntry_cardSetId_cardNumber_key" ON "ChecklistEntry"("cardSetId", "cardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Card_slug_key" ON "Card"("slug");

-- CreateIndex
CREATE INDEX "Card_estimatedValueCents_idx" ON "Card"("estimatedValueCents");

-- CreateIndex
CREATE INDEX "Card_parallelId_idx" ON "Card"("parallelId");

-- CreateIndex
CREATE INDEX "Card_checklistEntryId_idx" ON "Card"("checklistEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "Card_checklistEntryId_parallelId_key" ON "Card"("checklistEntryId", "parallelId");

-- CreateIndex
CREATE UNIQUE INDEX "NumberingSpec_cardId_key" ON "NumberingSpec"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "AutographSpec_checklistEntryId_key" ON "AutographSpec"("checklistEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "MemorabiliaSpec_checklistEntryId_key" ON "MemorabiliaSpec"("checklistEntryId");

-- CreateIndex
CREATE INDEX "PackOddsRule_productId_idx" ON "PackOddsRule"("productId");

-- CreateIndex
CREATE INDEX "PackOddsRule_cardSetId_idx" ON "PackOddsRule"("cardSetId");

-- CreateIndex
CREATE INDEX "Pack_productId_idx" ON "Pack"("productId");

-- CreateIndex
CREATE INDEX "Box_productId_idx" ON "Box"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserCard_userId_pulledAt_idx" ON "UserCard"("userId", "pulledAt");

-- CreateIndex
CREATE INDEX "UserCard_userId_cardId_idx" ON "UserCard"("userId", "cardId");

-- CreateIndex
CREATE INDEX "UserCard_productId_idx" ON "UserCard"("productId");

-- CreateIndex
CREATE INDEX "UserCard_cardId_idx" ON "UserCard"("cardId");

-- CreateIndex
CREATE INDEX "Binder_userId_idx" ON "Binder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BinderPage_binderId_pageNumber_key" ON "BinderPage"("binderId", "pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BinderSlot_binderPageId_position_key" ON "BinderSlot"("binderPageId", "position");

-- CreateIndex
CREATE INDEX "ShowcaseItem_userId_idx" ON "ShowcaseItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowcaseItem_userId_position_key" ON "ShowcaseItem"("userId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ShowcaseItem_userId_userCardId_key" ON "ShowcaseItem"("userId", "userCardId");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NationalTeam" ADD CONSTRAINT "NationalTeam_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_nationalTeamId_fkey" FOREIGN KEY ("nationalTeamId") REFERENCES "NationalTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardSet" ADD CONSTRAINT "CardSet_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parallel" ADD CONSTRAINT "Parallel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parallel" ADD CONSTRAINT "Parallel_cardSetId_fkey" FOREIGN KEY ("cardSetId") REFERENCES "CardSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistEntry" ADD CONSTRAINT "ChecklistEntry_cardSetId_fkey" FOREIGN KEY ("cardSetId") REFERENCES "CardSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistEntry" ADD CONSTRAINT "ChecklistEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_checklistEntryId_fkey" FOREIGN KEY ("checklistEntryId") REFERENCES "ChecklistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_parallelId_fkey" FOREIGN KEY ("parallelId") REFERENCES "Parallel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumberingSpec" ADD CONSTRAINT "NumberingSpec_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutographSpec" ADD CONSTRAINT "AutographSpec_checklistEntryId_fkey" FOREIGN KEY ("checklistEntryId") REFERENCES "ChecklistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorabiliaSpec" ADD CONSTRAINT "MemorabiliaSpec_checklistEntryId_fkey" FOREIGN KEY ("checklistEntryId") REFERENCES "ChecklistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackOddsRule" ADD CONSTRAINT "PackOddsRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackOddsRule" ADD CONSTRAINT "PackOddsRule_cardSetId_fkey" FOREIGN KEY ("cardSetId") REFERENCES "CardSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pack" ADD CONSTRAINT "Pack_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Binder" ADD CONSTRAINT "Binder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderPage" ADD CONSTRAINT "BinderPage_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderSlot" ADD CONSTRAINT "BinderSlot_binderPageId_fkey" FOREIGN KEY ("binderPageId") REFERENCES "BinderPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcaseItem" ADD CONSTRAINT "ShowcaseItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcaseItem" ADD CONSTRAINT "ShowcaseItem_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
