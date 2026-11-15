import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { startPair } from "./helpers";

let pair: ReturnType<typeof startPair>;

beforeAll(() => {
  pair = startPair();
});
afterAll(() => pair.stop());

describe("http forwarding (integration)", () => {
  test("adds the key, keeps the token, and returns the backend body", async () => {
    const response = await fetch(`${pair.base}/posts?limit=5`, {
      method: "POST",
      headers: {
        authorization: "Bearer abc",
        "content-type": "application/json",
      },
      body: JSON.stringify({ a: 1 }),
    });
    expect(response.status).toBe(200);
    const json = (await response.json()) as { echo: string; path: string };
    expect(json.path).toBe("/posts");
    expect(JSON.parse(json.echo)).toEqual({ a: 1 });
    const seen = pair.backend.seen.at(-1);
    expect(seen?.path).toBe("/posts?limit=5");
    expect(seen?.method).toBe("POST");
    expect(seen?.headers.get("authorization")).toBe("Bearer abc");
  });

  test("backend error status and code pass through unchanged", async () => {
    const response = await fetch(`${pair.base}/auth/refresh`, {
      method: "POST",
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ detail: "refresh_invalid" });
  });

  test("does not pass set-cookie but keeps other headers", async () => {
    const response = await fetch(`${pair.base}/auth/login`, { method: "POST" });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("x-backend")).toBe("yes");
  });

  test("refuses paths outside the allowlist with a stable code", async () => {
    for (const path of ["/docs", "/openapi.json", "/auth/%2e%2e/docs"]) {
      const response = await fetch(`${pair.base}${path}`);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ detail: "not_found" });
    }
  });

  test("regression: a client cannot set the key or the forwarded address", async () => {
    await fetch(`${pair.base}/posts`, {
      headers: { "x-internal-key": "evil", "x-forwarded-for": "6.6.6.6" },
    });
    const seen = pair.backend.seen.at(-1);
    expect(seen?.headers.get("x-internal-key")).toBe("k".repeat(40));
    expect(seen?.headers.get("x-forwarded-for")).toBe("127.0.0.1");
  });

  test("regression: the socket path is not an HTTP route", async () => {
    const before = pair.backend.seen.length;
    const response = await fetch(`${pair.base}/ws`);
    expect(response.status).toBe(404);
    expect(pair.backend.seen.length).toBe(before);
  });

  test("refuses other methods", async () => {
    const response = await fetch(`${pair.base}/posts`, { method: "OPTIONS" });
    expect(response.status).toBe(405);
  });

  test("health check answers without the backend", async () => {
    const response = await fetch(`${pair.base}/healthz`);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("times out when the backend is too slow", async () => {
    const response = await fetch(`${pair.base}/organizations/slow`);
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ detail: "upstream_timeout" });
  });
});

describe("limits and failures (integration)", () => {
  test("rejects a body over the limit", async () => {
    const small = startPair({ maxBodyBytes: 100 });
    try {
      const response = await fetch(`${small.base}/posts`, {
        method: "POST",
        body: "x".repeat(500),
      });
      expect(response.status).toBe(413);
    } finally {
      small.stop();
    }
  });

  test("limits sensitive routes harder, per client", async () => {
    const strict = startPair({ authRateLimit: 2, rateLimit: 1000 });
    try {
      const codes: number[] = [];
      for (let i = 0; i < 4; i++) {
        codes.push(
          (await fetch(`${strict.base}/auth/login`, { method: "POST" })).status,
        );
      }
      expect(codes).toEqual([200, 200, 429, 429]);
      const other = await fetch(`${strict.base}/posts`);
      expect(other.status).toBe(200);
      const limited = await fetch(`${strict.base}/auth/login`, {
        method: "POST",
      });
      expect(await limited.json()).toEqual({ detail: "rate_limited" });
      expect(limited.headers.get("retry-after")).not.toBeNull();
    } finally {
      strict.stop();
    }
  });

  test("answers 502 when the backend is down", async () => {
    const down = startPair();
    down.backend.server.stop(true);
    try {
      const response = await fetch(`${down.base}/posts`);
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ detail: "upstream_unavailable" });
    } finally {
      down.gateway.stop();
    }
  });
});
