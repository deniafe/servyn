import { describe, it, expect } from "vitest";
import { MessageAttachmentsSchema } from "./schema.js";

describe("MessageAttachmentsSchema", () => {
  it("parses a valid attachment list", () => {
    const raw = [
      { key: "chat/abc.jpg", mimeType: "image/jpeg", sizeBytes: 102400, name: "photo.jpg" },
    ];
    const result = MessageAttachmentsSchema.parse(raw);
    expect(result[0]?.key).toBe("chat/abc.jpg");
    expect(result[0]?.mimeType).toBe("image/jpeg");
  });

  it("parses an empty list", () => {
    expect(MessageAttachmentsSchema.parse([])).toEqual([]);
  });

  it("rejects when key is missing", () => {
    expect(() => MessageAttachmentsSchema.parse([{ mimeType: "image/jpeg" }])).toThrow();
  });

  it("rejects when mimeType is missing", () => {
    expect(() => MessageAttachmentsSchema.parse([{ key: "chat/abc.jpg" }])).toThrow();
  });
});
