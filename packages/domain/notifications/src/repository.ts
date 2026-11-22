import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import { notifications, type NotificationRow, type NewNotificationRow } from "@servyn/db";
import {
  asNotificationId,
  asUserId,
  newUlid,
  type NotificationId,
  type UserId,
} from "@servyn/core";
import {
  NotificationChannelSchema,
  NotificationPayloadSchema,
  type NotificationChannel,
  type NotificationPayload,
} from "./schema.js";

export interface Notification {
  id: NotificationId;
  userId: UserId;
  channel: NotificationChannel;
  type: string;
  payload: NotificationPayload;
  readAt: Date | null;
  createdAt: Date;
}

export function mapNotification(row: NotificationRow): Notification {
  return {
    id: asNotificationId(row.id),
    userId: asUserId(row.userId),
    channel: NotificationChannelSchema.parse(row.channel),
    type: row.type,
    payload: NotificationPayloadSchema.parse(row.payload),
    readAt: row.readAt ?? null,
    createdAt: row.createdAt,
  };
}

export function createNotificationsRepository(executor: DbExecutor) {
  return {
    async insertNotification(
      data: Omit<NewNotificationRow, "id" | "payload"> & { payload: NotificationPayload },
    ): Promise<Notification> {
      const id = newUlid();
      const [row] = await executor
        .insert(notifications)
        .values({ ...data, id, payload: data.payload })
        .returning();
      if (!row) throw new Error("Insert notification returned no row");
      return mapNotification(row);
    },

    async findUnreadByUserId(userId: UserId): Promise<Notification[]> {
      const rows = await executor
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
      return rows.map(mapNotification);
    },

    async markAsRead(id: NotificationId): Promise<Notification> {
      const [row] = await executor
        .update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.id, id))
        .returning();
      if (!row) throw new Error("Mark notification read returned no row");
      return mapNotification(row);
    },
  };
}

export type NotificationsRepository = ReturnType<typeof createNotificationsRepository>;
