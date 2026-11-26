"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  Check,
  FileText,
  Package,
  PoundSterling,
  Star,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { formatMinorGBP, useDemoFlow } from "@/lib/demo-flow-store";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NotificationItem {
  id: string;
  unread: boolean;
  icon: LucideIcon;
  title: string;
  rating?: string;
  body: string;
  time: string;
  href: string;
}

const READ_STORAGE_KEY = "servyn_read_notifs_v1";

function readStoredIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function NotificationsMenu() {
  const router = useRouter();
  const { invoices, reviews, currentUserId } = useDemoFlow();
  const [open, setOpen] = React.useState(false);
  const [readIds, setReadIds] = React.useState<Set<string>>(() => readStoredIds());

  React.useEffect(() => {
    const param = new URLSearchParams(window.location.search).get(
      "notifications",
    );
    if (param !== "open") return;

    const frameId = window.requestAnimationFrame(() => {
      setOpen(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const items = React.useMemo<NotificationItem[]>(() => {
    if (!currentUserId) return [];

    const myInvoices = invoices.filter(
      (inv) =>
        inv.customerUserId === currentUserId ||
        inv.providerUserId === currentUserId,
    );

    const list: Array<NotificationItem & { sortAt: string }> = [];

    for (const inv of myInvoices) {
      const isProvider = inv.providerUserId === currentUserId;
      const href = `/messages?thread=${encodeURIComponent(inv.conversationId)}`;

      if (inv.status === "sent" && !isProvider) {
        const id = `inv-sent-${inv.id}`;
        list.push({
          id,
          unread: !readIds.has(id),
          icon: FileText,
          title: inv.discountNote ? "Personal offer received" : "Invoice received",
          body: `${inv.providerName} sent an agreed invoice for ${inv.title} (${formatMinorGBP(inv.totalMinor)}).`,
          time: formatShortDate(inv.createdAt),
          href,
          sortAt: inv.createdAt,
        });
      } else if (inv.status === "paid_held") {
        const id = `inv-paid-${inv.id}`;
        list.push({
          id,
          unread: !readIds.has(id),
          icon: inv.kind === "service" ? CalendarCheck : Package,
          title: isProvider ? "New paid order" : "Payment protected",
          body: isProvider
            ? `${inv.customerName} paid ${formatMinorGBP(inv.totalMinor)} for ${inv.title}.`
            : `${formatMinorGBP(inv.totalMinor)} is held safely for ${inv.title}.`,
          time: formatShortDate(inv.paidAt ?? inv.createdAt),
          href,
          sortAt: inv.paidAt ?? inv.createdAt,
        });
      } else if (inv.status === "delivered" && !isProvider) {
        const id = `inv-deliv-${inv.id}`;
        list.push({
          id,
          unread: !readIds.has(id),
          icon: Package,
          title: inv.kind === "service" ? "Service completed" : "Order delivered",
          body: `Confirm everything is OK for ${inv.title} to release ${formatMinorGBP(inv.subtotalMinor)} to ${inv.providerName}.`,
          time: formatShortDate(inv.deliveredAt ?? inv.createdAt),
          href,
          sortAt: inv.deliveredAt ?? inv.createdAt,
        });
      } else if (inv.status === "released") {
        const id = `inv-rel-${inv.id}`;
        list.push({
          id,
          unread: !readIds.has(id),
          icon: PoundSterling,
          title: isProvider ? "You've been paid!" : "Order completed",
          body: isProvider
            ? `${formatMinorGBP(inv.subtotalMinor)} released from ${inv.customerName} for ${inv.title}.`
            : `Payment released to ${inv.providerName} for ${inv.title}.`,
          time: formatShortDate(inv.releasedAt ?? inv.createdAt),
          href: isProvider ? (inv.kind === "service" ? "/vendor" : "/seller") : href,
          sortAt: inv.releasedAt ?? inv.createdAt,
        });
      } else if (inv.status === "disputed") {
        const id = `inv-disp-${inv.id}`;
        list.push({
          id,
          unread: !readIds.has(id),
          icon: AlertTriangle,
          title: "Issue reported",
          body: `Payout paused for ${inv.title} (${inv.refId}).`,
          time: formatShortDate(inv.disputedAt ?? inv.createdAt),
          href,
          sortAt: inv.disputedAt ?? inv.createdAt,
        });
      }
    }

    const providerInvIds = new Set(
      myInvoices.filter((inv) => inv.providerUserId === currentUserId).map((inv) => inv.id),
    );
    for (const rev of reviews) {
      if (!providerInvIds.has(rev.invoiceId)) continue;
      const id = `rev-${rev.id}`;
      list.push({
        id,
        unread: !readIds.has(id),
        icon: Star,
        title: "New review",
        rating: `${rev.rating}.0`,
        body: `${rev.authorName} rated ${rev.title}: "${rev.comment}"`,
        time: formatShortDate(rev.createdAt),
        href: "/vendor",
        sortAt: rev.createdAt,
      });
    }

    return list
      .sort((a, b) => b.sortAt.localeCompare(a.sortAt))
      .slice(0, 12);
  }, [currentUserId, invoices, reviews, readIds]);

  const unreadCount = items.filter((item) => item.unread).length;

  function persistReadIds(next: Set<string>) {
    setReadIds(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore storage errors.
      }
    }
  }

  function markAllRead() {
    const next = new Set(readIds);
    for (const item of items) next.add(item.id);
    persistReadIds(next);
  }

  function handleSelectNotification(item: NotificationItem) {
    if (item.unread) {
      const next = new Set(readIds);
      next.add(item.id);
      persistReadIds(next);
    }
    setOpen(false);
    router.push(item.href);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} unread)`
              : "Notifications"
          }
          aria-expanded={open}
          className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-[12px] text-cream-85 transition-colors hover:bg-cream/10 hover:text-gold-300"
        >
          <Bell className="size-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-[8px] border-2 border-leaf-900 bg-red px-1 text-[10px] font-extrabold text-cream tabular-nums">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        className="z-[110] w-[360px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[20px] border border-line bg-surface p-0 text-ink shadow-[0_24px_60px_rgba(7,30,22,0.34)] ring-0"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="font-serif text-[16px] font-semibold text-ink">
            Notifications
          </h2>
          {items.length > 0 ? (
            <button
              type="button"
              disabled={unreadCount === 0}
              onClick={markAllRead}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-2 hover:text-ink disabled:cursor-default disabled:opacity-45"
            >
              <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
              <span>Mark all read</span>
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="font-serif text-sm font-semibold text-ink">
              You&apos;re all caught up
            </p>
            <p className="mt-1 text-xs text-mut">
              Bookings, invoices, payouts, and customer reviews will appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-[380px] divide-y divide-line overflow-y-auto">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNotification(item)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3.5 px-5 py-4 text-left transition-colors",
                    item.unread
                      ? "bg-gold-50/80 hover:bg-gold-50"
                      : "bg-surface hover:bg-surface-2",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-leaf-900 text-gold-300">
                    <Icon
                      className="size-[18px]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-ink">
                        {item.title}
                      </span>
                      {item.rating && (
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink tabular-nums">
                          <Star
                            className="size-3 fill-gold-500 text-gold-500"
                            aria-hidden="true"
                          />
                          {item.rating}
                        </span>
                      )}
                      {item.unread && (
                        <span
                          aria-label="Unread"
                          className="size-2 shrink-0 rounded-full bg-gold-500"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-[1.45] text-mut">
                      {item.body}
                    </p>
                    <p className="mt-1.5 text-[11.5px] text-placeholder tabular-nums">
                      {item.time}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
