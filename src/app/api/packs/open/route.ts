import { NextResponse } from "next/server";
import { annotateNewPulls } from "@/lib/collection";
import {
  getProductCollectionProgress,
  openBoxFromDb,
  openPackFromDb,
  recordOpeningAndAchievements,
  savePullsToCollection,
} from "@/lib/pack-engine";
import { getDemoUser, getProductBySlug } from "@/lib/queries";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productSlug?: string;
      mode?: "pack" | "box";
    };

    if (!body.productSlug) {
      return NextResponse.json({ error: "productSlug is required" }, { status: 400 });
    }

    const product = await getProductBySlug(body.productSlug);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const user = await getDemoUser();
    const before = await getProductCollectionProgress(user.id, product.id);
    const mode = body.mode ?? "pack";

    let packs;
    let boxSummary = null;

    if (mode === "box") {
      const opened = await openBoxFromDb(product.id);
      packs = opened.packs;
      boxSummary = opened.summary;
    } else {
      packs = [await openPackFromDb(product.id)];
    }

    packs = await annotateNewPulls(user.id, packs);

    const userCardIds: string[] = [];
    for (const pack of packs) {
      const created = await savePullsToCollection(user.id, product.id, pack.cards);
      userCardIds.push(...created.map((row) => row.id));
    }

    const { newlyUnlocked } = await recordOpeningAndAchievements({
      userId: user.id,
      productId: product.id,
      mode,
      packs,
      userCardIds,
    });

    const after = await getProductCollectionProgress(user.id, product.id);

    return NextResponse.json({
      product,
      mode,
      packs,
      totalCards: packs.reduce((sum, p) => sum + p.cards.length, 0),
      boxSummary,
      collectionProgress: {
        ...after,
        newUniquesThisOpen: Math.max(0, after.uniqueOwned - before.uniqueOwned),
      },
      newlyUnlocked,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to open packs" }, { status: 500 });
  }
}
