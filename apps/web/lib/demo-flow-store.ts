"use client";

import * as React from "react";

export type DemoInvoiceStatus =
  | "sent"
  | "paid_held"
  | "delivered"
  | "disputed"
  | "released"
  | "refunded";

export interface DemoServiceListing {
  id: string;
  slug: string;
  providerName: string;
  title: string;
  category: string;
  area: string;
  durationMins: number;
  priceMinor: number;
  description: string;
  createdAt: string;
}

export interface DemoProductListing {
  id: string;
  sellerName: string;
  title: string;
  category: string;
  retailPriceMinor: number;
  bulkPriceMinor: number;
  minBulkQty: number;
  stock: number;
  unit: string;
  originNote: string;
  createdAt: string;
}

export interface DemoMessage {
  id: string;
  sender: "customer" | "provider";
  text: string;
  at: string;
  invoiceId?: string;
}

export interface DemoConversation {
  id: string;
  kind: "service" | "product";
  providerName: string;
  providerSlug: string;
  listingTitle: string;
  area: string;
  customerName: string;
  messages: DemoMessage[];
  updatedAt: string;
}

export interface DemoInvoice {
  id: string;
  refId: string;
  conversationId: string;
  kind: "service" | "product";
  providerName: string;
  customerName: string;
  title: string;
  agreedDate?: string;
  agreedLocation?: string;
  originalAmountMinor?: number;
  discountNote?: string;
  referralApplied?: boolean;
  subtotalMinor: number;
  feeMinor: number;
  totalMinor: number;
  status: DemoInvoiceStatus;
  disputeReason?: string;
  disputedAt?: string;
  stripeSessionId?: string;
  paidAt?: string;
  deliveredAt?: string;
  releasedAt?: string;
  createdAt: string;
}

export interface DemoReview {
  id: string;
  invoiceId: string;
  providerName: string;
  title: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  authorName: string;
  createdAt: string;
}

export interface WorkingDayHours {
  open: boolean;
  from: string;
  to: string;
}

export interface VendorAvailability {
  workingDays: Record<string, WorkingDayHours>;
  blockedDates: string[];
}

export interface DemoCommunityComment {
  id: string;
  authorName: string;
  text: string;
  at: string;
}

export interface DemoCommunityPost {
  id: string;
  authorName: string;
  authorArea: string;
  tag: string;
  body: string;
  likes: number;
  likedByMe: boolean;
  comments: DemoCommunityComment[];
  createdAt: string;
}

export type DemoPendingVendorStatus =
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected";

export interface DemoPendingVendor {
  id: string;
  businessName: string;
  category: string;
  area: string;
  email: string;
  status: DemoPendingVendorStatus;
  submittedAt: string;
}

export interface DemoPortfolioPhoto {
  id: string;
  dataUrl: string;
  caption: string;
}

export interface DemoFlowState {
  customServices: DemoServiceListing[];
  customProducts: DemoProductListing[];
  conversations: DemoConversation[];
  invoices: DemoInvoice[];
  reviews: DemoReview[];
  referralCreditActive: boolean;
  vendorAvailability: VendorAvailability;
  communityPosts: DemoCommunityPost[];
  pendingVendors: DemoPendingVendor[];
  savedVendorSlugs: string[];
  vendorPortfolioPhotos: DemoPortfolioPhoto[];
}

const STORAGE_KEY = "servyn_demo_flow_v1";
const CHANGE_EVENT = "servyn-demo-flow-change";

export function computeServynFeeMinor(subtotalMinor: number, referralApplied = false): number {
  const rate = referralApplied ? 0.05 : 0.1;
  return Math.round(subtotalMinor * rate);
}

export function formatMinorGBP(minor: number): string {
  return `£${(minor / 100).toFixed(2)}`;
}

