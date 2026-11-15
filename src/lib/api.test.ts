import { describe, expect, test } from "bun:test";
import { createApi, parseFailure } from "./api";
import { failureState } from "./forms";
import { GATEWAY_CODES } from "./gatewayErrors";

function fakeFetch(status: number, body: unknown, seen: Request[] = []) {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    seen.push(new Request(String(input), init));
    return new Response(
      typeof body === "string" ? body : JSON.stringify(body),
      { status },
    );
  }) as typeof fetch;
}

describe("parseFailure", () => {
  test("reads a stable code", () => {
    expect(parseFailure(401, { detail: "invalid_credentials" })).toEqual({
      ok: false,
      status: 401,
      code: "invalid_credentials",
      issues: [],
    });
  });

  test("reads validation issues by last location part", () => {
    const result = parseFailure(422, {
      detail: [{ loc: ["body", "email"], type: "missing" }],
    });
    expect(result).toMatchObject({
      code: "validation_error",
      issues: [{ field: "email", type: "missing" }],
    });
  });

  test("unknown shapes become unknown_error", () => {
    expect(parseFailure(500, null)).toMatchObject({ code: "unknown_error" });
    expect(parseFailure(500, { detail: 5 })).toMatchObject({
      code: "unknown_error",
    });
  });
});

describe("createApi", () => {
  test("sends json and the bearer token", async () => {
    const seen: Request[] = [];
    const api = createApi("http://gw", fakeFetch(200, { a: 1 }, seen));
    const result = await api.request("/posts", {
      body: { x: 1 },
      token: "tok",
    });
    expect(result).toEqual({ ok: true, data: { a: 1 } });
    expect(seen[0]?.url).toBe("http://gw/posts");
    expect(seen[0]?.headers.get("authorization")).toBe("Bearer tok");
    expect(seen[0]?.headers.get("content-type")).toBe("application/json");
    expect(await seen[0]?.json()).toEqual({ x: 1 });
  });

  test("a GET has no body and no content type", async () => {
    const seen: Request[] = [];
    const api = createApi("http://gw", fakeFetch(200, {}, seen));
    await api.request("/feed", { method: "GET" });
    expect(seen[0]?.headers.get("content-type")).toBeNull();
  });

  test("an error status becomes a failure with the backend code", async () => {
    const api = createApi(
      "http://gw",
      fakeFetch(429, { detail: "rate_limited" }),
    );
    expect(await api.request("/auth/login", {})).toMatchObject({
      ok: false,
      status: 429,
      code: "rate_limited",
    });
  });

  test("a 204 with no body is a success", async () => {
    const api = createApi("http://gw", fakeFetch(204, ""));
    expect(await api.request("/auth/logout", {})).toEqual({
      ok: true,
      data: null,
    });
  });

  test("no answer becomes network_error", async () => {
    const api = createApi("http://gw", (async () => {
      throw new TypeError("offline");
    }) as unknown as typeof fetch);
    expect(await api.request("/x", {})).toMatchObject({
      ok: false,
      status: 0,
      code: "network_error",
    });
  });
});

describe("gateway error codes", () => {
  test("every gateway code has a Vietnamese message", () => {
    for (const code of GATEWAY_CODES) {
      const state = failureState(code);
      expect(state.error).toBeTruthy();
      expect(state.error).not.toBe("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  });

  test("covers every code the gateway can send", () => {
    // Keep in step with the codes listed in gateway/AGENTS.md.
    for (const code of [
      "not_found",
      "method_not_allowed",
      "rate_limited",
      "payload_too_large",
      "upstream_unavailable",
      "upstream_timeout",
      "origin_forbidden",
      "too_many_sockets",
      "upgrade_failed",
    ]) {
      expect(GATEWAY_CODES).toContain(code);
    }
  });
});
