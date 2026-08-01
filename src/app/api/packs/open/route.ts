import { NextResponse } from "next/server";
import { openBoxFromDb, openPackFromDb, savePullsToCollection } from "@/lib/pack-engine";
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
    const packs =
      mode === "box"
        ? await openBoxFromDb(product.id)
        : [await openPackFromDb(product.id)];

    for (const pack of packs) {
      await savePullsToCollection(user.id, product.id, pack.cards);
    }

    return NextResponse.json({
      product,
      mode,
      packs,
      totalCards: packs.reduce((sum, p) => sum + p.cards.length, 0),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to open packs" }, { status: 500 });
  }
}
