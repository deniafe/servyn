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
