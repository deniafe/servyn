import { z } from "zod/v4";

export const MessageAttachmentSchema = z.object({
  key: z.string(), // R2 private bucket key
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative().optional(),
  name: z.string().optional(),
});

export const MessageAttachmentsSchema = z.array(MessageAttachmentSchema);
export type MessageAttachments = z.infer<typeof MessageAttachmentsSchema>;
