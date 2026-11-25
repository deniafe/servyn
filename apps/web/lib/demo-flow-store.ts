"use client";

import * as React from "react";

export type DemoInvoiceStatus = "sent" | "paid_held" | "delivered" | "released";

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
  conversationId: string;
  kind: "service" | "product";
  providerName: string;
  customerName: string;
  title: string;
  agreedDate?: string;
  agreedLocation?: string;
  originalAmountMinor?: number;
  discountNote?: string;
  subtotalMinor: number;
  feeMinor: number;
  totalMinor: number;
  status: DemoInvoiceStatus;
  stripeSessionId?: string;
  paidAt?: string;
  deliveredAt?: string;
  releasedAt?: string;
  createdAt: string;
}

export interface DemoFlowState {
  customServices: DemoServiceListing[];
  customProducts: DemoProductListing[];
  conversations: DemoConversation[];
  invoices: DemoInvoice[];
}

const STORAGE_KEY = "servyn_demo_flow_v1";
const CHANGE_EVENT = "servyn-demo-flow-change";

export function computeServynFeeMinor(subtotalMinor: number): number {
  return Math.round(subtotalMinor * 0.1);
}

export function formatMinorGBP(minor: number): string {
  return `£${(minor / 100).toFixed(2)}`;
}

const SEED_STATE: DemoFlowState = {
  customServices: [],
  customProducts: [],
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
    return {
      customServices: Array.isArray(parsed.customServices) ? parsed.customServices : [],
      customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : SEED_STATE.conversations,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : SEED_STATE.invoices,
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
  const feeMinor = computeServynFeeMinor(input.subtotalMinor);
  const invoice: DemoInvoice = {
    id: `inv-${Date.now()}`,
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
        `Sent protected-payment invoice for ${input.title} (${formatMinorGBP(invoice.subtotalMinor)} + ${formatMinorGBP(invoice.feeMinor)} Servyn fee).`,
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

export function markInvoicePaidHeld(invoiceId: string, stripeSessionId?: string): void {
  const now = new Date().toISOString();
  updateState((prev) => ({
    ...prev,
    invoices: prev.invoices.map((inv) =>
      inv.id === invoiceId
        ? {
            ...inv,
            status: inv.status === "sent" ? "paid_held" : inv.status,
            stripeSessionId: stripeSessionId ?? inv.stripeSessionId ?? `cs_test_${Date.now()}`,
            paidAt: inv.paidAt ?? now,
          }
        : inv,
    ),
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
    confirmSatisfactionAndRelease,
    resetDemoFlow,
  };
}
