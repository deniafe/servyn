import "server-only";
import { eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import {
  conversations,
  messages,
  type ConversationRow,
  type NewConversationRow,
  type MessageRow,
  type NewMessageRow,
} from "@servyn/db";
import {
  asConversationId,
  asMessageId,
  asBookingId,
  asOrderId,
  asUserId,
  newUlid,
  type ConversationId,
  type MessageId,
  type BookingId,
  type OrderId,
  type UserId,
} from "@servyn/core";
import { MessageAttachmentsSchema, type MessageAttachments } from "./schema.js";

export interface Conversation {
  id: ConversationId;
  bookingId: BookingId | null;
  orderId: OrderId | null;
  createdAt: Date;
}

export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  body: string | null;
  attachments: MessageAttachments;
  redacted: boolean;
  createdAt: Date;
}

export function mapConversation(row: ConversationRow): Conversation {
  return {
    id: asConversationId(row.id),
    bookingId:
      row.bookingId !== null && row.bookingId !== undefined ? asBookingId(row.bookingId) : null,
    orderId: row.orderId !== null && row.orderId !== undefined ? asOrderId(row.orderId) : null,
    createdAt: row.createdAt,
  };
}

export function mapMessage(row: MessageRow): Message {
  return {
    id: asMessageId(row.id),
    conversationId: asConversationId(row.conversationId),
    senderId: asUserId(row.senderId),
    body: row.body ?? null,
    attachments:
      row.attachments !== null && row.attachments !== undefined
        ? MessageAttachmentsSchema.parse(row.attachments)
        : [],
    redacted: row.redacted,
    createdAt: row.createdAt,
  };
}

export function createMessagingRepository(executor: DbExecutor) {
  return {
    async insertConversation(data: Omit<NewConversationRow, "id">): Promise<Conversation> {
      const id = newUlid();
      const [row] = await executor
        .insert(conversations)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert conversation returned no row");
      return mapConversation(row);
    },

    async findConversationByBookingId(bookingId: BookingId): Promise<Conversation | null> {
      const [row] = await executor
        .select()
        .from(conversations)
        .where(eq(conversations.bookingId, bookingId))
        .limit(1);
      return row ? mapConversation(row) : null;
    },

    async findConversationByOrderId(orderId: OrderId): Promise<Conversation | null> {
      const [row] = await executor
        .select()
        .from(conversations)
        .where(eq(conversations.orderId, orderId))
        .limit(1);
      return row ? mapConversation(row) : null;
    },

    /** Append-only: inserts a new message row. */
    async insertMessage(
      data: Omit<NewMessageRow, "id" | "attachments"> & {
        attachments?: MessageAttachments;
      },
    ): Promise<Message> {
      const id = newUlid();
      const [row] = await executor
        .insert(messages)
        .values({
          ...data,
          id,
          attachments: data.attachments ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert message returned no row");
      return mapMessage(row);
    },

    async findMessagesByConversationId(conversationId: ConversationId): Promise<Message[]> {
      const rows = await executor
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId));
      return rows.map(mapMessage);
    },

    /** Dedicated redaction transition — sets body to null, redacted to true. */
    async redactMessage(id: MessageId): Promise<Message> {
      const [row] = await executor
        .update(messages)
        .set({ body: null, redacted: true })
        .where(eq(messages.id, id))
        .returning();
      if (!row) throw new Error("Redact message returned no row");
      return mapMessage(row);
    },
  };
}

export type MessagingRepository = ReturnType<typeof createMessagingRepository>;
