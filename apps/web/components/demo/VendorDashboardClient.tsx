"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  Check,
  Download,
  FileText,
  ImagePlus,
  MapPin,
  MessageSquare,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  addServiceListing,
  addVendorPortfolioPhoto,
  computeServynFeeMinor,
  formatMinorGBP,
  markInvoiceDelivered,
  removeVendorPortfolioPhoto,
  toggleBlockedDate,
  toggleWorkingDay,
  useDemoFlow,
} from "@/lib/demo-flow-store";
import { downloadGdprPdf } from "@/lib/gdpr-pdf";
import { cn } from "@/lib/utils";

const VENDOR_CATEGORIES = [
  { label: "Hair & Beauty", tint: "bg-peach text-peach-d" },
  { label: "Barbering & Grooming", tint: "bg-sky text-sky-d" },
  { label: "Events & Celebrations", tint: "bg-lav text-lav-d" },
  { label: "Catering & Food", tint: "bg-mint text-mint-d" },
  { label: "Childcare & Family", tint: "bg-butter text-butter-d" },
  { label: "Fashion & Tailoring", tint: "bg-rose text-rose-d" },
  { label: "Home Services", tint: "bg-sage text-sage-d" },
] as const;

const MANCHESTER_AREAS = [
  "Hulme",
  "Salford",
  "Cheetham Hill",
  "Levenshulme",
  "Moss Side",
  "Chorlton",
  "Trafford",
  "Oldham",
] as const;

