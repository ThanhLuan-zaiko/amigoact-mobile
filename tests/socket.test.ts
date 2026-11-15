import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { startPair } from "./helpers";

let pair: ReturnType<typeof startPair>;

beforeAll(() => {
  pair = startPair({ maxSocketsPerIp: 2 });
});
afterAll(() => pair.stop());

function wsBase(): string {
  return pair.base.replace("http", "ws");
}

function open(path: string, headers?: Record<string, string>) {
  const socket = headers
    ? new WebSocket(`${wsBase()}${path}`, { headers })
    : new WebSocket(`${wsBase()}${path}`);
  const messages: string[] = [];
  socket.addEventListener("message", (event) =>
    messages.push(String(event.data)),
  );
  const closed = new Promise<CloseEvent>((resolve) =>
    socket.addEventListener("close", (event) => resolve(event)),
  );
  const opened = new Promise<boolean>((resolve) => {
    socket.addEventListener("open", () => resolve(true));
    socket.addEventListener("error", () => resolve(false));
  });
  return { socket, messages, closed, opened };
}

describe("socket relay (integration)", () => {
  test("relays frames both ways, including ones sent right after open", async () => {
    const client = open("/ws?ticket=good");
    expect(await client.opened).toBe(true);
    client.socket.send('{"op":"ping"}');
    await Bun.sleep(300);
    expect(client.messages).toEqual(['echo:{"op":"ping"}']);
    client.socket.close();
  });

  test("a bad ticket closes with 4401", async () => {
    const client = open("/ws?ticket=bad");
    await client.opened;
    const event = await client.closed;
    expect(event.code).toBe(4401);
  });

  test("a browser origin that is not listed is refused", async () => {
    const response = await fetch(`${pair.base}/ws?ticket=good`, {
      headers: { upgrade: "websocket", origin: "https://evil.example" },
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ detail: "origin_forbidden" });
  });

  test("other socket paths are refused", async () => {
    const response = await fetch(`${pair.base}/other`, {
      headers: { upgrade: "websocket" },
    });
    expect(response.status).toBe(404);
  });

  test("caps open sockets per client", async () => {
    const first = open("/ws?ticket=good");
    const second = open("/ws?ticket=good");
    await first.opened;
    await second.opened;
    const third = await fetch(`${pair.base}/ws?ticket=good`, {
      headers: { upgrade: "websocket" },
    });
    expect(third.status).toBe(429);
    expect(await third.json()).toEqual({ detail: "too_many_sockets" });
    first.socket.close();
    second.socket.close();
  });
});