function makeRefId(seed?: string): string {
  if (seed) return seed;
  return `SRV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const DEFAULT_WORKING_DAYS: Record<string, WorkingDayHours> = {
  Monday: { open: true, from: "09:00", to: "18:00" },
  Tuesday: { open: true, from: "09:00", to: "18:00" },
  Wednesday: { open: true, from: "09:00", to: "18:00" },
  Thursday: { open: true, from: "09:00", to: "19:00" },
  Friday: { open: true, from: "09:00", to: "19:00" },
  Saturday: { open: true, from: "09:30", to: "17:30" },
  Sunday: { open: false, from: "10:00", to: "16:00" },
};

const SEED_COMMUNITY_POSTS: DemoCommunityPost[] = [
  {
    id: "post-seed-1",
    authorName: "Adaeze N.",
    authorArea: "Hulme",
    tag: "#braids",
    body: "Just left Amara Hair & Beauty in Hulme — neatest medium knotless braids I have had in Manchester and my payment stayed protected until we finished.",
    likes: 18,
    likedByMe: false,
    comments: [
      {
        id: "cmt-1",
        authorName: "Chidi O.",
        text: "Good to know! Booking my sister in for Saturday.",
        at: "2026-11-25T14:20:00.000Z",
      },
    ],
    createdAt: "2026-11-25T12:10:00.000Z",
  },
  {
    id: "post-seed-2",
    authorName: "Kwame B.",
    authorArea: "Moss Side",
    tag: "#ManchesterFood",
    body: "Anyone tried Kofi's Kitchen bulk Jollof spice kits for a 40-person birthday? Agreed a bundle discount right inside Servyn chat.",
    likes: 11,
    likedByMe: false,
    comments: [],
    createdAt: "2026-11-24T18:30:00.000Z",
  },
  {
    id: "post-seed-3",
    authorName: "Tasha M.",
    authorArea: "Salford",
    tag: "#ManchesterEvents",
    body: "Looking for recommendations for an Afro-Caribbean DJ + small chops caterer in Salford for mid-December. Any favourites on Servyn?",
    likes: 9,
    likedByMe: false,
    comments: [
      {
        id: "cmt-2",
        authorName: "Mama Efe's Kitchen",
        text: "Happy to send a custom small chops quote via chat!",
        at: "2026-11-24T10:05:00.000Z",
      },
    ],
    createdAt: "2026-11-24T09:15:00.000Z",
  },
];

const SEED_PENDING_VENDORS: DemoPendingVendor[] = [
  {
    id: "pv-1",
    businessName: "Zuri Locs & Natural Care",
    category: "Hair & Beauty",
    area: "Chorlton",
    email: "hello@zurilocs.co.uk",
    status: "pending",
    submittedAt: "2026-11-25T11:20:00.000Z",
  },
  {
    id: "pv-2",
    businessName: "Naija Small Chops Manchester",
    category: "Catering & Food",
    area: "Levenshulme",
    email: "orders@naijasmallchops.co.uk",
    status: "pending",
    submittedAt: "2026-11-24T16:45:00.000Z",
  },
  {
    id: "pv-3",
    businessName: "King's Fade Studio",
    category: "Barbering & Grooming",
    area: "Salford",
    email: "bookings@kingsfade.uk",
    status: "approved",
    submittedAt: "2026-11-22T09:10:00.000Z",
  },
];

const SEED_STATE: DemoFlowState = {
  customServices: [],
  customProducts: [],
  referralCreditActive: true,
  vendorAvailability: {
    workingDays: DEFAULT_WORKING_DAYS,
    blockedDates: [],
  },
  communityPosts: SEED_COMMUNITY_POSTS,
  pendingVendors: SEED_PENDING_VENDORS,
  savedVendorSlugs: ["mama-efes-kitchen"],
  vendorPortfolioPhotos: [],
  reviews: [
    {
      id: "rev-seed-1",
      invoiceId: "inv-demo-released-1",
      providerName: "Kofi's Kitchen",
      title: "Raw Unrefined Shea Butter · 500g (x3)",
      rating: 5,
      comment: "Super fresh Grade A shea, quick Manchester dispatch and great bundle discount.",
      authorName: "Adaeze N.",
      createdAt: "2026-11-21T19:00:00.000Z",
    },
  ],
  conversations: [
    {
      id: "conv-amara-braids",
      kind: "service",
      providerName: "Amara Hair & Beauty",
      providerSlug: "amara-hair-beauty",
      listingTitle: "Medium Knotless Braids",
      area: "Hulme",
      customerName: "Adaeze N.",
      updatedAt: "2026-11-26T09:15:00.000Z",
      messages: [
        {
          id: "msg-1",
          sender: "customer",
          text: "Hi Amara! Could we book Medium Knotless Braids this Saturday at 10:30 in Hulme? Happy to bring my own braiding hair.",
          at: "2026-11-26T09:10:00.000Z",
        },
        {
          id: "msg-2",
          sender: "provider",
          text: "Yes, Saturday 10:30 in Hulme works! With your own hair I can do £75.00 instead of £85.00. Let me know and I will send the invoice.",
          at: "2026-11-26T09:15:00.000Z",
        },
      ],
    },
    {
      id: "conv-kofi-jollof",
      kind: "product",
      providerName: "Kofi's Kitchen",
      providerSlug: "kofis-kitchen",
      listingTitle: "Smoky Jollof Spice Kit (Bulk)",
      area: "Moss Side",
      customerName: "Adaeze N.",
      updatedAt: "2026-11-26T08:45:00.000Z",
      messages: [
        {
          id: "msg-3",
          sender: "customer",
          text: "Hello! Ordering 10 spice kits for a Manchester community event — can we agree a bulk discount?",
          at: "2026-11-26T08:40:00.000Z",
        },
        {
          id: "msg-4",
          sender: "provider",
          text: "Of course! For 10 kits I can offer £9.50 per kit (£95.00 total, down from £120.00 retail). Ready to send your invoice whenever you confirm.",
          at: "2026-11-26T08:45:00.000Z",
        },
      ],
    },
  ],
  invoices: [
    {
      id: "inv-demo-held-1",
      refId: "SRV-8K2M4P",
      conversationId: "conv-amara-braids",
      kind: "service",
      providerName: "Amara Hair & Beauty",
      customerName: "Adaeze N.",
      title: "Silk Press & Trim",
      agreedDate: "Sat 29 Nov · 14:00",
      agreedLocation: "Hulme Studio, M15",
      subtotalMinor: 4500,
      feeMinor: 450,
      totalMinor: 4950,
      status: "paid_held",
      stripeSessionId: "cs_test_servyn_held_01",
      paidAt: "2026-11-25T16:00:00.000Z",
      createdAt: "2026-11-25T15:50:00.000Z",
    },
    {
      id: "inv-demo-released-1",
      refId: "SRV-4R9T1W",
      conversationId: "conv-kofi-jollof",
      kind: "product",
      providerName: "Kofi's Kitchen",
      customerName: "Adaeze N.",
      title: "Raw Unrefined Shea Butter · 500g (x3)",
      originalAmountMinor: 4200,
      discountNote: "Bundle discount (-£6.00)",
      subtotalMinor: 3600,
      feeMinor: 360,
      totalMinor: 3960,
      status: "released",
      stripeSessionId: "cs_test_servyn_rel_02",
      paidAt: "2026-11-20T10:00:00.000Z",
      deliveredAt: "2026-11-21T14:00:00.000Z",
      releasedAt: "2026-11-21T18:30:00.000Z",
      createdAt: "2026-11-20T09:45:00.000Z",
    },
  ],
};

function readRaw(): string {
  if (typeof window === "undefined") return "__SSR__";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "__SEED__";
  } catch {
    return "__SEED__";
  }
}

function getServerSnapshot(): string {
  return "__SSR__";
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function parseState(raw: string): DemoFlowState {
  if (raw === "__SSR__" || raw === "__SEED__") return SEED_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<DemoFlowState>;
    const rawInvoices = Array.isArray(parsed.invoices) ? parsed.invoices : SEED_STATE.invoices;
    const normalizedInvoices: DemoInvoice[] = rawInvoices.map((inv, idx) => ({
      ...inv,
      refId: inv.refId || `SRV-${String(100000 + idx).slice(-6)}`,
    }));
    return {
      customServices: Array.isArray(parsed.customServices) ? parsed.customServices : [],
      customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : SEED_STATE.conversations,
      invoices: normalizedInvoices,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : SEED_STATE.reviews,
      referralCreditActive:
        typeof parsed.referralCreditActive === "boolean"
          ? parsed.referralCreditActive
          : SEED_STATE.referralCreditActive,
      vendorAvailability: parsed.vendorAvailability?.workingDays
        ? parsed.vendorAvailability
        : SEED_STATE.vendorAvailability,
      communityPosts: Array.isArray(parsed.communityPosts)
        ? parsed.communityPosts
        : SEED_COMMUNITY_POSTS,
      pendingVendors: Array.isArray(parsed.pendingVendors)
        ? parsed.pendingVendors
        : SEED_PENDING_VENDORS,
      savedVendorSlugs: Array.isArray(parsed.savedVendorSlugs)
        ? parsed.savedVendorSlugs
        : SEED_STATE.savedVendorSlugs,
      vendorPortfolioPhotos: Array.isArray(parsed.vendorPortfolioPhotos)
        ? parsed.vendorPortfolioPhotos
        : [],
    };
  } catch {
    return SEED_STATE;
  }
}

function writeState(next: DemoFlowState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Ignore storage write issues in restricted contexts.
  }
}

function updateState(updater: (prev: DemoFlowState) => DemoFlowState): DemoFlowState {
  const prev = parseState(readRaw());
  const next = updater(prev);
  writeState(next);
  return next;
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "servyn-listing"
  );
}

export function addServiceListing(
  input: Omit<DemoServiceListing, "id" | "slug" | "createdAt">,
): DemoServiceListing {
  const listing: DemoServiceListing = {
    ...input,
    id: `svc-${Date.now()}`,
    slug: `${slugify(input.providerName)}-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
  };
  updateState((prev) => ({
    ...prev,
    customServices: [listing, ...prev.customServices],
  }));
  return listing;
}

