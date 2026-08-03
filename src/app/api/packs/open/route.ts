import { NextResponse } from "next/server";
import { persistOpenedPacks } from "@/lib/core-loop";
import { openBoxFromDb, openPackFromDb } from "@/lib/pack-engine";
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

    const persisted = await persistOpenedPacks({
      userId: user.id,
      productId: product.id,
      mode,
      packs,
    });

    return NextResponse.json({
      product,
      mode,
      packs: persisted.packs,
      totalCards: persisted.packs.reduce((sum, p) => sum + p.cards.length, 0),
      boxSummary,
      collectionProgress: persisted.collectionProgress,
      newlyUnlocked: persisted.newlyUnlocked,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to open packs" }, { status: 500 });
  }
}
