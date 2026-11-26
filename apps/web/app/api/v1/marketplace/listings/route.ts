import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, getDb, liveListings } from "@servyn/db";
import { getCurrentIdentity } from "@/lib/auth";

const CreateListingSchema = z.object({
  kind: z.enum(["service", "product"]),
  title: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(80).default("Manchester"),
  address: z.string().trim().max(200).optional(),
  description: z.string().trim().min(4).max(2000),
  priceMinor: z.number().int().min(100).max(5_000_000),
  bulkPriceMinor: z.number().int().min(100).max(5_000_000).optional(),
  minBulkQty: z.number().int().min(2).max(1000).optional(),
  durationMins: z.number().int().min(15).max(720).optional(),
  stock: z.number().int().min(0).max(100_000).optional(),
  unit: z.string().trim().max(40).optional(),
  photos: z.array(z.string().max(400_000)).max(4).default([]),
});

const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  Hulme: { lat: 53.4631, lng: -2.2499 },
  Salford: { lat: 53.4875, lng: -2.2901 },
  "Cheetham Hill": { lat: 53.5051, lng: -2.2442 },
  Levenshulme: { lat: 53.4422, lng: -2.1904 },
  "Moss Side": { lat: 53.4573, lng: -2.2422 },
  Ardwick: { lat: 53.4697, lng: -2.2194 },
  Gorton: { lat: 53.4622, lng: -2.1695 },
  Chorlton: { lat: 53.4408, lng: -2.2738 },
  Trafford: { lat: 53.4648, lng: -2.3095 },
  Oldham: { lat: 53.5409, lng: -2.1114 },
  Manchester: { lat: 53.4808, lng: -2.2426 },
};

async function resolveCoords(
  area: string,
  address?: string,
): Promise<{ lat: number; lng: number }> {
  const fallback = AREA_COORDS[area] ?? AREA_COORDS.Manchester!;
  if (!address?.trim()) return fallback;
  try {
    const q = encodeURIComponent(`${address.trim()}, ${area}, Greater Manchester, UK`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
      {
        headers: { "User-Agent": "ServynMarketplace/1.0" },
        signal: controller.signal,
      },
    );
    clearTimeout(timer);
    if (!res.ok) return fallback;
    const rows = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = rows[0];
    const lat = first?.lat ? Number.parseFloat(first.lat) : Number.NaN;
    const lng = first?.lon ? Number.parseFloat(first.lon) : Number.NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "servyn-listing"
  );
}

export async function GET(): Promise<NextResponse> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(liveListings)
      .orderBy(desc(liveListings.createdAt));

    return NextResponse.json({
      ok: true,
      listings: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not load listings" } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const current = await getCurrentIdentity();
  if (!current) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required to publish" } },
      { status: 401 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = CreateListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid listing details" } },
      { status: 400 },
    );
  }

  const v = parsed.data;
  const user = current.identity.user;
  const ownerName =
    current.identity.vendorProfile?.businessName ||
    current.identity.customerProfile?.displayName ||
    user.email.split("@")[0] ||
    "Servyn Provider";

  const id = `${v.kind === "service" ? "svc" : "prd"}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const slug = `${slugify(v.title)}-${Date.now().toString(36).slice(-5)}`;

  try {
    const coords = await resolveCoords(v.area, v.address);
    const db = getDb();
    const [inserted] = await db
      .insert(liveListings)
      .values({
        id,
        kind: v.kind,
        ownerUserId: user.id,
        ownerName,
        slug,
        title: v.title,
        category: v.category,
        area: v.area,
        address: v.address?.trim() || null,
        lat: coords.lat,
        lng: coords.lng,
        description: v.description,
        priceMinor: v.priceMinor,
        bulkPriceMinor: v.bulkPriceMinor ?? null,
        minBulkQty: v.minBulkQty ?? null,
        durationMins: v.durationMins ?? null,
        stock: v.stock ?? null,
        unit: v.unit ?? null,
        photos: v.photos,
      })
      .returning();

    return NextResponse.json(
      {
        ok: true,
        listing: {
          ...inserted,
          createdAt: inserted?.createdAt.toISOString() ?? new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not save listing" } },
      { status: 500 },
    );
  }
}
