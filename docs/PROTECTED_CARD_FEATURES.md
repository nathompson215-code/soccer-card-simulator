# Protected card features (read-only)

The current **card renderer is stable and read-only**. Do not modify these
surfaces unless a change is **explicitly requested**:

| Protected feature | Primary files |
| --- | --- |
| Player photos | `PlayerPortrait`, `player-assets`, `public/players/` |
| Autograph strips / signature ink | `SignatureOverlay`, related CSS in `globals.css` |
| Booklet layouts | `BookletCardArt` |
| Pricing / market values | Card value fields + reveal/collection price display |
| Hidden rarity labels | Trading card art (rarity text stays off the face) |
| Permanent serial numbering | `Card.assignedSerial`, `card-serial`, pack-engine serial path |

Also leave alone unless explicitly requested: `TradingCardArt`, `CardFace`,
`card-visual` template resolution, and booklet/autograph CSS.

## Core loop (safe to harden)

Pack open → persist to Neon → permanent serials → collection → opening history
→ total value. That path lives in `pack-engine`, `progression`, `collection`,
and `/api/packs/open`. Harden and test it without redesigning card art.

Future work that needs renderer changes must call that out explicitly in the
request. Default assumption: **preserve photos, autos, booklets, pricing,
hidden rarity, and numbered / 1/1 displays**.
