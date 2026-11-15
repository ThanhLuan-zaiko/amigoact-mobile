import type { Server, ServerWebSocket } from "bun";
import { SOCKET_PATHS } from "./allowlist";
import type { Config } from "./config";
import { clientIp } from "./headers";
import { problem } from "./proxy";
import type { RateLimiter } from "./rateLimit";

// The backend socket needs no internal key: a one-time ticket from
// POST /realtime/tickets is its credential. The gateway still stands in
// front of it, so the backend can stay on a private network.

export type SocketData = {
  ip: string;
  query: string;
  path: string;
  upstream?: WebSocket;
  queue: (string | Buffer)[];
  opened: boolean;
};

const UNAUTHORIZED_CLOSE = 4401;
const UNAVAILABLE_CLOSE = 1013;
// Frames sent before the backend socket is open wait here, with a cap.
const MAX_QUEUE = 16;
// Frames are small signals, so a large frame is not a legitimate client.
export const MAX_FRAME_BYTES = 64 * 1024;

export class SocketCounter {
  private counts = new Map<string, number>();

  tryOpen(ip: string, max: number): boolean {
    const count = this.counts.get(ip) ?? 0;
    if (count >= max) return false;
    this.counts.set(ip, count + 1);
    return true;
  }

  close(ip: string): void {
    const count = (this.counts.get(ip) ?? 1) - 1;
    if (count <= 0) this.counts.delete(ip);
    else this.counts.set(ip, count);
  }
}

export function upgrade(
  request: Request,
  server: Server<SocketData>,
  config: Config,
  limiter: RateLimiter,
  counter: SocketCounter,
): Response | undefined {
  const url = new URL(request.url);
  if (!SOCKET_PATHS.has(url.pathname)) return problem(404, "not_found");
  // Native apps send no Origin. A browser page does, and is refused unless listed.
  const origin = request.headers.get("origin");
  if (origin !== null && !config.wsOrigins.includes(origin)) {
    return problem(403, "origin_forbidden");
  }
  const ip = clientIp(request, server.requestIP(request)?.address, config);
  const verdict = limiter.hit(`ws:${ip}`, config.authRateLimit);
  if (!verdict.ok) {
    return problem(429, "rate_limited", {
      "retry-after": String(verdict.retryAfterSeconds),
    });
  }
  if (!counter.tryOpen(ip, config.maxSocketsPerIp)) {
    return problem(429, "too_many_sockets");
  }
  const data: SocketData = {
    ip,
    query: url.search,
    path: url.pathname,
    queue: [],
    opened: false,
  };
  if (server.upgrade(request, { data })) return undefined;
  counter.close(ip);
  return problem(400, "upgrade_failed");
}

function backendSocketUrl(config: Config, data: SocketData): string {
  const base = config.backendUrl.replace(/^http/, "ws");
  return base + data.path + data.query;
}

export function openSocket(
  client: ServerWebSocket<SocketData>,
  config: Config,
): void {
  const data = client.data;
  const upstream = new WebSocket(backendSocketUrl(config, data));
  data.upstream = upstream;
  upstream.addEventListener("open", () => {
    data.opened = true;
    for (const frame of data.queue) upstream.send(frame);
    data.queue = [];
  });
  upstream.addEventListener("message", (event) => {
    const frame = event.data;
    if (typeof frame === "string") client.send(frame);
    else if (frame instanceof ArrayBuffer) client.send(Buffer.from(frame));
  });
  upstream.addEventListener("close", (event) => {
    // The backend refuses a bad ticket before it accepts, so the handshake
    // fails and no close code arrives. Report that as an invalid ticket.
    if (!data.opened) client.close(UNAUTHORIZED_CLOSE, "ticket_invalid");
    else client.close(event.code >= 4000 ? event.code : 1000, event.reason);
  });
  upstream.addEventListener("error", () => {
    if (data.opened) client.close(UNAVAILABLE_CLOSE, "upstream_unavailable");
  });
}

export function relayFrame(
  client: ServerWebSocket<SocketData>,
  frame: string | Buffer,
): void {
  const data = client.data;
  if (data.opened && data.upstream) {
    data.upstream.send(frame);
    return;
  }
  if (data.queue.length >= MAX_QUEUE) client.close(1008, "too_many_frames");
  else data.queue.push(frame);
}

export function closeSocket(
  client: ServerWebSocket<SocketData>,
  counter: SocketCounter,
): void {
  counter.close(client.data.ip);
  client.data.upstream?.close();
}
