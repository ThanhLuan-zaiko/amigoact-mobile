import type { ApiResult } from "./api";
import {
  ATTACHMENT_MAX,
  type ChatContact,
  type ChatMessage,
  type ChatResult,
  type ChatRoom,
  chatError,
  isRoomId,
  type MessagePage,
  PAGE_SIZE,
  validateMessage,
} from "./chat";
import { auth } from "./client";
import { orgPath, send } from "./http";

// Ported from amigoact-fe src/lib/chatApi.ts and src/app/_actions/chat.ts.
// Every call is checked the same way the web Server Actions check them.

function fail(code: string, error = chatError(code)): ChatResult<never> {
  return { ok: false, code, error };
}

function done<T>(result: ApiResult<T>): ChatResult<T> {
  return result.ok
    ? { ok: true, data: result.data }
    : fail(result.code, chatError(result.code, result.issues));
}

function idsValid(...ids: unknown[]): boolean {
  return ids.every(isRoomId);
}

function get<T>(path: string): Promise<ApiResult<T>> {
  return auth.authed<T>(path, { method: "GET" });
}

export function messagesPath(roomId: string, before?: string | null): string {
  const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (before) query.set("before", before);
  return `/rooms/${encodeURIComponent(roomId)}/messages?${query}`;
}

export async function loadMessages(
  roomId: string,
  before: string | null,
): Promise<ChatResult<MessagePage>> {
  if (!idsValid(roomId) || (before !== null && !isRoomId(before))) {
    return fail("room_not_found");
  }
  return done(await get<MessagePage>(messagesPath(roomId, before)));
}

export async function loadInbox(): Promise<ChatResult<ChatRoom[]>> {
  const result = await get<{ items: ChatRoom[] }>("/chat/inbox");
  return result.ok ? { ok: true, data: result.data.items } : done(result);
}

// The polling fallback: the inbox and the newest page of the open room.
export async function pollMessenger(
  roomId: string | null,
): Promise<ChatResult<{ rooms: ChatRoom[]; page: MessagePage | null }>> {
  if (roomId !== null && !idsValid(roomId)) return fail("room_not_found");
  const [inbox, page] = await Promise.all([
    get<{ items: ChatRoom[] }>("/chat/inbox"),
    roomId ? get<MessagePage>(messagesPath(roomId)) : null,
  ]);
  if (!inbox.ok) return done(inbox);
  if (page && !page.ok) return done(page);
  return {
    ok: true,
    data: { rooms: inbox.data.items, page: page ? page.data : null },
  };
}

export async function loadContacts(): Promise<ChatResult<ChatContact[]>> {
  const result = await get<{ items: ChatContact[] }>("/chat/contacts");
  return result.ok ? { ok: true, data: result.data.items } : done(result);
}

// Files are uploaded through /media first; only their ids travel here.
export async function sendChatMessage(
  roomId: string,
  body: string,
  replyToId: string | null,
  attachmentIds: string[] = [],
): Promise<ChatResult<ChatMessage>> {
  const problem = validateMessage(body, attachmentIds.length);
  if (problem) return fail("validation_error", problem);
  if (attachmentIds.length > ATTACHMENT_MAX || !idsValid(...attachmentIds)) {
    return fail("media_not_found");
  }
  if (!idsValid(roomId) || (replyToId !== null && !isRoomId(replyToId))) {
    return fail("room_not_found");
  }
  return done(
    await send<ChatMessage>(
      `/rooms/${encodeURIComponent(roomId)}/messages`,
      "POST",
      {
        body: body.trim(),
        ...(replyToId ? { reply_to_id: replyToId } : {}),
        ...(attachmentIds.length > 0 ? { attachment_ids: attachmentIds } : {}),
      },
    ),
  );
}

export async function editChatMessage(
  messageId: string,
  body: string,
  files = 0,
): Promise<ChatResult<ChatMessage>> {
  const problem = validateMessage(body, files);
  if (problem) return fail("validation_error", problem);
  if (!idsValid(messageId)) return fail("message_not_found");
  return done(
    await send<ChatMessage>(
      `/messages/${encodeURIComponent(messageId)}`,
      "PATCH",
      {
        body: body.trim(),
      },
    ),
  );
}

// The backend deletes a message for good, with its pins and reactions.
export async function deleteChatMessage(
  messageId: string,
): Promise<ChatResult> {
  if (!idsValid(messageId)) return fail("message_not_found");
  const result = await send(
    `/messages/${encodeURIComponent(messageId)}`,
    "DELETE",
  );
  return result.ok ? { ok: true, data: null } : done(result);
}

export async function setReaction(
  messageId: string,
  emoji: string,
  on: boolean,
): Promise<ChatResult> {
  if (!idsValid(messageId)) return fail("message_not_found");
  const text = emoji.trim();
  if (!text || [...text].length > 16) return fail("validation_error");
  const path = `/messages/${encodeURIComponent(messageId)}/reactions`;
  const result = on
    ? await send(path, "POST", { emoji: text })
    : await send(`${path}/${encodeURIComponent(text)}`, "DELETE");
  return result.ok ? { ok: true, data: null } : done(result);
}

export async function setPin(
  roomId: string,
  messageId: string,
  on: boolean,
): Promise<ChatResult> {
  if (!idsValid(roomId, messageId)) return fail("message_not_found");
  const result = await send(
    `/rooms/${encodeURIComponent(roomId)}/pins/${encodeURIComponent(messageId)}`,
    on ? "POST" : "DELETE",
  );
  return result.ok ? { ok: true, data: null } : done(result);
}

export async function loadPins(
  roomId: string,
): Promise<ChatResult<ChatMessage[]>> {
  if (!idsValid(roomId)) return fail("room_not_found");
  const result = await get<{ items: ChatMessage[] }>(
    `/rooms/${encodeURIComponent(roomId)}/pins`,
  );
  return result.ok ? { ok: true, data: result.data.items } : done(result);
}

export async function markRoomRead(
  roomId: string,
  messageId: string,
): Promise<ChatResult> {
  if (!idsValid(roomId, messageId)) return fail("message_not_found");
  const result = await send(
    `/rooms/${encodeURIComponent(roomId)}/read`,
    "POST",
    {
      message_id: messageId,
    },
  );
  return result.ok ? { ok: true, data: null } : done(result);
}

const SLUG = /^[A-Za-z0-9-]{1,80}$/;

// Opens (or finds) the direct message with a member of one organization.
export async function openDirectMessage(
  slug: string,
  userId: string,
): Promise<ChatResult<{ room_id: string }>> {
  if (!idsValid(userId) || !SLUG.test(slug)) return fail("not_a_member");
  return done(
    await send<{ room_id: string }>(`${orgPath(slug)}/chat/dms`, "POST", {
      user_id: userId,
    }),
  );
}
