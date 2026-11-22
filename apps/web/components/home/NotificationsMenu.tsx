"use client";

import * as React from "react";
import {
  Bell,
  CalendarCheck,
  Check,
  Package,
  PoundSterling,
  Star,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
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
}

const INITIAL_NOTIFICATIONS: ReadonlyArray<NotificationItem> = [
  {
    id: "booking",
    unread: true,
    icon: CalendarCheck,
    title: "Booking confirmed",
    body: "Amara Hair & Beauty confirmed Knotless Braids for Mon, 23 Nov, 10:30.",
    time: "17h ago",
  },
  {
    id: "order",
    unread: true,
    icon: Package,
    title: "Order placed",
    body: "Order #SV-02 · 26 items · £276.00 is being prepared by the sellers.",
    time: "14h ago",
  },
  {
    id: "payout",
    unread: false,
    icon: PoundSterling,
    title: "Payout sent",
    body: "£312.40 is on its way to your bank (Stripe · arrives Friday).",
    time: "1d ago",
  },
  {
    id: "review",
    unread: false,
    icon: Star,
    title: "New review",
    rating: "5.0",
    body: "Tolu B. left a 5-star review for Wash & Silk Press.",
    time: "4d ago",
  },
];

export function NotificationsMenu() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>(() => [
    ...INITIAL_NOTIFICATIONS,
  ]);

  const unreadCount = items.filter((item) => item.unread).length;

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

  function markAllRead() {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  }

  function markOneRead(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.unread ? { ...item, unread: false } : item,
      ),
    );
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
          className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-[12px] text-cream-85 transition-colors hover:bg-white/[0.08] hover:text-gold-300"
        >
          <Bell className="size-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-[8px] border-2 border-leaf-900 bg-red px-1 text-[10px] font-extrabold text-white tabular-nums">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        className="z-[110] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[20px] border border-line bg-surface p-0 text-ink shadow-[0_24px_60px_rgba(7,30,22,0.34)] ring-0"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="font-serif text-[16px] font-semibold text-ink">
            Notifications
          </h2>
          <button
            type="button"
            disabled={unreadCount === 0}
            onClick={markAllRead}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-2 hover:text-ink disabled:cursor-default disabled:opacity-45"
          >
            <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
            <span>Mark all read</span>
          </button>
        </div>

        <div className="divide-y divide-line">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => markOneRead(item.id)}
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
      </PopoverContent>
    </Popover>
  );
}
