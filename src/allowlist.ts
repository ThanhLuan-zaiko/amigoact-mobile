// The gateway forwards only what the mobile app needs. Everything else,
// including the API docs, is refused before the backend sees it.

// First path segment of every backend route the app may call. Keep this in
// step with the routers included in amigoact-be/src/app.py.
const FAMILIES = new Set([
  "account",
  "activities",
  "appeals",
  "attendance",
  "attendance-sessions",
  "auth",
  "certificate-templates",
  "certificates",
  "chat",
  "comments",
  "feed",
  "hours",
  "media",
  "messages",
  "notifications",
  "organizations",
  "posts",
  "realtime",
  "registrations",
  "rooms",
]);

export const METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

export const SOCKET_PATHS = new Set(["/ws", "/ws/chat"]);

// Routes that anyone can hit without an account, so they are limited harder.
const SENSITIVE = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/email/resend",
  "/auth/email/verify",
  "/auth/password/forgot",
  "/auth/password/reset",
  "/auth/password/change",
]);

// An encoded slash, dot, backslash, or NUL could make this check and the
// backend read the same path differently, so such paths are refused outright.
const SUSPICIOUS = /%2f|%5c|%2e|%00|\\|\0/i;

export function isAllowedPath(pathname: string): boolean {
  if (!pathname.startsWith("/") || pathname.includes("//")) return false;
  if (SUSPICIOUS.test(pathname)) return false;
  const segments = pathname.split("/").slice(1);
  if (segments.some((part) => part === "." || part === "..")) return false;
  return FAMILIES.has(segments[0] ?? "");
}

export function isSensitivePath(pathname: string): boolean {
  return SENSITIVE.has(pathname.replace(/\/+$/, ""));
}
