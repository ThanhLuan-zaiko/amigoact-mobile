import type { Server } from "bun";
import type { Config } from "./config";
import { forward, problem } from "./proxy";
import { RateLimiter } from "./rateLimit";
import {
  closeSocket,
  MAX_FRAME_BYTES,
  openSocket,
  relayFrame,
  SocketCounter,
  type SocketData,
  upgrade,
} from "./socket";

export type Gateway = {
  server: Server<SocketData>;
  stop: () => void;
};

// Starts the gateway. Tests start it on port 0 with a fake backend.
export function startGateway(config: Config): Gateway {
  const limiter = new RateLimiter();
  const counter = new SocketCounter();
  const sweeper = setInterval(() => limiter.sweep(), 60_000);

  const server: Server<SocketData> = Bun.serve<SocketData>({
    port: config.port,
    maxRequestBodySize: config.maxBodyBytes,
    async fetch(request, srv) {
      const { pathname } = new URL(request.url);
      if (pathname === "/healthz") return Response.json({ status: "ok" });
      if (request.headers.get("upgrade")?.toLowerCase() === "websocket") {
        return upgrade(request, srv, config, limiter, counter);
      }
      return forward(request, srv.requestIP(request)?.address, config, limiter);
    },
    error() {
      return problem(500, "internal_error");
    },
    websocket: {
      maxPayloadLength: MAX_FRAME_BYTES,
      idleTimeout: 120,
      sendPings: true,
      open: (client) => openSocket(client, config),
      message: (client, frame) => relayFrame(client, frame),
      close: (client) => closeSocket(client, counter),
    },
  });

  return {
    server,
    stop: () => {
      clearInterval(sweeper);
      server.stop(true);
    },
  };
}
