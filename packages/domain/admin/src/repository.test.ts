import { describe, it, expect } from "vitest";
import {
  SupportTicketStateSchema,
  SupportQueueSchema,
  ExportJobKindSchema,
  ExportFormatSchema,
  AuditLogMetadataSchema,
} from "./schema";

describe("SupportTicketStateSchema", () => {
  it("accepts all valid states", () => {
    for (const s of ["open", "in_progress", "resolved", "closed"] as const) {
      expect(SupportTicketStateSchema.parse(s)).toBe(s);
    }
  });
});

describe("SupportQueueSchema", () => {
  it("accepts all valid queues", () => {
    for (const q of ["general", "payments", "disputes", "safety", "technical"] as const) {
      expect(SupportQueueSchema.parse(q)).toBe(q);
    }
  });
});

describe("ExportJobKindSchema", () => {
  it("accepts transactions, bookings, tax_summary", () => {
    expect(ExportJobKindSchema.parse("transactions")).toBe("transactions");
    expect(ExportJobKindSchema.parse("tax_summary")).toBe("tax_summary");
  });
});

describe("ExportFormatSchema", () => {
  it("accepts csv and pdf", () => {
    expect(ExportFormatSchema.parse("csv")).toBe("csv");
    expect(ExportFormatSchema.parse("pdf")).toBe("pdf");
  });
  it("rejects xlsx", () => {
    expect(() => ExportFormatSchema.parse("xlsx")).toThrow();
  });
});

describe("AuditLogMetadataSchema", () => {
  it("accepts any string-keyed object", () => {
    const result = AuditLogMetadataSchema.parse({ bookingId: "bk-1", reason: "admin" });
    expect(result["bookingId"]).toBe("bk-1");
  });

  it("parses an empty object", () => {
    expect(AuditLogMetadataSchema.parse({})).toEqual({});
  });
});
