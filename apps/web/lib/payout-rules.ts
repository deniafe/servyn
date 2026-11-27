export const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export interface InvoicePayoutState {
  status: "sent" | "paid_held" | "delivered" | "disputed" | "released" | "refunded";
  disputed: boolean;
  customerConfirmedAt: Date | null;
  providerConfirmedAt: Date | null;
  autoReleaseAt: Date | null;
}

export type ConfirmationDecision =
  | { action: "blocked_disputed" }
  | { action: "invalid_status" }
  | {
      action: "release_now";
      status: "released";
      releasedAt: Date;
      autoReleaseAt: null;
      customerConfirmedAt: Date;
      providerConfirmedAt: Date;
    }
  | {
      action: "await_second_or_48h";
      status: "delivered";
      autoReleaseAt: Date;
      notifyParty: "customer" | "provider";
      customerConfirmedAt: Date | null;
      providerConfirmedAt: Date | null;
    };

export function evaluateConfirmation(
  state: InvoicePayoutState,
  actor: "customer" | "provider",
  now: Date,
): ConfirmationDecision {
  if (state.disputed || state.status === "disputed") {
    return { action: "blocked_disputed" };
  }
  if (state.status !== "paid_held" && state.status !== "delivered") {
    return { action: "invalid_status" };
  }

  const customerConfirmedAt =
    actor === "customer" ? (state.customerConfirmedAt ?? now) : state.customerConfirmedAt;
  const providerConfirmedAt =
    actor === "provider" ? (state.providerConfirmedAt ?? now) : state.providerConfirmedAt;

  if (customerConfirmedAt && providerConfirmedAt) {
    return {
      action: "release_now",
      status: "released",
      releasedAt: now,
      autoReleaseAt: null,
      customerConfirmedAt,
      providerConfirmedAt,
    };
  }

  return {
    action: "await_second_or_48h",
    status: "delivered",
    autoReleaseAt:
      state.autoReleaseAt ?? new Date(now.getTime() + FORTY_EIGHT_HOURS_MS),
    notifyParty: actor === "provider" ? "customer" : "provider",
    customerConfirmedAt,
    providerConfirmedAt,
  };
}

export function canAutoReleaseAt48h(state: InvoicePayoutState, now: Date): boolean {
  if (state.disputed || state.status === "disputed") return false;
  if (state.status === "released" || state.status === "refunded") return false;
  if (!state.autoReleaseAt) return false;
  return now.getTime() >= state.autoReleaseAt.getTime();
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function makeLondonDate(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const approxUtc = new Date(Date.UTC(year, monthIndex, day, hour, minute, 0, 0));
  const tzPart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "shortOffset",
  })
    .formatToParts(approxUtc)
    .find((p) => p.type === "timeZoneName")?.value;
  const offsetHours = tzPart && /\+1\b/.test(tzPart) ? 1 : 0;
  return new Date(approxUtc.getTime() - offsetHours * 60 * 60 * 1000);
}

function parseAgreedServiceDate(agreedDate: string, now: Date): Date | null {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[\sT·]+(\d{2}):(\d{2}))?/.exec(
    agreedDate.trim(),
  );
  if (isoMatch) {
    return makeLondonDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
      Number(isoMatch[4] ?? "9"),
      Number(isoMatch[5] ?? "0"),
    );
  }

  const labelMatch =
    /^(?:[a-z]{3}\s+)?(\d{1,2})\s+([a-z]{3})(?:\s*[·,]\s*(\d{2}):(\d{2}))?/i.exec(
      agreedDate.trim(),
    );
  if (labelMatch) {
    const day = Number(labelMatch[1]);
    const month = MONTH_INDEX[labelMatch[2]!.toLowerCase()];
    if (month === undefined) return null;
    const hour = Number(labelMatch[3] ?? "9");
    const minute = Number(labelMatch[4] ?? "0");
    let year = now.getUTCFullYear();
    if (month < now.getUTCMonth() - 2) {
      year += 1;
    }
    return makeLondonDate(year, month, day, hour, minute);
  }

  return null;
}

export function validateServiceSlotNotice(
  agreedDate: string | undefined,
  now: Date,
): { ok: true } | { ok: false; message: string } {
  if (!agreedDate?.trim()) return { ok: true };
  const parsed = parseAgreedServiceDate(agreedDate, now);
  if (!parsed || Number.isNaN(parsed.getTime())) return { ok: true };
  if (parsed.getTime() < now.getTime() + 24 * 60 * 60 * 1000) {
    return {
      ok: false,
      message: "Bookings require at least 24 hours' notice. Please choose a later slot.",
    };
  }
  return { ok: true };
}

export function normalizeSlotKey(agreedDate: string): string {
  return agreedDate
    .trim()
    .toLowerCase()
    .replace(/\s*[·,]\s*/g, " ")
    .replace(/\s+/g, " ");
}

export function isSlotBooked(
  day: { id: string; weekday: string; dayNum: number; monthLabel: string },
  time: string,
  bookedSlots: ReadonlyArray<string>,
): boolean {
  if (bookedSlots.length === 0) return false;
  const labelKey = normalizeSlotKey(
    `${day.weekday} ${day.dayNum} ${day.monthLabel} ${time}`,
  );
  const shortLabelKey = normalizeSlotKey(`${day.dayNum} ${day.monthLabel} ${time}`);
  const isoKey = normalizeSlotKey(`${day.id} ${time}`);

  return bookedSlots.some((raw) => {
    const k = normalizeSlotKey(raw);
    return k === labelKey || k === isoKey || k.endsWith(shortLabelKey);
  });
}

export function extractBookingDayMonth(
  agreedDate: string,
): { dayNum: number; monthIndex: number; time: string | null } | null {
  const trimmed = agreedDate.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[\sT·]+(\d{2}:\d{2}))?/.exec(trimmed);
  if (isoMatch) {
    return {
      dayNum: Number(isoMatch[3]),
      monthIndex: Number(isoMatch[2]) - 1,
      time: isoMatch[4] ?? null,
    };
  }
  const labelMatch =
    /^(?:[a-z]{3}\s+)?(\d{1,2})\s+([a-z]{3})(?:\s*[·,]\s*(\d{2}:\d{2}))?/i.exec(trimmed);
  if (labelMatch) {
    const monthIndex = MONTH_INDEX[labelMatch[2]!.toLowerCase()];
    if (monthIndex === undefined) return null;
    return {
      dayNum: Number(labelMatch[1]),
      monthIndex,
      time: labelMatch[3] ?? null,
    };
  }
  return null;
}
