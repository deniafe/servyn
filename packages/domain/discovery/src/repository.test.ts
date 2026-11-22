import { describe, it, expect } from "vitest";
import { EmbeddingEntityTypeSchema, EmbeddingVectorSchema } from "./schema.js";

describe("EmbeddingEntityTypeSchema", () => {
  it("accepts valid entity types", () => {
    expect(EmbeddingEntityTypeSchema.parse("service")).toBe("service");
    expect(EmbeddingEntityTypeSchema.parse("product")).toBe("product");
    expect(EmbeddingEntityTypeSchema.parse("vendor")).toBe("vendor");
  });

  it("rejects unknown entity types", () => {
    expect(() => EmbeddingEntityTypeSchema.parse("booking")).toThrow();
  });
});

describe("EmbeddingVectorSchema", () => {
  it("parses a 3-element vector", () => {
    const v = [0.1, 0.5, 0.9];
    expect(EmbeddingVectorSchema.parse(v)).toEqual(v);
  });

  it("rejects an empty vector", () => {
    expect(() => EmbeddingVectorSchema.parse([])).toThrow();
  });
});
