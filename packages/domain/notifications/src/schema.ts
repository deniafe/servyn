import { z } from "zod/v4";

export const NotificationChannelSchema = z.enum(["email", "sms", "push", "in_app"]);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const NotificationPayloadSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  url: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});
export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;
