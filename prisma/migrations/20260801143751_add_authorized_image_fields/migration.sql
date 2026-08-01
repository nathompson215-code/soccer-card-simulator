-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "backImageUrlHd" TEXT,
ADD COLUMN     "frontImageUrlHd" TEXT;

-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Manufacturer" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "NationalTeam" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "imageUrlHd" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "boxImageUrl" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "packImageUrl" TEXT;