export function addProductListing(
  input: Omit<DemoProductListing, "id" | "createdAt">,
): DemoProductListing {
  const product: DemoProductListing = {
    ...input,
    id: `prd-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  updateState((prev) => ({
    ...prev,
    customProducts: [product, ...prev.customProducts],
  }));
  return product;
}

export function startOrGetConversation(input: {
  kind: "service" | "product";
  providerName: string;
  providerSlug: string;
  listingTitle: string;
  area: string;
  customerName?: string;
  initialMessage?: string;
}): DemoConversation {
  let target: DemoConversation | undefined;
  updateState((prev) => {
    const existing = prev.conversations.find(
      (c) =>
        c.kind === input.kind &&
        c.providerName.toLowerCase() === input.providerName.toLowerCase() &&
        c.listingTitle.toLowerCase() === input.listingTitle.toLowerCase(),
    );
    const now = new Date().toISOString();
    if (existing) {
      if (input.initialMessage?.trim()) {
        const msg: DemoMessage = {
          id: `msg-${Date.now()}`,
          sender: "customer",
          text: input.initialMessage.trim(),
          at: now,
        };
        target = {
          ...existing,
          updatedAt: now,
          messages: [...existing.messages, msg],
        };
        return {
          ...prev,
          conversations: prev.conversations.map((c) => (c.id === existing.id ? target! : c)),
        };
      }
      target = existing;
      return prev;
    }

    const created: DemoConversation = {
      id: `conv-${Date.now()}`,
      kind: input.kind,
      providerName: input.providerName,
      providerSlug: input.providerSlug,
      listingTitle: input.listingTitle,
      area: input.area,
      customerName: input.customerName ?? "Adaeze N.",
      updatedAt: now,
      messages: input.initialMessage?.trim()
        ? [
            {
              id: `msg-${Date.now()}`,
              sender: "customer",
              text: input.initialMessage.trim(),
              at: now,
            },
          ]
        : [],
    };
    target = created;
    return {
      ...prev,
      conversations: [created, ...prev.conversations],
    };
  });
  return target!;
}

export function sendMessage(
  conversationId: string,
  sender: "customer" | "provider",
  text: string,
  invoiceId?: string,
): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  const now = new Date().toISOString();
  const msg: DemoMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender,
    text: trimmed,
    at: now,
    invoiceId,
  };
  updateState((prev) => ({
    ...prev,
    conversations: prev.conversations.map((c) =>
      c.id === conversationId ? { ...c, updatedAt: now, messages: [...c.messages, msg] } : c,
    ),
  }));
}

export function createInvoiceAndSend(input: {
  conversationId: string;
  kind: "service" | "product";
  providerName: string;
  customerName: string;
  title: string;
  subtotalMinor: number;
  agreedDate?: string;
  agreedLocation?: string;
  originalAmountMinor?: number;
  discountNote?: string;
  messageText?: string;
}): DemoInvoice {
  const now = new Date().toISOString();
  const feeMinor = computeServynFeeMinor(input.subtotalMinor, false);
  const invoice: DemoInvoice = {
    id: `inv-${Date.now()}`,
    refId: makeRefId(),
    conversationId: input.conversationId,
    kind: input.kind,
    providerName: input.providerName,
    customerName: input.customerName,
    title: input.title,
    agreedDate: input.agreedDate,
    agreedLocation: input.agreedLocation,
    originalAmountMinor: input.originalAmountMinor,
    discountNote: input.discountNote,
    subtotalMinor: input.subtotalMinor,
    feeMinor,
    totalMinor: input.subtotalMinor + feeMinor,
    status: "sent",
    createdAt: now,
  };

  updateState((prev) => {
    const convExists = prev.conversations.some((c) => c.id === input.conversationId);
    const msg: DemoMessage = {
      id: `msg-${Date.now()}`,
      sender: "provider",
      text:
        input.messageText?.trim() ||
        `Sent protected-payment invoice ${invoice.refId} for ${input.title} (${formatMinorGBP(invoice.subtotalMinor)} + ${formatMinorGBP(invoice.feeMinor)} Servyn fee).`,
      at: now,
      invoiceId: invoice.id,
    };

    const nextConvs = convExists
      ? prev.conversations.map((c) =>
          c.id === input.conversationId
            ? { ...c, updatedAt: now, messages: [...c.messages, msg] }
            : c,
        )
      : [
          {
            id: input.conversationId,
            kind: input.kind,
            providerName: input.providerName,
            providerSlug: slugify(input.providerName),
            listingTitle: input.title,
            area: input.agreedLocation ?? "Manchester",
            customerName: input.customerName,
            updatedAt: now,
            messages: [msg],
          },
          ...prev.conversations,
        ];

    return {
      ...prev,
      invoices: [invoice, ...prev.invoices],
      conversations: nextConvs,
    };
  });

  return invoice;
}

export function markInvoicePaidHeld(
  invoiceId: string,
  stripeSessionId?: string,
  referralApplied = false,
): void {
  const now = new Date().toISOString();
  updateState((prev) => ({
    ...prev,
    referralCreditActive: referralApplied ? false : prev.referralCreditActive,
    invoices: prev.invoices.map((inv) => {
      if (inv.id !== invoiceId) return inv;
      const feeMinor = referralApplied
        ? computeServynFeeMinor(inv.subtotalMinor, true)
        : inv.feeMinor;
      return {
        ...inv,
        referralApplied: referralApplied || inv.referralApplied,
        feeMinor,
        totalMinor: inv.subtotalMinor + feeMinor,
        status: inv.status === "sent" ? "paid_held" : inv.status,
        stripeSessionId: stripeSessionId ?? inv.stripeSessionId ?? `cs_test_${Date.now()}`,
        paidAt: inv.paidAt ?? now,
      };
    }),
  }));
}

export function markInvoiceDelivered(invoiceId: string): void {
  const now = new Date().toISOString();
  updateState((prev) => ({
    ...prev,
    invoices: prev.invoices.map((inv) =>
      inv.id === invoiceId && inv.status === "paid_held"
        ? { ...inv, status: "delivered", deliveredAt: now }
        : inv,
    ),
  }));
}

export function reportProblemAndPausePayout(invoiceId: string, reason: string): void {
  const now = new Date().toISOString();
  updateState((prev) => ({
    ...prev,
    invoices: prev.invoices.map((inv) =>
      inv.id === invoiceId && (inv.status === "paid_held" || inv.status === "delivered")
        ? {
            ...inv,
            status: "disputed",
            disputeReason: reason.trim() || "Customer reported an issue",
            disputedAt: now,
          }
        : inv,
    ),
  }));
}

export function confirmSatisfactionAndRelease(invoiceId: string): void {
  const now = new Date().toISOString();
  updateState((prev) => ({
    ...prev,
    invoices: prev.invoices.map((inv) =>
      inv.id === invoiceId && (inv.status === "paid_held" || inv.status === "delivered")
        ? {
            ...inv,
            status: "released",
            deliveredAt: inv.deliveredAt ?? now,
            releasedAt: now,
          }
        : inv,
    ),
  }));
}

export function submitVerifiedReview(input: {
  invoiceId: string;
  providerName: string;
  title: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  authorName: string;
}): DemoReview {
  const review: DemoReview = {
    id: `rev-${Date.now()}`,
    invoiceId: input.invoiceId,
    providerName: input.providerName,
    title: input.title,
    rating: input.rating,
    comment: input.comment.trim(),
    authorName: input.authorName,
    createdAt: new Date().toISOString(),
  };
  updateState((prev) => ({
    ...prev,
    reviews: [review, ...prev.reviews.filter((r) => r.invoiceId !== input.invoiceId)],
  }));
  return review;
}

export function activateReferralDiscount(): void {
  updateState((prev) => ({
    ...prev,
    referralCreditActive: true,
  }));
}

export function toggleWorkingDay(day: string, patch: Partial<WorkingDayHours>): void {
  updateState((prev) => {
    const existing = prev.vendorAvailability.workingDays[day] ?? {
      open: true,
      from: "09:00",
      to: "18:00",
    };
    return {
      ...prev,
      vendorAvailability: {
        ...prev.vendorAvailability,
        workingDays: {
          ...prev.vendorAvailability.workingDays,
          [day]: { ...existing, ...patch },
        },
      },
    };
  });
}

export function toggleBlockedDate(dateStr: string): void {
  updateState((prev) => {
    const exists = prev.vendorAvailability.blockedDates.includes(dateStr);
    const nextBlocked = exists
      ? prev.vendorAvailability.blockedDates.filter((d) => d !== dateStr)
      : [...prev.vendorAvailability.blockedDates, dateStr];
    return {
      ...prev,
      vendorAvailability: {
        ...prev.vendorAvailability,
        blockedDates: nextBlocked,
      },
    };
  });
}

export function resolveDisputeInvoice(
  invoiceId: string,
  resolution: "release" | "refund",
): void {
  const now = new Date().toISOString();
  updateState((prev) => ({
    ...prev,
    invoices: prev.invoices.map((inv) => {
      if (inv.id !== invoiceId || inv.status !== "disputed") return inv;
      if (resolution === "release") {
        return {
          ...inv,
          status: "released",
          deliveredAt: inv.deliveredAt ?? now,
          releasedAt: now,
        };
      }
      return {
        ...inv,
        status: "refunded",
      };
    }),
  }));
}

export function addCommunityPost(input: {
  authorName: string;
  authorArea: string;
  tag: string;
  body: string;
}): void {
  const body = input.body.trim();
  if (!body) return;
  const post: DemoCommunityPost = {
    id: `post-${Date.now()}`,
    authorName: input.authorName.trim() || "Adaeze N.",
    authorArea: input.authorArea.trim() || "Manchester",
    tag: input.tag.trim() || "#communityFinds",
    body,
    likes: 0,
    likedByMe: false,
    comments: [],
    createdAt: new Date().toISOString(),
  };
  updateState((prev) => ({
    ...prev,
    communityPosts: [post, ...prev.communityPosts],
  }));
}

export function toggleLikePost(postId: string): void {
  updateState((prev) => ({
    ...prev,
    communityPosts: prev.communityPosts.map((p) => {
      if (p.id !== postId) return p;
      const nextLiked = !p.likedByMe;
      return {
        ...p,
        likedByMe: nextLiked,
        likes: Math.max(0, p.likes + (nextLiked ? 1 : -1)),
      };
    }),
  }));
}

export function addPostComment(postId: string, authorName: string, text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  const comment: DemoCommunityComment = {
    id: `cmt-${Date.now()}`,
    authorName: authorName.trim() || "Adaeze N.",
    text: trimmed,
    at: new Date().toISOString(),
  };
  updateState((prev) => ({
    ...prev,
    communityPosts: prev.communityPosts.map((p) =>
      p.id === postId ? { ...p, comments: [...p.comments, comment] } : p,
    ),
  }));
}

export function updatePendingVendorStatus(
  vendorId: string,
  status: DemoPendingVendorStatus,
): void {
  updateState((prev) => ({
    ...prev,
    pendingVendors: prev.pendingVendors.map((v) =>
      v.id === vendorId ? { ...v, status } : v,
    ),
  }));
}

export function toggleSavedVendor(slug: string): void {
  updateState((prev) => {
    const exists = prev.savedVendorSlugs.includes(slug);
    return {
      ...prev,
      savedVendorSlugs: exists
        ? prev.savedVendorSlugs.filter((s) => s !== slug)
        : [slug, ...prev.savedVendorSlugs],
    };
  });
}

export function addVendorPortfolioPhoto(dataUrl: string, caption: string): void {
  const photo: DemoPortfolioPhoto = {
    id: `photo-${Date.now()}`,
    dataUrl,
    caption: caption.trim() || "Portfolio work",
  };
  updateState((prev) => ({
    ...prev,
    vendorPortfolioPhotos: [photo, ...prev.vendorPortfolioPhotos].slice(0, 8),
  }));
}

export function removeVendorPortfolioPhoto(id: string): void {
  updateState((prev) => ({
    ...prev,
    vendorPortfolioPhotos: prev.vendorPortfolioPhotos.filter((p) => p.id !== id),
  }));
}

export function resetDemoFlow(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Ignore storage errors.
  }
}

export function useDemoFlow() {
  const raw = React.useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const state = React.useMemo(() => parseState(raw), [raw]);

  return {
    ...state,
    addServiceListing,
    addProductListing,
    startOrGetConversation,
    sendMessage,
    createInvoiceAndSend,
    markInvoicePaidHeld,
    markInvoiceDelivered,
    reportProblemAndPausePayout,
    confirmSatisfactionAndRelease,
    submitVerifiedReview,
    activateReferralDiscount,
    toggleWorkingDay,
    toggleBlockedDate,
    resolveDisputeInvoice,
    addCommunityPost,
    toggleLikePost,
    addPostComment,
    updatePendingVendorStatus,
    toggleSavedVendor,
    addVendorPortfolioPhoto,
    removeVendorPortfolioPhoto,
    resetDemoFlow,
  };
}
