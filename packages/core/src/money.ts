import { InvalidMoneyError } from "./errors";

export type Currency = "GBP";

export interface Money {
  readonly amountMinor: number;
  readonly currency: Currency;
}

function assertIntegerMinor(amountMinor: number): void {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new InvalidMoneyError("Money amountMinor must be a safe integer in pence", {
      amountMinor,
    });
  }
}

export function money(amountMinor: number, currency: Currency = "GBP"): Money {
  assertIntegerMinor(amountMinor);
  return { amountMinor, currency };
}

export function addMoney(a: Money, b: Money): Money {
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  return money(a.amountMinor - b.amountMinor, a.currency);
}

/**
 * Multiplies Money by integer basis points (100 bps = 1%, 1000 bps = 10%)
 * using half-up integer rounding to avoid floating-point drift.
 */
export function multiplyMoneyBps(amount: Money, basisPoints: number): Money {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) {
    throw new InvalidMoneyError("basisPoints must be a non-negative safe integer", {
      basisPoints,
    });
  }
  const sign = amount.amountMinor < 0 ? -1 : 1;
  const absMinor = Math.abs(amount.amountMinor);
  const rounded = Math.floor((absMinor * basisPoints + 5000) / 10000);
  return money(sign * rounded, amount.currency);
}

export function isZeroMoney(amount: Money): boolean {
  return amount.amountMinor === 0;
}

export function compareMoney(a: Money, b: Money): -1 | 0 | 1 {
  if (a.amountMinor < b.amountMinor) return -1;
  if (a.amountMinor > b.amountMinor) return 1;
  return 0;
}

export function formatMoney(amount: Money): string {
  const sign = amount.amountMinor < 0 ? "-" : "";
  const absMinor = Math.abs(amount.amountMinor);
  const pounds = Math.floor(absMinor / 100);
  const pence = absMinor % 100;
  return `${sign}£${pounds}.${pence.toString().padStart(2, "0")}`;
}
