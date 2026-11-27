import { desc, getDb, inArray, liveInvoices, liveReviews } from "@servyn/db";
import type { LiveListingRow } from "@servyn/db";

export interface ListingReviewSummary {
  id: string;
  author: string;
  initials: string;
  avatarClass: string;
  timeAgo: string;
  date: string;
  rating: number;
  serviceName: string;
  comment: string;
}

export interface ListingStats {
  soldCount: number;
  reviewCount: number;
  avgRating: number;
  bookedSlots: string[];
  ratingBreakdown: Array<{ stars: 5 | 4 | 3 | 2 | 1; count: number }>;
  reviewList: ListingReviewSummary[];
}

function makeInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "SV"
  );
}

function emptyStats(): ListingStats {
  return {
    soldCount: 0,
    reviewCount: 0,
    avgRating: 0,
    bookedSlots: [],
    ratingBreakdown: [
      { stars: 5, count: 0 },
      { stars: 4, count: 0 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
    ],
    reviewList: [],
  };
}

export async function loadMarketplaceStatsMap(
  listings: ReadonlyArray<Pick<LiveListingRow, "id" | "kind" | "ownerUserId" | "ownerName" | "title">>,
): Promise<Map<string, ListingStats>> {
  const result = new Map<string, ListingStats>();
  if (listings.length === 0) return result;

  try {
    const db = getDb();
    const [paidInvoices, allReviews] = await Promise.all([
      db
        .select()
        .from(liveInvoices)
        .where(inArray(liveInvoices.status, ["paid_held", "delivered", "released"])),
      db.select().from(liveReviews).orderBy(desc(liveReviews.createdAt)),
    ]);

    for (const listing of listings) {
      const ownerLower = listing.ownerName.trim().toLowerCase();
      const titleLower = listing.title.trim().toLowerCase();

      const matchingInvoices = paidInvoices.filter((inv) => {
        if (inv.kind !== listing.kind) return false;
        if (listing.kind === "service") {
          return (
            inv.providerUserId === listing.ownerUserId ||
            inv.providerName.trim().toLowerCase() === ownerLower
          );
        }
        const invTitleLower = inv.title.trim().toLowerCase();
        return (
          invTitleLower.includes(titleLower) ||
          (inv.providerUserId === listing.ownerUserId && invTitleLower === titleLower)
        );
      });

      const matchingReviews = allReviews.filter((rev) => {
        const revTitleLower = rev.title.trim().toLowerCase();
        const revProviderLower = rev.providerName.trim().toLowerCase();
        if (listing.kind === "service") {
          return revProviderLower === ownerLower || revTitleLower === titleLower;
        }
        return (
          revTitleLower.includes(titleLower) ||
          (revProviderLower === ownerLower && revTitleLower === titleLower)
        );
      });

      const reviewCount = matchingReviews.length;
      const avgRating =
        reviewCount > 0
          ? Number(
              (
                matchingReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
              ).toFixed(1),
            )
          : 0;

      const breakdownCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      for (const r of matchingReviews) {
        const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        breakdownCounts[star] += 1;
      }

      const bookedSlots =
        listing.kind === "service"
          ? Array.from(
              new Set(
                matchingInvoices
                  .map((inv) => inv.agreedDate?.trim())
                  .filter((d): d is string => Boolean(d)),
              ),
            )
          : [];

      result.set(listing.id, {
        soldCount: matchingInvoices.length,
        reviewCount,
        avgRating,
        bookedSlots,
        ratingBreakdown: [
          { stars: 5, count: breakdownCounts[5] },
          { stars: 4, count: breakdownCounts[4] },
          { stars: 3, count: breakdownCounts[3] },
          { stars: 2, count: breakdownCounts[2] },
          { stars: 1, count: breakdownCounts[1] },
        ],
        reviewList: matchingReviews.map((rev) => {
          const dateLabel = rev.createdAt.toISOString().slice(0, 10);
          return {
            id: rev.id,
            author: rev.authorName,
            initials: makeInitials(rev.authorName),
            avatarClass: "bg-leaf-800",
            timeAgo: dateLabel,
            date: dateLabel,
            rating: rev.rating,
            serviceName: rev.title,
            comment: rev.comment,
          };
        }),
      });
    }

    return result;
  } catch {
    for (const listing of listings) {
      result.set(listing.id, emptyStats());
    }
    return result;
  }
}
