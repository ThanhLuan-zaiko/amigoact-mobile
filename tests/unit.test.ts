import { describe, expect, test } from "bun:test";
import { isAllowedPath, isSensitivePath } from "../src/allowlist";
import { loadConfig, parseOrigins } from "../src/config";
import {
  clientIp,
  downstreamHeaders,
  normalizeIp,
  upstreamHeaders,
} from "../src/headers";
import { RateLimiter } from "../src/rateLimit";
import { SocketCounter } from "../src/socket";
import { KEY, testConfig } from "./helpers";

const base = {
  BACKEND_URL: "http://localhost:8100/",
  INTERNAL_API_KEY: KEY,
};

describe("config", () => {
  test("reads defaults and trims the backend slash", () => {
    const config = loadConfig(base);
    expect(config.backendUrl).toBe("http://localhost:8100");
    expect(config.port).toBe(8200);
    expect(config.trustProxy).toBe(false);
    expect(config.maxBodyBytes).toBe(52 * 1024 * 1024);
  });

  test("refuses a short key and a missing or odd backend", () => {
    expect(() => loadConfig({ ...base, INTERNAL_API_KEY: "short" })).toThrow();
    expect(() => loadConfig({ INTERNAL_API_KEY: KEY })).toThrow();
    expect(() => loadConfig({ ...base, BACKEND_URL: "ftp://x" })).toThrow();
    expect(() =>
      loadConfig({ ...base, BACKEND_URL: "http://user:pw@host" }),
    ).toThrow();
  });

  test("refuses bad numbers and flags", () => {
    expect(() => loadConfig({ ...base, PORT: "abc" })).toThrow();
    expect(() => loadConfig({ ...base, RATE_LIMIT: "0" })).toThrow();
    expect(() => loadConfig({ ...base, TRUST_PROXY: "yes" })).toThrow();
  });

  test("origins must be exact, with no wildcard", () => {
    expect(parseOrigins("https://a.example, http://localhost:3000")).toEqual([
      "https://a.example",
      "http://localhost:3000",
    ]);
    expect(parseOrigins("")).toEqual([]);
    expect(() => parseOrigins("*")).toThrow();
    expect(() => parseOrigins("https://a.example/")).toThrow();
  });
});

describe("allowlist", () => {
  test("allows backend route families", () => {
    for (const path of [
      "/auth/login",
      "/organizations/mine",
      "/organizations/abc/posts",
      "/notifications/unread-count",
      "/activities/1/registrations",
      "/media/1/file",
      "/realtime/tickets",
    ]) {
      expect(isAllowedPath(path)).toBe(true);
    }
  });

  test("refuses docs, unknown paths, and tricks", () => {
    for (const path of [
      "/",
      "/docs",
      "/openapi.json",
      "/redoc",
      "/healthz",
      "/unknown",
      "/auth/../docs",
      "/auth/%2e%2e/docs",
      "/auth%2F..%2Fdocs",
      "//auth/login",
      "/auth\\login",
      "/Auth/login",
    ]) {
      expect(isAllowedPath(path)).toBe(false);
    }
  });

  test("marks account routes as sensitive", () => {
    expect(isSensitivePath("/auth/login")).toBe(true);
    expect(isSensitivePath("/auth/password/reset/")).toBe(true);
    expect(isSensitivePath("/auth/refresh")).toBe(false);
    expect(isSensitivePath("/posts")).toBe(false);
  });
});

describe("rate limiter", () => {
  test("blocks over the limit and resets after the window", () => {
    let time = 0;
    const limiter = new RateLimiter(1000, () => time);
    expect(limiter.hit("a", 2).ok).toBe(true);
    expect(limiter.hit("a", 2).ok).toBe(true);
    const third = limiter.hit("a", 2);
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.retryAfterSeconds).toBe(1);
    expect(limiter.hit("b", 2).ok).toBe(true);
    time = 1000;
    expect(limiter.hit("a", 2).ok).toBe(true);
  });

  test("sweep drops expired windows", () => {
    let time = 0;
    const limiter = new RateLimiter(1000, () => time);
    limiter.hit("a", 1);
    time = 2000;
    limiter.sweep();
    expect(limiter.size).toBe(0);
  });
});

describe("headers", () => {
  const config = testConfig("http://x");

  test("drops client-supplied internal and forwarding headers", () => {
    const request = new Request("http://g/posts", {
      headers: {
        authorization: "Bearer t",
        "x-internal-key": "evil",
        "x-forwarded-for": "6.6.6.6",
        cookie: "a=b",
        host: "evil",
      },
    });
    const headers = upstreamHeaders(request, "1.2.3.4", config);
    expect(headers.get("authorization")).toBe("Bearer t");
    expect(headers.get("x-internal-key")).toBe(KEY);
    expect(headers.get("x-forwarded-for")).toBe("1.2.3.4");
    expect(headers.get("cookie")).toBeNull();
  });

  test("response drops cookies and hop-by-hop headers", () => {
    const out = downstreamHeaders(
      new Headers({ "set-cookie": "a=b", connection: "close", "x-a": "1" }),
    );
    expect(out.get("set-cookie")).toBeNull();
    expect(out.get("connection")).toBeNull();
    expect(out.get("x-a")).toBe("1");
    expect(out.get("x-content-type-options")).toBe("nosniff");
  });

  test("client ip uses the socket unless the proxy is trusted", () => {
    const request = new Request("http://g/", {
      headers: { "x-forwarded-for": "9.9.9.9, 8.8.8.8" },
    });
    expect(clientIp(request, "1.1.1.1", config)).toBe("1.1.1.1");
    const trusted = testConfig("http://x", { trustProxy: true });
    expect(clientIp(request, "1.1.1.1", trusted)).toBe("8.8.8.8");
    expect(clientIp(new Request("http://g/"), undefined, config)).toBe(
      "unknown",
    );
  });
});

test("normalizes IPv4-mapped IPv6 addresses", () => {
  expect(normalizeIp("::ffff:10.0.0.7")).toBe("10.0.0.7");
  expect(normalizeIp("2001:db8::1")).toBe("2001:db8::1");
});

describe("socket counter", () => {
  test("caps sockets per ip and frees a slot on close", () => {
    const counter = new SocketCounter();
    expect(counter.tryOpen("a", 2)).toBe(true);
    expect(counter.tryOpen("a", 2)).toBe(true);
    expect(counter.tryOpen("a", 2)).toBe(false);
    counter.close("a");
    expect(counter.tryOpen("a", 2)).toBe(true);
  });
});
