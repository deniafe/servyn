"use client";

import {
  formatMinorGBP,
  type DemoConversation,
  type DemoInvoice,
  type DemoProductListing,
  type DemoServiceListing,
} from "@/lib/demo-flow-store";

export interface GdprExportPayload {
  role: "vendor" | "seller";
  businessName: string;
  email: string;
  verificationStatus: string;
  mfaEnabled: boolean;
  services: DemoServiceListing[];
  products: DemoProductListing[];
  invoices: DemoInvoice[];
  conversations: DemoConversation[];
}

export async function downloadGdprPdf(payload: GdprExportPayload): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 0;

  // Header band (Servyn leaf-900 + gold-500 rule)
  doc.setFillColor(11, 46, 34);
  doc.rect(0, 0, pageWidth, 84, "F");
  doc.setFillColor(212, 148, 40);
  doc.rect(0, 84, pageWidth, 4, "F");

  doc.setTextColor(251, 248, 241);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Servyn", margin, 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("UK GDPR Data & Business Records Export (Article 15 / 20)", margin, 56);

  doc.setFontSize(9);
  doc.setTextColor(232, 200, 120);
  doc.text(`Generated: ${new Date().toISOString()}`, margin, 72);

  y = 114;

  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      y = 44;
    }
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(11, 46, 34);
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(220, 214, 198);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  };

  const drawRow = (label: string, value: string) => {
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(70, 80, 74);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 30, 25);
    doc.text(value, margin + 150, y, { maxWidth: pageWidth - margin * 2 - 150 });
    y += 16;
  };

  // 1. Identity & Compliance
  drawSectionTitle("1. Account, Identity & Compliance");
  drawRow("Role Context:", payload.role === "vendor" ? "Service Vendor" : "Product Seller");
  drawRow("Business / Storefront:", payload.businessName);
  drawRow("Account Email:", payload.email);
  drawRow("2FA Security:", payload.mfaEnabled ? "Enabled (TOTP / Clerk)" : "Pending");
  drawRow("Verification Status:", payload.verificationStatus);
  y += 8;

  // 2. Protected Payment Balances
  const heldMinor = payload.invoices
    .filter((i) => i.status === "paid_held" || i.status === "delivered")
    .reduce((acc, i) => acc + i.subtotalMinor, 0);
  const releasedMinor = payload.invoices
    .filter((i) => i.status === "released")
    .reduce((acc, i) => acc + i.subtotalMinor, 0);

  drawSectionTitle("2. Protected Payment Summary (Stripe)");
  drawRow("Held by Servyn (Protected):", formatMinorGBP(heldMinor));
  drawRow("Available & Released:", formatMinorGBP(releasedMinor));
  drawRow("Total Invoices Recorded:", String(payload.invoices.length));
  y += 8;

  // 3. Listings
  if (payload.role === "vendor") {
    drawSectionTitle(`3. Published Service Listings (${payload.services.length})`);
    if (payload.services.length === 0) {
      drawRow("Listings:", "No custom services added in this session.");
    } else {
      for (const svc of payload.services) {
        drawRow(
          `${svc.title} (${svc.area})`,
          `${svc.category} · ${svc.durationMins} mins · ${formatMinorGBP(svc.priceMinor)}`,
        );
      }
    }
  } else {
    drawSectionTitle(`3. Published Product Listings (${payload.products.length})`);
    if (payload.products.length === 0) {
      drawRow("Listings:", "No custom products added in this session.");
    } else {
      for (const prd of payload.products) {
        drawRow(
          prd.title,
          `${prd.category} · Retail ${formatMinorGBP(prd.retailPriceMinor)} · Bulk ${formatMinorGBP(prd.bulkPriceMinor)} (min ${prd.minBulkQty})`,
        );
      }
    }
  }
  y += 8;

  // 4. Invoices & Payout Ledger
  drawSectionTitle(`4. Invoices & Payout Ledger (${payload.invoices.length})`);
  for (const inv of payload.invoices) {
    ensureSpace(34);
    const statusLabel =
      inv.status === "sent"
        ? "Awaiting Payment"
        : inv.status === "paid_held"
          ? "Paid · Held by Servyn"
          : inv.status === "delivered"
            ? "Delivered · Awaiting Confirmation"
            : "Released to Provider";
    drawRow(
      `${inv.id} (${inv.kind.toUpperCase()})`,
      `${inv.title} · Subtotal ${formatMinorGBP(inv.subtotalMinor)} · Fee ${formatMinorGBP(inv.feeMinor)} · ${statusLabel}`,
    );
  }
  y += 8;

  // 5. Conversations & Agreed Terms
  drawSectionTitle(`5. Customer Conversations (${payload.conversations.length})`);
  for (const conv of payload.conversations) {
    drawRow(
      `${conv.customerName} — ${conv.listingTitle}`,
      `${conv.messages.length} messages · Area: ${conv.area}`,
    );
  }

  // Footer
  ensureSpace(40);
  y += 14;
  doc.setDrawColor(220, 214, 198);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 110, 105);
  doc.text(
    "Downloadable records you can share with your accountant · Protected payments (not escrow) · UK GDPR compliant export.",
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 },
  );

  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`servyn-gdpr-export-${payload.role}-${dateTag}.pdf`);
}
