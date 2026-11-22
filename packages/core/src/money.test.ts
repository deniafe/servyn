import { describe, expect, it } from "vitest";
import {
  AppError,
  InvalidMoneyError,
  addMoney,
  asBookingId,
  asPaymentId,
  assertNever,
  compareMoney,
  err,
  formatMoney,
  isErr,
  isOk,
  isZeroMoney,
  mapResult,
  money,
  multiplyMoneyBps,
  ok,
  subtractMoney,
} from "./index";

describe("Money", () => {
  it("constructs GBP money from integer pence and rejects floats", () => {
    const m = money(4500);
    expect(m).toEqual({ amountMinor: 4500, currency: "GBP" });
    expect(() => money(45.5)).toThrow(InvalidMoneyError);
    expect(() => money(Number.NaN)).toThrow(InvalidMoneyError);
  });

  it("performs exact integer arithmetic and basis-point rounding", () => {
    const price = money(5000);
    const fee = multiplyMoneyBps(price, 1000);
    expect(fee.amountMinor).toBe(500);
    expect(addMoney(price, fee).amountMinor).toBe(5500);
    expect(subtractMoney(price, fee).amountMinor).toBe(4500);

    // 10% of 105p = 10.5p -> half-up to 11p
    expect(multiplyMoneyBps(money(105), 1000).amountMinor).toBe(11);
    expect(isZeroMoney(money(0))).toBe(true);
    expect(compareMoney(money(100), money(200))).toBe(-1);
  });

  it("formats pence as GBP strings", () => {
    expect(formatMoney(money(5000))).toBe("£50.00");
    expect(formatMoney(money(5))).toBe("£0.05");
    expect(formatMoney(money(-125))).toBe("-£1.25");
  });
});

describe("Result & AppError", () => {
  it("wraps ok and err values cleanly", () => {
    const success = ok(42);
    expect(isOk(success)).toBe(true);
    expect(mapResult(success, (n) => n * 2)).toEqual({ ok: true, value: 84 });

    const failure = err(new AppError("NOT_FOUND", "Booking missing", 404, { id: "bk_1" }));
    expect(isErr(failure)).toBe(true);
    if (!failure.ok) {
      expect(failure.error.toJSON()).toEqual({
        code: "NOT_FOUND",
        message: "Booking missing",
        details: { id: "bk_1" },
      });
    }
  });
});

describe("assertNever & branded IDs", () => {
  it("throws on unexpected union values", () => {
    expect(() => assertNever("unexpected" as never)).toThrow("Unexpected value: unexpected");
  });

  it("creates non-empty branded IDs", () => {
    expect(asBookingId("bk_01")).toBe("bk_01");
    expect(asPaymentId("pay_01")).toBe("pay_01");
    expect(() => asBookingId("   ")).toThrow();
  });
});
