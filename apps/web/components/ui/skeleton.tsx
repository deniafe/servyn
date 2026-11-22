import { cn } from "@/lib/utils";

/** Bare shimmering block. */
export function SkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return <div className={cn("sv-shimmer rounded-[14px]", className)} />;
}

function HeaderSkeleton() {
  return (
    <div className="fixed inset-x-0 top-0 z-[100] bg-leaf-900">
      <div
        aria-hidden="true"
        className="h-1.5 w-full"
        style={{ background: "var(--sv-kente)" }}
      />
      <div className="mx-auto flex h-[calc(var(--sv-hdr-h)-6px)] max-w-[1240px] items-center gap-4 px-6">
        <SkeletonBlock className="h-6 w-20 rounded-[8px] bg-cream/10" />
        <SkeletonBlock className="h-7 w-28 rounded-full bg-cream/10" />
        <div className="ml-auto flex items-center gap-2.5">
          <SkeletonBlock className="size-10 rounded-[12px] bg-cream/10" />
          <SkeletonBlock className="size-10 rounded-[12px] bg-cream/10" />
          <SkeletonBlock className="size-10 rounded-[12px] bg-cream/10" />
          <SkeletonBlock className="size-10 rounded-full bg-cream/10" />
        </div>
      </div>
    </div>
  );
}

/** Card skeleton used across the directory, market and favourites grids. */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] border border-line bg-surface shadow-soft",
        className,
      )}
    >
      <SkeletonBlock className="h-[108px] rounded-none border-b border-line" />
      <div className="flex flex-col gap-2 p-4">
        <SkeletonBlock className="h-4 w-2/3" />
        <SkeletonBlock className="h-3 w-1/2" />
        <div className="mt-2 flex gap-1.5">
          <SkeletonBlock className="h-5 w-16 rounded-full" />
          <SkeletonBlock className="h-5 w-14 rounded-full" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <SkeletonBlock className="h-5 w-12" />
          <SkeletonBlock className="h-7 w-14 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}

/** Inline Suspense fallback for the homepage data sections (Hero stays visible immediately). */
export function HomeDataSectionsSkeleton() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1240px] px-6 pt-16 pb-10 lg:px-8">
        <SkeletonBlock className="h-3 w-36" />
        <SkeletonBlock className="mt-3 h-8 w-64" />
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-[136px] rounded-[18px]" />
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1240px] px-6 py-10 lg:px-8">
        <SkeletonBlock className="h-3 w-36" />
        <SkeletonBlock className="mt-3 h-8 w-72" />
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1240px] px-6 pt-10 pb-24 lg:px-8">
        <SkeletonBlock className="h-3 w-36" />
        <SkeletonBlock className="mt-3 h-8 w-80" />
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}

/** Home route loading state. */
export function HomeLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <HeaderSkeleton />
      <main className="flex flex-1 flex-col pt-[var(--sv-hdr-h)]">
        <section className="hero-surface">
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
            <div className="flex flex-col items-start gap-5">
              <SkeletonBlock className="h-3 w-40 bg-cream/10" />
              <SkeletonBlock className="h-12 w-full max-w-[18ch] bg-cream/10" />
              <SkeletonBlock className="h-12 w-2/3 bg-cream/10" />
              <SkeletonBlock className="h-4 w-full max-w-[44ch] bg-cream/10" />
              <SkeletonBlock className="h-4 w-4/5 max-w-[40ch] bg-cream/10" />
              <SkeletonBlock className="mt-2 h-14 w-full max-w-[600px] rounded-[16px] bg-cream/10" />
              <SkeletonBlock className="h-3 w-72 bg-cream/10" />
            </div>
            <SkeletonBlock className="mx-auto aspect-square w-full max-w-[420px] rounded-[24px] bg-cream/10" />
          </div>
        </section>
        <HomeDataSectionsSkeleton />
      </main>
    </div>
  );
}

/** Inline Suspense fallback for the services page body. */
export function ServicesWorkspaceSkeleton() {
  return (
    <>
      <section className="bg-leaf-900">
        <div className="mx-auto w-full max-w-[1240px] px-6 py-9 lg:px-8 lg:py-11">
          <SkeletonBlock className="h-10 w-72 bg-cream/10" />
          <SkeletonBlock className="mt-3 h-4 w-[44ch] max-w-full bg-cream/10" />
          <SkeletonBlock className="mt-6 h-12 w-full max-w-[560px] rounded-full bg-cream/10" />
          <SkeletonBlock className="mt-3 h-7 w-72 rounded-full bg-cream/10" />
        </div>
        <div
          aria-hidden="true"
          className="h-[3px] w-full"
          style={{ background: "var(--sv-kente)" }}
        />
      </section>
      <div className="mx-auto w-full max-w-[1240px] px-6 py-8 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[248px_1fr]">
          <SkeletonBlock className="hidden h-[560px] rounded-[20px] lg:block" />
          <div>
            <SkeletonBlock className="h-4 w-64" />
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Services directory loading state. */
export function ServicesLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <HeaderSkeleton />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <ServicesWorkspaceSkeleton />
      </main>
    </div>
  );
}

/** Inline Suspense fallback for the market page body. */
export function MarketWorkspaceSkeleton() {
  return (
    <>
      <section className="bg-leaf-900">
        <div className="mx-auto w-full max-w-[1240px] px-6 py-9 lg:px-8 lg:py-11">
          <SkeletonBlock className="h-10 w-56 bg-cream/10" />
          <SkeletonBlock className="mt-3 h-4 w-[50ch] max-w-full bg-cream/10" />
          <SkeletonBlock className="mt-6 h-10 w-64 rounded-[14px] bg-cream/10" />
        </div>
        <div
          aria-hidden="true"
          className="h-[3px] w-full"
          style={{ background: "var(--sv-kente)" }}
        />
      </section>
      <div className="mx-auto w-full max-w-[1240px] px-6 py-8 lg:px-8">
        <SkeletonBlock className="h-12 w-full rounded-[18px]" />
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}

/** Market catalogue loading state. */
export function MarketLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <HeaderSkeleton />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <MarketWorkspaceSkeleton />
      </main>
    </div>
  );
}
