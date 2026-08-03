-- CreateEnum
CREATE TYPE "OpeningMode" AS ENUM ('PACK', 'BOX');

-- CreateTable
CREATE TABLE "Opening" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "mode" "OpeningMode" NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "packCount" INTEGER NOT NULL,
    "cardCount" INTEGER NOT NULL,
    "totalValueCents" INTEGER NOT NULL,
    "biggestHitValueCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Opening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpeningPull" (
    "id" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userCardId" TEXT,
    "packIndex" INTEGER NOT NULL DEFAULT 0,
    "slotIndex" INTEGER NOT NULL DEFAULT 0,
    "serialNumber" INTEGER,
    "serialDisplay" TEXT,
    "valueCentsAtOpen" INTEGER NOT NULL,
    "isHit" BOOLEAN NOT NULL DEFAULT false,
    "celebration" TEXT NOT NULL DEFAULT 'none',
    "isNew" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OpeningPull_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementKey" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingId" TEXT,
    "metaJson" TEXT,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opening_userId_openedAt_idx" ON "Opening"("userId", "openedAt");

-- CreateIndex
CREATE INDEX "Opening_productId_idx" ON "Opening"("productId");

-- CreateIndex
CREATE INDEX "Opening_userId_totalValueCents_idx" ON "Opening"("userId", "totalValueCents");

-- CreateIndex
CREATE INDEX "OpeningPull_openingId_packIndex_slotIndex_idx" ON "OpeningPull"("openingId", "packIndex", "slotIndex");

-- CreateIndex
CREATE INDEX "OpeningPull_cardId_idx" ON "OpeningPull"("cardId");

-- CreateIndex
CREATE INDEX "OpeningPull_valueCentsAtOpen_idx" ON "OpeningPull"("valueCentsAtOpen");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_unlockedAt_idx" ON "UserAchievement"("userId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementKey_key" ON "UserAchievement"("userId", "achievementKey");

-- AddForeignKey
ALTER TABLE "Opening" ADD CONSTRAINT "Opening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opening" ADD CONSTRAINT "Opening_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningPull" ADD CONSTRAINT "OpeningPull_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "Opening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningPull" ADD CONSTRAINT "OpeningPull_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningPull" ADD CONSTRAINT "OpeningPull_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "Opening"("id") ON DELETE SET NULL ON UPDATE CASCADE;
