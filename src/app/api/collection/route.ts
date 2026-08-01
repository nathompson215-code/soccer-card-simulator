import { NextResponse } from "next/server";
import { getCollection, getCollectionOwnedCount, toggleFavorite, toggleWishlist } from "@/lib/collection";

export async function GET(request: Request) {
  try {
    const summaryOnly = new URL(request.url).searchParams.get("summary") === "1";
    if (summaryOnly) {
      return NextResponse.json(await getCollectionOwnedCount());
    }
    const collection = await getCollection();
    return NextResponse.json(collection);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load collection" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "favorite" | "wishlist";
      cardId?: string;
    };
    if (!body.cardId || !body.action) {
      return NextResponse.json({ error: "action and cardId required" }, { status: 400 });
    }
    if (body.action === "favorite") {
      return NextResponse.json(await toggleFavorite(body.cardId));
    }
    return NextResponse.json(await toggleWishlist(body.cardId));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}
