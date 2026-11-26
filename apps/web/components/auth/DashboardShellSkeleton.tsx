export function DashboardShellSkeleton() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="h-[var(--sv-hdr-h)] bg-leaf-900" />
      <div className="mx-auto grid max-w-[1240px] gap-6 px-6 py-10 lg:grid-cols-[270px_1fr] max-[720px]:px-4">
        <div className="h-[460px] animate-pulse rounded-[18px] bg-leaf-950/90" />
        <div className="space-y-6">
          <div className="h-36 animate-pulse rounded-[18px] border border-line bg-surface" />
          <div className="h-72 animate-pulse rounded-[18px] border border-line bg-surface" />
        </div>
      </div>
    </div>
  );
}
