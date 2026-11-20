"use client";

import * as React from "react";
import {
  FREE_DELIVERY_THRESHOLD,
  MARKET_PRODUCTS,
  STANDARD_DELIVERY_FEE,
  type MarketProduct,
  type MarketProductId,
  type PricingMode,
} from "@/lib/mock-market";

export interface CartLineItem {
  key: string;
  product: MarketProduct;
  mode: PricingMode;
  unitPrice: number;
  quantity: number;
}

interface StoredLineItem {
  id: MarketProductId;
  mode: PricingMode;
  quantity: number;
}

interface CartContextValue {
  items: ReadonlyArray<CartLineItem>;
  cartCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: MarketProduct, mode?: PricingMode) => void;
  updateQuantity: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "servyn-basket-v1";
const CartContext = React.createContext<CartContextValue | null>(null);

function makeLineKey(id: MarketProductId, mode: PricingMode): string {
  return `${id}:${mode}`;
}

function hydrateLineItems(raw: string | null): CartLineItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredLineItem[];
    if (!Array.isArray(parsed)) return [];
    const result: CartLineItem[] = [];
    for (const entry of parsed) {
      const product = MARKET_PRODUCTS.find((p) => p.id === entry.id);
      if (!product || typeof entry.quantity !== "number" || entry.quantity < 1) {
        continue;
      }
      const mode: PricingMode = entry.mode === "bulk" ? "bulk" : "retail";
      const unitPrice = mode === "bulk" ? product.bulkPrice : product.retailPrice;
      result.push({
        key: makeLineKey(product.id, mode),
        product,
        mode,
        unitPrice,
        quantity: entry.quantity,
      });
    }
    return result;
  } catch {
    return [];
  }
}

function persistLineItems(next: ReadonlyArray<CartLineItem>) {
  try {
    const compact: StoredLineItem[] = next.map((item) => ({
      id: item.product.id,
      mode: item.mode,
      quantity: item.quantity,
    }));
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
  } catch {
    /* ignore private-mode storage quotas */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartLineItem[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const saved = hydrateLineItems(window.sessionStorage.getItem(STORAGE_KEY));
    const cartParam = new URLSearchParams(window.location.search).get("cart");

    const frameId = window.requestAnimationFrame(() => {
      if (saved.length > 0) {
        setItems(saved);
      } else if (cartParam === "open") {
        const shea = MARKET_PRODUCTS.find((p) => p.id === "shea");
        if (shea) {
          setItems([
            {
              key: makeLineKey(shea.id, "retail"),
              product: shea,
              mode: "retail",
              unitPrice: shea.retailPrice,
              quantity: 1,
            },
          ]);
        }
      }
      if (cartParam === "open") {
        setIsOpen(true);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const addToCart = React.useCallback(
    (product: MarketProduct, mode: PricingMode = "retail") => {
      const key = makeLineKey(product.id, mode);
      const unitPrice = mode === "bulk" ? product.bulkPrice : product.retailPrice;
      const step = mode === "bulk" ? product.bulkMinQty : 1;

      setItems((prev) => {
        const existing = prev.find((item) => item.key === key);
        const next = existing
          ? prev.map((item) =>
              item.key === key
                ? { ...item, quantity: item.quantity + step }
                : item,
            )
          : [...prev, { key, product, mode, unitPrice, quantity: step }];
        persistLineItems(next);
        return next;
      });
    },
    [],
  );

  const updateQuantity = React.useCallback((key: string, delta: number) => {
    setItems((prev) => {
      const next = prev
        .map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0);
      persistLineItems(next);
      return next;
    });
  }, []);

  const removeItem = React.useCallback((key: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.key !== key);
      persistLineItems(next);
      return next;
    });
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
    persistLineItems([]);
  }, []);

  const openCart = React.useCallback(() => setIsOpen(true), []);
  const closeCart = React.useCallback(() => setIsOpen(false), []);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const deliveryFee =
    subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : STANDARD_DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        deliveryFee,
        total,
        isOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      cartCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      isOpen: false,
      openCart: () => {},
      closeCart: () => {},
      addToCart: () => {},
      updateQuantity: () => {},
      removeItem: () => {},
      clearCart: () => {},
    };
  }
  return ctx;
}
