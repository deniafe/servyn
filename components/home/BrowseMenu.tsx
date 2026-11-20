"use client";

import * as React from "react";
import Link from "next/link";
import {
  Baby,
  Balloon,
  Brush,
  Cake,
  ChevronDown,
  Globe,
  Home,
  LayoutGrid,
  MapPin,
  Mic,
  Scissors,
  Shirt,
  Sparkles,
  Store,
  Tent,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface BrowseMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const BROWSE_SERVICES: ReadonlyArray<BrowseMenuItem> = [
  { label: "Hair & Beauty", href: "/services?category=hair-beauty", icon: Scissors },
  { label: "Barbering & Grooming", href: "/services?category=barbering-grooming", icon: Brush },
  { label: "Events & Celebrations", href: "/services?category=events-celebrations", icon: Balloon },
  { label: "Event Decoration & Styling", href: "/services?category=event-decoration", icon: Sparkles },
  { label: "Event Rentals", href: "/services?category=event-rentals", icon: Tent },
  { label: "DJs & MCs", href: "/services?category=djs-mcs", icon: Mic },
  { label: "Catering & Food", href: "/services?category=catering-food", icon: Utensils },
  { label: "Cakes & Baking", href: "/services?category=cakes-baking", icon: Cake },
  { label: "Childcare & Family", href: "/services?category=childcare-family", icon: Baby },
  { label: "Fashion & Tailoring", href: "/services?category=fashion-tailoring", icon: Shirt },
  { label: "Home Services", href: "/services?category=home-services", icon: Home },
  { label: "Other Local Services", href: "/services?category=other-local-services", icon: LayoutGrid },
];

export const BROWSE_MARKET_PLACES: ReadonlyArray<BrowseMenuItem> = [
  { label: "Pantry & Food", href: "/market?category=Food%20%26%20Pantry", icon: Utensils },
  { label: "Fabrics", href: "/market?category=Fashion%20%26%20Textiles", icon: Shirt },
  { label: "Beauty & Skincare", href: "/market?category=Beauty%20%26%20Care", icon: Sparkles },
  { label: "Homeware & Craft", href: "/market", icon: Store },
  { label: "Manchester", href: "/services", icon: MapPin },
  { label: "All locations", href: "/services", icon: Globe },
  { label: "AI Match", href: "/services?mode=ai", icon: Sparkles },
];

function BrowseColumn({
  heading,
  items,
  onSelectItem,
}: {
  heading: string;
  items: ReadonlyArray<BrowseMenuItem>;
  onSelectItem: (e: React.MouseEvent<HTMLAnchorElement>, item: BrowseMenuItem) => void;
}) {
  return (
    <div>
      <p className="px-2.5 pb-2 text-[11px] font-bold tracking-[0.09em] uppercase text-mut">
        {heading}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={(e) => onSelectItem(e, item)}
                className="group flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-[14px] leading-snug font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
              >
                <Icon
                  className="size-4 shrink-0 text-leaf-600 transition-colors group-hover:text-leaf-700"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BrowseMenu({
  isActive = true,
  onSelectAiMatch,
}: {
  isActive?: boolean;
  onSelectAiMatch?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const browseParam = new URLSearchParams(window.location.search).get("browse");
    if (browseParam !== "open") return;

    const frameId = window.requestAnimationFrame(() => {
      setOpen(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  function handleSelectItem(
    e: React.MouseEvent<HTMLAnchorElement>,
    item: BrowseMenuItem,
  ) {
    setOpen(false);
    if (item.label === "AI Match" && onSelectAiMatch) {
      e.preventDefault();
      onSelectAiMatch();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className={cn(
            "relative inline-flex cursor-pointer items-center gap-1 rounded-[8px] px-[13px] py-2 text-[14.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/75",
            isActive
              ? "text-gold-400 hover:text-gold-300 after:absolute after:inset-x-[13px] after:bottom-[2px] after:h-[2px] after:rounded-[2px] after:bg-gold-400"
              : "text-cream-75 hover:text-cream",
          )}
        >
          <span>Browse</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              open && "rotate-180",
            )}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={12}
        className="z-[110] w-[540px] max-w-[calc(100vw-2rem)] rounded-[20px] border border-line bg-surface p-5 text-ink shadow-[0_24px_60px_rgba(7,30,22,0.34)] ring-0"
      >
        <div className="grid grid-cols-[1.22fr_1fr] gap-x-5">
          <BrowseColumn
            heading="Services"
            items={BROWSE_SERVICES}
            onSelectItem={handleSelectItem}
          />
          <BrowseColumn
            heading="Market & Places"
            items={BROWSE_MARKET_PLACES}
            onSelectItem={handleSelectItem}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
