import { afterAll, describe, expect, test } from "bun:test";
import { loadConfig } from "../src/config";
import { KEY, startPair } from "./helpers";

const WEB = "http://localhost:8081";

describe("CORS config", () => {
  test("reads exact origins and refuses wildcards", () => {
    const base = { BACKEND_URL: "http://127.0.0.1:1", INTERNAL_API_KEY: KEY };
    expect(loadConfig(base).corsOrigins).toEqual([]);
    expect(
      loadConfig({ ...base, CORS_ORIGINS: `${WEB}, http://a.test` })
        .corsOrigins,
    ).toEqual([WEB, "http://a.test"]);
    expect(() => loadConfig({ ...base, CORS_ORIGINS: "*" })).toThrow(
      "CORS_ORIGINS",
    );
  });
});

describe("CORS enabled", () => {
  const pair = startPair({ corsOrigins: [WEB] });
  afterAll(() => pair.stop());

  test("preflight from a listed origin passes without reaching the backend", async () => {
    const before = pair.backend.seen.length;
    const res = await fetch(`${pair.base}/posts`, {
      method: "OPTIONS",
      headers: {
        origin: WEB,
        "access-control-request-method": "GET",
        "access-control-request-headers": "authorization",
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(WEB);
    expect(res.headers.get("access-control-allow-headers")).toContain(
      "authorization",
    );
    expect(res.headers.get("access-control-allow-credentials")).toBeNull();
    expect(pair.backend.seen.length).toBe(before);
  });

  test("preflight from another origin gets no CORS headers", async () => {
    const res = await fetch(`${pair.base}/posts`, {
      method: "OPTIONS",
      headers: {
        origin: "http://evil.test",
        "access-control-request-method": "GET",
      },
    });
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  test("responses and gateway errors carry the origin", async () => {
    const ok = await fetch(`${pair.base}/posts`, { headers: { origin: WEB } });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("access-control-allow-origin")).toBe(WEB);
    expect(ok.headers.get("vary")).toContain("Origin");
    const missing = await fetch(`${pair.base}/docs`, {
      headers: { origin: WEB },
    });
    expect(missing.status).toBe(404);
    expect(missing.headers.get("access-control-allow-origin")).toBe(WEB);
  });

  test("an unlisted origin gets no allow header on a normal request", async () => {
    const res = await fetch(`${pair.base}/posts`, {
      headers: { origin: "http://evil.test" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("CORS disabled (regression)", () => {
  const pair = startPair();
  afterAll(() => pair.stop());

  test("OPTIONS stays refused and no CORS header is added", async () => {
    const pre = await fetch(`${pair.base}/posts`, {
      method: "OPTIONS",
      headers: { origin: WEB, "access-control-request-method": "GET" },
    });
    expect(pre.headers.get("access-control-allow-origin")).toBeNull();
    const res = await fetch(`${pair.base}/posts`, { headers: { origin: WEB } });
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});