const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export function VendorDashboardClient({
  businessName,
  email,
  verificationStatus,
}: {
  businessName: string;
  email: string;
  verificationStatus: string;
}) {
  const {
    customServices,
    invoices,
    conversations,
    reviews,
    vendorAvailability,
    vendorPortfolioPhotos,
  } = useDemoFlow();
  const [tab, setTab] = React.useState<
    "services" | "availability" | "invoices" | "analytics" | "overview"
  >("services");

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<string>("Hair & Beauty");
  const [area, setArea] = React.useState<string>("Hulme");
  const [durationMins, setDurationMins] = React.useState("90");
  const [priceGBP, setPriceGBP] = React.useState("45.00");
  const [description, setDescription] = React.useState("");
  const [publishedBanner, setPublishedBanner] = React.useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = React.useState(false);

  const serviceInvoices = invoices.filter((i) => i.kind === "service");
  const heldMinor = serviceInvoices
    .filter((i) => i.status === "paid_held" || i.status === "delivered" || i.status === "disputed")
    .reduce((sum, i) => sum + i.subtotalMinor, 0);
  const releasedMinor = serviceInvoices
    .filter((i) => i.status === "released")
    .reduce((sum, i) => sum + i.subtotalMinor, 0);

  const previewPriceMinor = Math.max(0, Math.round((Number.parseFloat(priceGBP) || 0) * 100));
  const previewFeeMinor = computeServynFeeMinor(previewPriceMinor);

  // Current month calendar cells for Availability tab
  const now = new Date();
  const calYear = now.getFullYear();
  const calMonth = now.getMonth();
  const firstWeekday = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthHeading = new Date(calYear, calMonth, 1).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });

  function handlePublishService(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || previewPriceMinor <= 0) return;
    addServiceListing({
      providerName: businessName,
      title: title.trim(),
      category,
      area,
      durationMins: Math.max(15, Number.parseInt(durationMins, 10) || 60),
      priceMinor: previewPriceMinor,
      description:
        description.trim() || `${title.trim()} in ${area}, Greater Manchester by ${businessName}.`,
    });
    setPublishedBanner(`"${title.trim()}" is now live in the Services directory and AI Match!`);
    setTitle("");
    setDescription("");
  }

  function handlePortfolioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const maxPx = 600;
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
        addVendorPortfolioPhoto(dataUrl, file.name.replace(/\.[^.]+$/, ""));
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
    e.target.value = "";
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      await downloadGdprPdf({
        role: "vendor",
        businessName,
        email,
        verificationStatus,
        mfaEnabled: true,
        services: customServices,
        products: [],
        invoices: serviceInvoices,
        conversations: conversations.filter((c) => c.kind === "service"),
        reviews,
      });
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
      {/* Dark leaf-950 left rail matching uploaded screenshots */}
      <aside className="flex flex-col justify-between rounded-[18px] bg-leaf-950 p-5 text-cream shadow-lift">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              <Wrench className="size-3.5" aria-hidden="true" />
              <span>Service vendor</span>
            </span>
            <span className="text-[11px] font-semibold text-gold-300">2FA Active</span>
          </div>

          <nav className="space-y-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab("services")}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                tab === "services"
                  ? "border-gold-500/60 bg-leaf-800/90 text-cream"
                  : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:text-cream",
              )}
            >
              <span>Services &amp; pricing</span>
              <Plus className="size-3.5 text-gold-300" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setTab("availability")}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                tab === "availability"
                  ? "border-gold-500/60 bg-leaf-800/90 text-cream"
                  : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:text-cream",
              )}
            >
              <span>Availability &amp; calendar</span>
              <Calendar className="size-3.5 text-gold-300" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setTab("invoices")}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                tab === "invoices"
                  ? "border-gold-500/60 bg-leaf-800/90 text-cream"
                  : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:text-cream",
              )}
            >
              <span>Bookings &amp; invoices</span>
              <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-gold-ink">
                {serviceInvoices.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("analytics")}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                tab === "analytics"
                  ? "border-gold-500/60 bg-leaf-800/90 text-cream"
                  : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:text-cream",
              )}
            >
              <span>Analytics</span>
              <BarChart3 className="size-3.5 text-gold-300" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                tab === "overview"
                  ? "border-gold-500/60 bg-leaf-800/90 text-cream"
                  : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:text-cream",
              )}
            >
              <span>Reviews &amp; payouts</span>
              <ShieldCheck className="size-3.5 text-gold-300" aria-hidden="true" />
            </button>
            <Link
              href="/messages"
              className="flex items-center justify-between rounded-md border border-cream/10 bg-leaf-900/50 px-3 py-2.5 text-cream-75 transition-colors hover:text-cream"
            >
              <span>Customer chat</span>
              <MessageSquare className="size-3.5 text-gold-300" aria-hidden="true" />
            </Link>
          </nav>
        </div>

        <div className="mt-6 space-y-3 border-t border-cream/12 pt-4">
          <button
            type="button"
            disabled={exportingPdf}
            onClick={() => void handleExportPdf()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2.5 text-xs font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:opacity-60"
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span>{exportingPdf ? "Generating PDF..." : "Download GDPR PDF"}</span>
          </button>
          <p className="text-[11px] leading-relaxed text-cream-60">
            Downloadable records you can share with your accountant (UK GDPR Art. 15/20).
          </p>
        </div>
      </aside>

      {/* Main vendor workspace */}
      <div className="space-y-6">
        {/* Top Protected Payment Balance Strip */}
        <section className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-butter-d">
                Vendor Workspace · {businessName}
              </span>
              <h1 className="mt-2 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                {tab === "services"
                  ? "Services & pricing"
                  : tab === "availability"
                    ? "Availability & blocked dates"
                    : tab === "invoices"
                      ? "Bookings & customer invoices"
                      : tab === "analytics"
                        ? "Performance & revenue analytics"
                        : "Verified reviews & protected payouts"}
              </h1>
              <p className="mt-1 text-xs text-mut">
                Servyn adds 10% on top — you receive 100% of your agreed price once the customer
                confirms completion.
              </p>
            </div>

            <button
              type="button"
              disabled={exportingPdf}
              onClick={() => void handleExportPdf()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-line-2 px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-leaf-500 hover:bg-leaf-50"
            >
              <Download className="size-3.5 text-leaf-700" aria-hidden="true" />
              <span>Export GDPR &amp; Ledger PDF</span>
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-sky-d/15 bg-sky/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-d">
                Held by Servyn (Protected)
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">
                {formatMinorGBP(heldMinor)}
              </p>
              <p className="mt-0.5 text-[11px] text-mut">Releases on customer confirmation</p>
            </div>
            <div className="rounded-lg border border-mint-d/15 bg-mint/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-mint-d">
                Available &amp; Released
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">
                {formatMinorGBP(releasedMinor)}
              </p>
              <p className="mt-0.5 text-[11px] text-mut">Cleared to your payout balance</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-2 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                Custom Services Listed
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">
                {customServices.length}
              </p>
              <Link
                href="/services"
                className="mt-0.5 inline-block text-[11px] font-semibold text-leaf-700 hover:underline"
              >
                View live in directory →
              </Link>
            </div>
          </div>
        </section>

        {tab === "services" ? (
          <section className="space-y-6 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            {publishedBanner ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-leaf-300 bg-mint p-3.5 text-xs font-semibold text-mint-d">
                <span className="inline-flex items-center gap-2">
                  <Check className="size-4" aria-hidden="true" />
                  {publishedBanner}
                </span>
                <Link href="/services?mode=ai" className="underline">
                  Search in AI Match →
                </Link>
              </div>
            ) : null}

            <form onSubmit={handlePublishService} className="space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Primary Category
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {VENDOR_CATEGORIES.map((cat) => {
                    const selected = category === cat.label;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={cn(
                          "cursor-pointer rounded-md border p-3 text-left text-xs font-semibold transition-all",
                          cat.tint,
                          selected
                            ? "border-leaf-800 ring-2 ring-gold-400/60"
                            : "border-line hover:border-gold-300",
                        )}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Service Area (Greater Manchester)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MANCHESTER_AREAS.map((item) => {
                    const selected = area === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setArea(item)}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                          selected
                            ? "border-leaf-800 bg-leaf-900 text-cream"
                            : "border-line-2 bg-surface-2 text-ink-2 hover:border-leaf-500",
                        )}
                      >
                        <MapPin className="size-3" aria-hidden="true" />
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-xs font-semibold text-ink-2">Service title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Medium Knotless Braids"
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Duration (mins)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    required
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Your price (£)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={priceGBP}
                    onChange={(e) => setPriceGBP(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-2">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers what is included, prep notes, or home-visit availability..."
                  className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-4 py-3 text-xs text-ink-2">
                <span>
                  % Example: <strong>{formatMinorGBP(previewPriceMinor)}</strong> service → customer
                  pays <strong>{formatMinorGBP(previewPriceMinor + previewFeeMinor)}</strong> → you
                  receive <strong>{formatMinorGBP(previewPriceMinor)}</strong>.
                </span>
                <button
                  type="submit"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-2.5 text-sm font-semibold text-gold-ink shadow-gold hover:brightness-105"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Publish service</span>
                </button>
              </div>
            </form>

            {customServices.length > 0 ? (
              <div className="space-y-2 border-t border-line pt-4">
                <h2 className="font-serif text-base font-semibold text-ink">
                  Your Published Services
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {customServices.map((svc) => (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-ink">{svc.title}</p>
                        <p className="text-mut">
                          {svc.category} · {svc.area} · {svc.durationMins} mins
                        </p>
                      </div>
                      <span className="font-serif text-sm font-semibold text-leaf-900">
                        {formatMinorGBP(svc.priceMinor)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="space-y-3 border-t border-line pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif text-base font-semibold text-ink">
                    Portfolio Photos ({vendorPortfolioPhotos.length}/8)
                  </h2>
                  <p className="text-xs text-mut">
                    Resized automatically in your browser for fast Manchester mobile browsing.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line-2 bg-surface-2 px-3.5 py-2 text-xs font-semibold text-ink hover:border-gold-400">
                  <ImagePlus className="size-3.5 text-leaf-700" aria-hidden="true" />
                  <span>Upload photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePortfolioUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              {vendorPortfolioPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {vendorPortfolioPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-lg border border-line bg-surface-2"
                    >
                      <Image
                        src={photo.dataUrl}
                        alt={photo.caption}
                        width={300}
                        height={220}
                        unoptimized
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeVendorPortfolioPhoto(photo.id)}
                        aria-label={`Remove ${photo.caption}`}
                        className="absolute top-1.5 right-1.5 cursor-pointer rounded-full bg-leaf-950/85 p-1.5 text-cream hover:bg-blush-d"
                      >
                        <Trash2 className="size-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {tab === "availability" ? (
          <section className="grid gap-6 rounded-[18px] border border-line bg-surface p-6 shadow-soft lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">Weekly working hours</h2>
              <p className="mt-1 text-xs text-mut">
                Toggle open days and adjust your standard Manchester booking window.
              </p>
              <div className="mt-4 space-y-2">
                {DAYS_ORDER.map((day) => {
                  const cfg = vendorAvailability.workingDays[day] ?? {
                    open: true,
                    from: "09:00",
                    to: "18:00",
                  };
                  return (
                    <div
                      key={day}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-2 px-3 py-2 text-xs"
                    >
                      <label className="flex cursor-pointer items-center gap-2 font-semibold text-ink">
                        <input
                          type="checkbox"
                          checked={cfg.open}
                          onChange={(e) => toggleWorkingDay(day, { open: e.target.checked })}
                          className="size-3.5 accent-leaf-700"
                        />
                        <span>{day}</span>
                      </label>
                      {cfg.open ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={cfg.from}
                            onChange={(e) => toggleWorkingDay(day, { from: e.target.value })}
                            className="rounded border border-line-2 bg-surface px-2 py-1 text-xs text-ink"
                          />
                          <span className="text-mut">to</span>
                          <input
                            type="time"
                            value={cfg.to}
                            onChange={(e) => toggleWorkingDay(day, { to: e.target.value })}
                            className="rounded border border-line-2 bg-surface px-2 py-1 text-xs text-ink"
                          />
                        </div>
                      ) : (
                        <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-mut">
                          Closed
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">
                Block specific dates ({monthHeading})
              </h2>
              <p className="mt-1 text-xs text-mut">
                Click any open day to mark yourself unavailable.
              </p>

              <div className="mt-4 rounded-lg border border-line bg-surface-2 p-4">
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-mut">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: firstWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                    const weekdayName =
                      DAYS_ORDER[
                        (new Date(calYear, calMonth, dayNum).getDay() + 6) % 7
                      ] ?? "Monday";
                    const isOpen = vendorAvailability.workingDays[weekdayName]?.open ?? true;
                    const isBlocked = vendorAvailability.blockedDates.includes(dateStr);

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={!isOpen}
                        onClick={() => toggleBlockedDate(dateStr)}
                        className={cn(
                          "rounded-md py-2 text-xs font-semibold transition-colors",
                          !isOpen
                            ? "cursor-not-allowed bg-surface text-mut opacity-50"
                            : isBlocked
                              ? "cursor-pointer bg-blush text-blush-d"
                              : "cursor-pointer bg-mint text-mint-d hover:brightness-95",
                        )}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-mut">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-mint" /> Available
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-blush" /> Blocked
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-surface" /> Closed day
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "invoices" ? (
          <section className="space-y-4 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-semibold text-ink">
                Service Bookings &amp; Invoices
              </h2>
              <Link
                href="/messages"
                className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-semibold text-gold-ink shadow-gold"
              >
                <FileText className="size-3.5" aria-hidden="true" />
                <span>Send invoice in chat</span>
              </Link>
            </div>

            <div className="space-y-3">
              {serviceInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-leaf-900 px-2 py-0.5 text-[10px] font-bold text-gold-300">
                        {inv.refId}
                      </span>
                      <p className="font-serif text-base font-semibold text-ink">{inv.title}</p>
                    </div>
                    <p className="mt-0.5 text-mut">
                      Customer: {inv.customerName}
                      {inv.agreedDate ? ` · ${inv.agreedDate}` : ""}
                      {inv.agreedLocation ? ` · ${inv.agreedLocation}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-serif text-base font-semibold tabular-nums text-ink">
                      {formatMinorGBP(inv.subtotalMinor)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-bold",
                        inv.status === "released"
                          ? "bg-mint text-mint-d"
                          : inv.status === "disputed"
                            ? "bg-blush text-blush-d"
                            : inv.status === "paid_held" || inv.status === "delivered"
                              ? "bg-sky text-sky-d"
                              : "bg-butter text-butter-d",
                      )}
                    >
                      {inv.status === "sent"
                        ? "Awaiting payment"
                        : inv.status === "paid_held"
                          ? "Held by Servyn"
                          : inv.status === "delivered"
                            ? "Delivered"
                            : inv.status === "disputed"
                              ? "Payout paused · Review"
                              : "Released"}
                    </span>
                    {inv.status === "paid_held" ? (
                      <button
                        type="button"
                        onClick={() => markInvoiceDelivered(inv.id)}
                        className="cursor-pointer rounded-full bg-leaf-800 px-3.5 py-1.5 font-semibold text-cream hover:bg-leaf-700"
                      >
                        Mark delivered
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "analytics" ? (
          <section className="space-y-5 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-line bg-surface-2 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Gross Earnings
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-leaf-900">
                  {formatMinorGBP(heldMinor + releasedMinor)}
                </p>
                <p className="mt-1 text-xs font-semibold text-mint-d">+18% vs last month</p>
              </div>
              <div className="rounded-lg border border-line bg-surface-2 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Avg Booking Value
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">
                  {serviceInvoices.length > 0
                    ? formatMinorGBP(
                        Math.round(
                          serviceInvoices.reduce((s, i) => s + i.subtotalMinor, 0) /
                            serviceInvoices.length,
                        ),
                      )
                    : "£0.00"}
                </p>
                <p className="mt-1 text-xs text-mut">Across {serviceInvoices.length} bookings</p>
              </div>
              <div className="rounded-lg border border-line bg-surface-2 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Completion Rate
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">
                  98%
                </p>
                <p className="mt-1 text-xs text-mut">Zero missed appointments</p>
              </div>
              <div className="rounded-lg border border-line bg-surface-2 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Verified Rating
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-gold-600">
                  4.9★
                </p>
                <p className="mt-1 text-xs text-mut">{reviews.length} verified reviews</p>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-surface-2 p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif text-lg font-semibold text-ink">
                  6-Month Revenue Trend
                </h2>
                <span className="text-xs text-mut">GBP · Manchester launch</span>
              </div>
              <div className="mt-6 flex h-40 items-end gap-3">
                {[
                  { month: "Jun", pounds: 240, pct: "h-14" },
                  { month: "Jul", pounds: 390, pct: "h-20" },
                  { month: "Aug", pounds: 480, pct: "h-24" },
                  { month: "Sep", pounds: 610, pct: "h-28" },
                  { month: "Oct", pounds: 745, pct: "h-32" },
                  { month: "Nov", pounds: 890, pct: "h-36" },
                ].map((bar, idx) => (
                  <div key={bar.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10.5px] font-bold tabular-nums text-ink-2">
                      £{bar.pounds}
                    </span>
                    <div
                      className={cn(
                        "w-full max-w-[44px] rounded-t-md transition-colors",
                        bar.pct,
                        idx === 5
                          ? "bg-gold-500"
                          : "bg-leaf-700 hover:bg-leaf-900",
                      )}
                    />
                    <span className="text-[11px] font-semibold text-mut">{bar.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {tab === "overview" ? (
          <section className="space-y-5 rounded-[18px] border border-line bg-surface p-6 shadow-soft text-sm text-ink-2">
            <div className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
              <CalendarCheck className="size-5 text-gold-600" aria-hidden="true" />
              <span>How Protected Payments Work for Vendors</span>
            </div>
            <p className="leading-relaxed">
              Customers pay via Stripe at booking or invoice acceptance. Funds are held within
              Servyn (not escrow) until the customer confirms the service was delivered
              satisfactorily, at which point your full agreed price becomes available and released.
            </p>

            <div className="border-t border-line pt-4">
              <h2 className="font-serif text-lg font-semibold text-ink">
                Verified Customer Reviews ({reviews.length})
              </h2>
              <div className="mt-3 space-y-2.5">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-md border border-line bg-surface-2 p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">
                        {rev.authorName} · {rev.title}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-gold-600">
                        <Star className="size-3.5 fill-current" aria-hidden="true" />
                        {rev.rating}.0
                      </span>
                    </div>
                    <p className="mt-1 text-mut">&ldquo;{rev.comment}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
