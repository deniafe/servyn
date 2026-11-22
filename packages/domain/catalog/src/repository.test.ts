import { describe, it, expect } from "vitest";
import { ServiceImagesSchema, ProductBulkOptionsSchema } from "./schema.js";

describe("ServiceImagesSchema", () => {
  it("parses a valid image array", () => {
    const raw = [{ key: "images/abc.webp", alt: "Hair braiding", order: 0 }];
    const result = ServiceImagesSchema.parse(raw);
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe("images/abc.webp");
  });

  it("parses an empty array", () => {
    expect(ServiceImagesSchema.parse([])).toEqual([]);
  });

  it("rejects when key is missing", () => {
    expect(() => ServiceImagesSchema.parse([{ alt: "No key" }])).toThrow();
  });
});

describe("ProductBulkOptionsSchema", () => {
  it("parses valid bulk options", () => {
    const raw = [
      { minQty: 10, priceMinor: 850, label: "10+ case" },
      { minQty: 50, priceMinor: 700 },
    ];
    const result = ProductBulkOptionsSchema.parse(raw);
    expect(result).toHaveLength(2);
    expect(result[0]?.priceMinor).toBe(850);
    expect(result[1]?.label).toBeUndefined();
  });

  it("rejects when minQty is zero", () => {
    expect(() => ProductBulkOptionsSchema.parse([{ minQty: 0, priceMinor: 100 }])).toThrow();
  });

  it("rejects when priceMinor is negative", () => {
    expect(() => ProductBulkOptionsSchema.parse([{ minQty: 5, priceMinor: -1 }])).toThrow();
  });
});
