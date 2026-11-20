import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Music,
  Scissors,
  Shirt,
  Sparkles,
  Store,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardItem {
  label: string;
  meta: string;
  href: string;
  icon: LucideIcon;
  tintClass: string;
}

const CATEGORIES: ReadonlyArray<CategoryCardItem> = [
  {
    label: "Hair & Braiding",
    meta: "1 provider",
    href: "/services?category=hair-beauty",
    icon: Scissors,
    tintClass: "bg-peach",
  },
  {
    label: "Beauty & Skincare",
    meta: "1 provider",
    href: "/services?category=barbering-grooming",
    icon: Sparkles,
    tintClass: "bg-blush",
  },
  {
    label: "Childcare",
    meta: "1 provider",
    href: "/services?category=childcare-family",
    icon: Baby,
    tintClass: "bg-sky",
  },
  {
    label: "Fashion & Tailoring",
    meta: "1 provider",
    href: "/services?category=fashion-tailoring",
    icon: Shirt,
    tintClass: "bg-lav",
  },
  {
    label: "Home & Repairs",
    meta: "2 providers",
    href: "/services?category=home-services",
    icon: Wrench,
    tintClass: "bg-mint",
  },
  {
    label: "Food & Catering",
    meta: "1 provider",
    href: "/services?category=catering-food",
    icon: Utensils,
    tintClass: "bg-sage",
  },
  {
    label: "Events & Music",
    meta: "1 provider",
    href: "/services?category=djs-mcs",
    icon: Music,
    tintClass: "bg-rose",
  },
  {
    label: "African Market",
    meta: "8 products",
    href: "/market",
    icon: Store,
    tintClass: "bg-butter",
  },
];

export function CategorySection() {
  return (
    <section
      id="services"
      aria-labelledby="categories-heading"
      className="mx-auto w-full max-w-[1240px] px-6 pt-16 pb-10 lg:px-8"
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.14em] uppercase text-gold-600">
            <span
              aria-hidden="true"
              className="inline-block h-[1.5px] w-6 bg-gold-500"
            />
            Browse by category
          </p>
          <h2
            id="categories-heading"
            className="mt-2 font-serif text-[clamp(1.75rem,3vw,2.35rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-ink"
          >
            What do you need today?
          </h2>
        </div>

        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-leaf-700 transition-colors hover:text-leaf-900"
        >
          <span>All services</span>
          <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.label}
              href={category.href}
              className="group relative overflow-hidden rounded-[18px] border border-line bg-surface p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-lift"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute -top-5 -right-5 size-20 rounded-full opacity-75 transition-transform duration-300 group-hover:scale-110",
                  category.tintClass,
                )}
              />
              <div className="mb-4 flex size-11 items-center justify-center rounded-[12px] bg-leaf-900 text-gold-300">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="text-[15px] font-semibold text-ink">
                {category.label}
              </h3>
              <p className="mt-1 text-[12.5px] text-mut tabular-nums">
                {category.meta}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
