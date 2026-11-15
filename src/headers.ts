import type { Config } from "./config";

// Headers that describe one connection, not the message. Never forwarded.
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

// The request headers the backend needs. Everything else is dropped, so a
// client cannot smuggle in x-internal-key, x-forwarded-*, or cookies.
const REQUEST_ALLOW = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "if-modified-since",
  "if-none-match",
  "range",
  "user-agent",
];

// Bun reports an IPv4 client on a dual-stack socket as ::ffff:a.b.c.d.
export function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "");
}

export function clientIp(
  request: Request,
  socketIp: string | undefined,
  config: Config,
): string {
  if (config.trustProxy) {
    const forwarded = request.headers.get("x-forwarded-for");
    // The last entry is the one the trusted proxy appended itself.
    const last = forwarded?.split(",").at(-1)?.trim();
    if (last) return normalizeIp(last);
  }
  return socketIp ? normalizeIp(socketIp) : "unknown";
}

export function upstreamHeaders(
  request: Request,
  ip: string,
  config: Config,
): Headers {
  const headers = new Headers();
  for (const name of REQUEST_ALLOW) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  // Ask for plain bytes, so the body and its headers stay consistent.
  headers.set("accept-encoding", "identity");
  headers.set("x-internal-key", config.internalKey);
  headers.set("x-forwarded-for", ip);
  return headers;
}

export function downstreamHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  for (const [name, value] of upstream) {
    const lower = name.toLowerCase();
    if (HOP_BY_HOP.has(lower)) continue;
    // The app does not use cookies, and a cookie must never cross over.
    if (lower === "set-cookie") continue;
    headers.set(name, value);
  }
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  return headers;
}
