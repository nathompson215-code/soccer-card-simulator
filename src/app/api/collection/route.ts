import { NextResponse } from "next/server";
import {
  getCollection,
  getCollectionOwnedCount,
  toggleFavorite,
  toggleWishlist,
  type CollectionQuery,
} from "@/lib/collection";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const summaryOnly = url.searchParams.get("summary") === "1";
    if (summaryOnly) {
      return NextResponse.json(await getCollectionOwnedCount());
    }

    const query: CollectionQuery = {
      q: url.searchParams.get("q") ?? undefined,
      player: url.searchParams.get("player") ?? undefined,
      club: url.searchParams.get("club") ?? undefined,
      nation: url.searchParams.get("nation") ?? undefined,
      product: url.searchParams.get("product") ?? undefined,
      year: url.searchParams.get("year") ?? undefined,
      rarity: url.searchParams.get("rarity") ?? undefined,
      insertSet: url.searchParams.get("insertSet") ?? undefined,
      autograph: url.searchParams.get("autograph") ?? undefined,
      memorabilia: url.searchParams.get("memorabilia") ?? undefined,
      booklet: url.searchParams.get("booklet") ?? undefined,
      numbered: url.searchParams.get("numbered") ?? undefined,
      valueMin: url.searchParams.get("valueMin") ?? undefined,
      valueMax: url.searchParams.get("valueMax") ?? undefined,
      favorites: url.searchParams.get("favorites") ?? undefined,
      owned: url.searchParams.get("owned") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
    };

    const collection = await getCollection(query);
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
