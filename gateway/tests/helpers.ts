import { type Gateway, startGateway } from "../src/app";
import type { Config } from "../src/config";

export const KEY = "k".repeat(40);

export type Seen = {
  method: string;
  path: string;
  headers: Headers;
  body: string;
};

// A fake backend: records requests, echoes bodies, and mimics the socket rules.
export function startBackend() {
  const seen: Seen[] = [];
  const server = Bun.serve<{ ticket: string }>({
    port: 0,
    async fetch(request, srv) {
      const url = new URL(request.url);
      // Like the real backend, the socket needs a ticket and no internal key.
      if (url.pathname === "/ws") {
        const ticket = url.searchParams.get("ticket") ?? "";
        if (ticket !== "good") return new Response("no", { status: 403 });
        srv.upgrade(request, { data: { ticket } });
        return undefined;
      }
      if (request.headers.get("x-internal-key") !== KEY) {
        return Response.json(
          { detail: "internal_key_invalid" },
          { status: 401 },
        );
      }
      const body = await request.text();
      seen.push({
        method: request.method,
        path: url.pathname + url.search,
        headers: request.headers,
        body,
      });
      if (url.pathname === "/organizations/slow") await Bun.sleep(1500);
      if (url.pathname === "/auth/refresh") {
        return Response.json({ detail: "refresh_invalid" }, { status: 401 });
      }
      if (url.pathname === "/auth/login") {
        return Response.json(
          { ok: true },
          { headers: { "set-cookie": "a=b", "x-backend": "yes" } },
        );
      }
      return Response.json({ echo: body, path: url.pathname });
    },
    websocket: {
      message(socket, frame) {
        socket.send(`echo:${frame}`);
      },
    },
  });
  return { server, seen, url: `http://127.0.0.1:${server.port}` };
}

export function testConfig(
  backendUrl: string,
  over: Partial<Config> = {},
): Config {
  return {
    backendUrl,
    internalKey: KEY,
    port: 0,
    rateLimit: 1000,
    authRateLimit: 1000,
    maxBodyBytes: 1024 * 1024,
    upstreamTimeoutMs: 800,
    maxSocketsPerIp: 5,
    trustProxy: false,
    wsOrigins: [],
    ...over,
  };
}

export function startPair(over: Partial<Config> = {}) {
  const backend = startBackend();
  const gateway: Gateway = startGateway(testConfig(backend.url, over));
  const base = `http://127.0.0.1:${gateway.server.port}`;
  return {
    backend,
    gateway,
    base,
    stop() {
      gateway.stop();
      backend.server.stop(true);
    },
  };
}
