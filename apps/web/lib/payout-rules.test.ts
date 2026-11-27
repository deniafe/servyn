import { describe, expect, it } from "vitest";
import {
  canAutoReleaseAt48h,
  evaluateConfirmation,
  extractBookingDayMonth,
  FORTY_EIGHT_HOURS_MS,
  isSlotBooked,
  validateServiceSlotNotice,
} from "./payout-rules";

describe("payout-rules", () => {
  const t0 = new Date("2026-11-26T12:00:00.000Z");

  it("holds payout for 48 hours and notifies customer when only provider confirms first", () => {
    const decision = evaluateConfirmation(
      {
        status: "paid_held",
        disputed: false,
        customerConfirmedAt: null,
        providerConfirmedAt: null,
        autoReleaseAt: null,
      },
      "provider",
      t0,
    );

    expect(decision.action).toBe("await_second_or_48h");
    if (decision.action === "await_second_or_48h") {
      expect(decision.notifyParty).toBe("customer");
      expect(decision.providerConfirmedAt).toEqual(t0);
      expect(decision.customerConfirmedAt).toBeNull();
      expect(decision.autoReleaseAt.getTime()).toBe(t0.getTime() + FORTY_EIGHT_HOURS_MS);
    }
  });

  it("holds payout for 48 hours and notifies provider when only customer confirms first", () => {
    const decision = evaluateConfirmation(
      {
        status: "paid_held",
        disputed: false,
        customerConfirmedAt: null,
        providerConfirmedAt: null,
        autoReleaseAt: null,
      },
      "customer",
      t0,
    );

    expect(decision.action).toBe("await_second_or_48h");
    if (decision.action === "await_second_or_48h") {
      expect(decision.notifyParty).toBe("provider");
      expect(decision.customerConfirmedAt).toEqual(t0);
      expect(decision.providerConfirmedAt).toBeNull();
    }
  });

  it("releases payout straight away when both customer and provider confirm", () => {
    const t1 = new Date(t0.getTime() + 5 * 60 * 1000);
    const decision = evaluateConfirmation(
      {
        status: "delivered",
        disputed: false,
        customerConfirmedAt: null,
        providerConfirmedAt: t0,
        autoReleaseAt: new Date(t0.getTime() + FORTY_EIGHT_HOURS_MS),
      },
      "customer",
      t1,
    );

    expect(decision.action).toBe("release_now");
    if (decision.action === "release_now") {
      expect(decision.status).toBe("released");
      expect(decision.releasedAt).toEqual(t1);
      expect(decision.autoReleaseAt).toBeNull();
    }
  });

  it("blocks both confirmation payout and 48h auto-release when disputed is true", () => {
    const after48h = new Date(t0.getTime() + FORTY_EIGHT_HOURS_MS + 1000);
    const disputedState = {
      status: "delivered" as const,
      disputed: true,
      customerConfirmedAt: null,
      providerConfirmedAt: t0,
      autoReleaseAt: new Date(t0.getTime() + FORTY_EIGHT_HOURS_MS),
    };

    expect(evaluateConfirmation(disputedState, "customer", after48h)).toEqual({
      action: "blocked_disputed",
    });
    expect(canAutoReleaseAt48h(disputedState, after48h)).toBe(false);
  });

  it("allows 48h auto-release once 48h has elapsed and disputed is false", () => {
    const after48h = new Date(t0.getTime() + FORTY_EIGHT_HOURS_MS);
    const eligibleState = {
      status: "delivered" as const,
      disputed: false,
      customerConfirmedAt: null,
      providerConfirmedAt: t0,
      autoReleaseAt: new Date(t0.getTime() + FORTY_EIGHT_HOURS_MS),
    };

    expect(canAutoReleaseAt48h(eligibleState, new Date(after48h.getTime() - 1000))).toBe(false);
    expect(canAutoReleaseAt48h(eligibleState, after48h)).toBe(true);
  });

  it("rejects past or <24h service slots and allows >=24h slots", () => {
    const now = new Date("2026-11-27T12:00:00");
    expect(validateServiceSlotNotice("2026-11-26 10:30", now).ok).toBe(false);
    expect(validateServiceSlotNotice("Fri 27 Nov · 13:30", now).ok).toBe(false);
    expect(validateServiceSlotNotice("Sat 28 Nov · 10:30", now).ok).toBe(false);
    expect(validateServiceSlotNotice("Sat 28 Nov · 13:30", now).ok).toBe(true);
    expect(validateServiceSlotNotice("2026-11-29 15:00", now).ok).toBe(true);
    expect(validateServiceSlotNotice(undefined, now).ok).toBe(true);

    // BST (+1) check: 2026-07-10T11:30:00Z is 12:30 BST in London
    const bstNow = new Date("2026-07-10T11:30:00.000Z");
    expect(validateServiceSlotNotice("2026-07-11 12:00", bstNow).ok).toBe(false);
    expect(validateServiceSlotNotice("2026-07-11 13:00", bstNow).ok).toBe(true);
  });

  it("matches booked slots and extracts day/month for vendor calendar", () => {
    const day = { id: "2026-11-29", weekday: "SUN", dayNum: 29, monthLabel: "Nov" };
    expect(isSlotBooked(day, "10:30", ["SUN 29 Nov · 10:30"])).toBe(true);
    expect(isSlotBooked(day, "10:30", ["2026-11-29 · 10:30"])).toBe(true);
    expect(isSlotBooked(day, "12:00", ["SUN 29 Nov · 10:30"])).toBe(false);

    expect(extractBookingDayMonth("SUN 29 Nov · 10:30")).toEqual({
      dayNum: 29,
      monthIndex: 10,
      time: "10:30",
    });
    expect(extractBookingDayMonth("2026-12-03 15:00")).toEqual({
      dayNum: 3,
      monthIndex: 11,
      time: "15:00",
    });
  });
});
