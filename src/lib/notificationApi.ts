import { read, send } from "./http";
import type { NotificationPage } from "./notifications";
import {
  mutedTypesFrom,
  type NotificationPreferences,
} from "./notificationTypes";

// Ported from amigoact-fe src/lib/notificationApi.ts and
// src/app/_actions/notifications.ts.

export const NOTIFICATIONS_PAGE_SIZE = 20;

export function getNotificationPage(
  offset: number,
  unreadOnly: boolean,
): Promise<NotificationPage | null> {
  const query = new URLSearchParams({
    limit: String(NOTIFICATIONS_PAGE_SIZE),
    offset: String(offset),
  });
  if (unreadOnly) query.set("unread_only", "true");
  return read(`/notifications?${query}`);
}

export function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  return read("/notifications/preferences");
}

export function getUnreadCount(): Promise<{ count: number } | null> {
  return read("/notifications/unread-count");
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const result = await send(
    `/notifications/${encodeURIComponent(id)}/read`,
    "POST",
  );
  return result.ok;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const result = await send("/notifications/read-all", "POST");
  return result.ok;
}

// The form lists the types a person receives, so every other type goes into
// muted_types. The backend replaces the whole preference.
export function saveNotificationPreferences(
  inapp: boolean,
  email: boolean,
  receive: string[],
) {
  return send("/notifications/preferences", "PUT", {
    inapp,
    email,
    muted_types: mutedTypesFrom(receive),
  });
}

// The first page, for the bell.
export function loadNotificationList(): Promise<NotificationPage | null> {
  return read(`/notifications?limit=${NOTIFICATIONS_PAGE_SIZE}&offset=0`);
}
