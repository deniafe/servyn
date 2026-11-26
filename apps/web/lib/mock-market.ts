export type MarketProductId =
  | "soap"
  | "shea"
  | "plantain"
  | "ankara"
  | "bonnet"
  | "jollof"
  | "oil"
  | "beads";

export type MarketCategory =
  | "Fashion & Textiles"
  | "Beauty & Care"
  | "Food & Pantry";

export type PricingMode = "retail" | "bulk";

export interface MarketProduct {
  id: MarketProductId;
  slug?: string;
  ownerUserId?: string;
  photos?: ReadonlyArray<string>;
  stock?: number;
  unit?: string;
  vendor: string;
  vendorArea: string;
  title: string;
  name: string;
  packSize: string;
  originNote: string;
  category: MarketCategory;
  rating: number;
  sold: number;
  retailPrice: number;
  bulkPrice: number;
  bulkMinQty: number;
  lowStockLabel?: string;
  featuredOrder: number;
}

export const FREE_DELIVERY_THRESHOLD = 50;
export const STANDARD_DELIVERY_FEE = 3.99;

export const MARKET_CATEGORIES: ReadonlyArray<"All" | MarketCategory> = [
  "All",
  "Fashion & Textiles",
  "Beauty & Care",
  "Food & Pantry",
];

export const MARKET_PRODUCTS: ReadonlyArray<MarketProduct> = [
  {
    id: "soap",
    vendor: "Zuri Glow Skin Studio",
    vendorArea: "Chorlton",
    title: "African Black Soap · 3 bars",
    name: "African Black Soap",
    packSize: "3 hand-cut bars",
    originNote: "Traditional roasted cocoa-pod ash & raw shea base",
    category: "Beauty & Care",
    rating: 4.7,
    sold: 410,
    retailPrice: 9.0,
    bulkPrice: 6.5,
    bulkMinQty: 12,
    featuredOrder: 1,
  },
  {
    id: "shea",
    vendor: "Zuri Glow Skin Studio",
    vendorArea: "Chorlton",
    title: "Raw Unrefined Shea Butter · 500g",
    name: "Raw Unrefined Shea Butter",
    packSize: "500g jar",
    originNote: "Small-batch cold-pressed Grade A Ghanaian ivory shea",
    category: "Beauty & Care",
    rating: 4.8,
    sold: 342,
    retailPrice: 14.0,
    bulkPrice: 10.5,
    bulkMinQty: 8,
    featuredOrder: 2,
  },
  {
    id: "plantain",
    vendor: "Kofi's Kitchen",
    vendorArea: "Moss Side",
    title: "Roasted Plantain Chips · 12-pack",
    name: "Roasted Plantain Chips",
    packSize: "12-pack",
    originNote: "Crisp thinly sliced sweet plantain with sea salt",
    category: "Food & Pantry",
    rating: 4.8,
    sold: 257,
    retailPrice: 16.0,
    bulkPrice: 12.0,
    bulkMinQty: 6,
    featuredOrder: 3,
  },
  {
    id: "ankara",
    vendor: "Adunni Fashion House",
    vendorArea: "Cheetham Hill",
    title: "Premium Ankara Wax Fabric · 6 yards",
    name: "Premium Ankara Wax Fabric",
    packSize: "6 yards",
    originNote: "100% heavyweight combed cotton in double-sided print",
    category: "Fashion & Textiles",
    rating: 4.9,
    sold: 214,
    retailPrice: 42.0,
    bulkPrice: 32.0,
    bulkMinQty: 5,
    featuredOrder: 4,
  },
  {
    id: "bonnet",
    vendor: "Amara Hair & Beauty",
    vendorArea: "Hulme",
    title: "Satin Braid Bonnet · Forest Green",
    name: "Satin Braid Bonnet",
    packSize: "Forest Green",
    originNote: "Extra-long double-lined charmeuse for box braids & locs",
    category: "Fashion & Textiles",
    rating: 4.8,
    sold: 195,
    retailPrice: 8.0,
    bulkPrice: 5.5,
    bulkMinQty: 10,
    featuredOrder: 5,
  },
  {
    id: "jollof",
    vendor: "Kofi's Kitchen",
    vendorArea: "Moss Side",
    title: "Smoky Jollof Spice Kit",
    name: "Smoky Jollof Spice Kit",
    packSize: "3-jar spice set",
    originNote: "Toasted thyme, scotch bonnet paprika & authentic suya blend",
    category: "Food & Pantry",
    rating: 4.9,
    sold: 189,
    retailPrice: 12.0,
    bulkPrice: 9.0,
    bulkMinQty: 10,
    featuredOrder: 6,
  },
  {
    id: "oil",
    vendor: "Amara Hair & Beauty",
    vendorArea: "Hulme",
    title: "Amara's Braid Care Oil · 100ml",
    name: "Amara's Braid Care Oil",
    packSize: "100ml dropper",
    originNote: "Black castor, rosemary & cooling peppermint scalp serum",
    category: "Beauty & Care",
    rating: 4.9,
    sold: 168,
    retailPrice: 11.0,
    bulkPrice: 8.0,
    bulkMinQty: 12,
    featuredOrder: 7,
  },
  {
    id: "beads",
    vendor: "Adunni Fashion House",
    vendorArea: "Cheetham Hill",
    title: "Krobo Glass Bead Necklace",
    name: "Krobo Glass Bead Necklace",
    packSize: "Hand-strung",
    originNote: "Recycled Ghanaian powder-glass beads with brass clasp",
    category: "Fashion & Textiles",
    rating: 5.0,
    sold: 86,
    retailPrice: 28.0,
    bulkPrice: 21.0,
    bulkMinQty: 5,
    lowStockLabel: "Only 15 left",
    featuredOrder: 8,
  },
];

export function formatGBP(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
