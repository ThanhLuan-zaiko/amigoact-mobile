import { describe, expect, test } from "bun:test";
import type { TokenPair, User } from "./account";
import type { Api, ApiResult, RequestOptions } from "./api";
import { createAuthClient, type TokenStore } from "./authClient";

const pair = (n: number): TokenPair => ({
  access_token: `a${n}`,
  refresh_token: `r${n}`,
  expires_in: 900,
  refresh_expires_in: 1000,
});

function memoryStore(initial: TokenPair | null): TokenStore & {
  value: TokenPair | null;
} {
  const store = {
    value: initial,
    load: async () => store.value,
    save: async (tokens: TokenPair) => {
      store.value = tokens;
    },
    clear: async () => {
      store.value = null;
    },
  };
  return store;
}

type Call = { path: string; options?: RequestOptions };

function scriptedApi(handler: (call: Call) => ApiResult<unknown>) {
  const calls: Call[] = [];
  const api: Api = {
    request: (async (path: string, options?: RequestOptions) => {
      const call = { path, options };
      calls.push(call);
      // A tick, so concurrent callers can overlap.
      await Promise.resolve();
      return handler(call);
    }) as Api["request"],
  };
  return { api, calls };
}

const ok = <T>(data: T): ApiResult<T> => ({ ok: true, data });
const fail = (status: number, code: string): ApiResult<never> => ({
  ok: false,
  status,
  code,
  issues: [],
});

const user = { id: "u1", full_name: "A" } as User;

describe("login", () => {
  test("stores the tokens on success", async () => {
    const store = memoryStore(null);
    const { api } = scriptedApi(() => ok({ user, tokens: pair(1) }));
    const result = await createAuthClient(api, store).login("a@b.vn", "pw");
    expect(result.ok).toBe(true);
    expect(store.value).toEqual(pair(1));
  });

  test("stores nothing on failure and passes the code up", async () => {
    const store = memoryStore(null);
    const { api } = scriptedApi(() => fail(401, "invalid_credentials"));
    const result = await createAuthClient(api, store).login("a@b.vn", "bad");
    expect(result).toMatchObject({ ok: false, code: "invalid_credentials" });
    expect(store.value).toBeNull();
  });
});

describe("register", () => {
  const body = {
    email: "a@b.vn",
    password: "Str0ng!pass",
    full_name: "A",
    phone: null,
    account_type: "individual" as const,
    company_name: null,
    tax_code: null,
  };

  test("posts the body and signs the new account in", async () => {
    const store = memoryStore(null);
    const { api, calls } = scriptedApi(() => ok({ user, tokens: pair(1) }));
    const result = await createAuthClient(api, store).register(body);
    expect(result.ok).toBe(true);
    expect(calls[0]?.path).toBe("/auth/register");
    expect(calls[0]?.options?.body).toEqual(body);
    expect(store.value).toEqual(pair(1));
  });

  test("a taken email stores nothing and keeps the code", async () => {
    const store = memoryStore(null);
    const { api } = scriptedApi(() => fail(409, "email_taken"));
    const result = await createAuthClient(api, store).register(body);
    expect(result).toMatchObject({ ok: false, code: "email_taken" });
    expect(store.value).toBeNull();
  });
});

describe("forgotPassword", () => {
  test("posts the email and stores no tokens", async () => {
    const store = memoryStore(null);
    const { api, calls } = scriptedApi(() => ok(null));
    const result = await createAuthClient(api, store).forgotPassword("a@b.vn");
    expect(result.ok).toBe(true);
    expect(calls[0]?.path).toBe("/auth/password/forgot");
    expect(calls[0]?.options?.body).toEqual({ email: "a@b.vn" });
    expect(store.value).toBeNull();
  });
});

describe("authed refresh", () => {
  test("refreshes once on 401, saves the new pair, then retries", async () => {
    const store = memoryStore(pair(1));
    const { api, calls } = scriptedApi((call) => {
      if (call.path === "/auth/refresh") return ok(pair(2));
      return call.options?.token === "a2"
        ? ok({ fine: true })
        : fail(401, "token_expired");
    });
    const result = await createAuthClient(api, store).authed("/x", {
      method: "GET",
    });
    expect(result).toEqual({ ok: true, data: { fine: true } });
    expect(store.value).toEqual(pair(2));
    expect(calls.map((c) => c.path)).toEqual(["/x", "/auth/refresh", "/x"]);
    expect(calls[1]?.options?.body).toEqual({ refresh_token: "r1" });
  });

  test("regression: parallel 401s share one refresh", async () => {
    const store = memoryStore(pair(1));
    const { api, calls } = scriptedApi((call) => {
      if (call.path === "/auth/refresh") return ok(pair(2));
      return call.options?.token === "a2" ? ok({}) : fail(401, "x");
    });
    const client = createAuthClient(api, store);
    const results = await Promise.all([
      client.authed("/a", { method: "GET" }),
      client.authed("/b", { method: "GET" }),
      client.authed("/c", { method: "GET" }),
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(calls.filter((c) => c.path === "/auth/refresh").length).toBe(1);
  });

  test("a rejected refresh clears the session", async () => {
    const store = memoryStore(pair(1));
    const { api } = scriptedApi((call) =>
      call.path === "/auth/refresh"
        ? fail(401, "refresh_invalid")
        : fail(401, "token_expired"),
    );
    const result = await createAuthClient(api, store).authed("/x", {
      method: "GET",
    });
    expect(result.ok).toBe(false);
    expect(store.value).toBeNull();
  });

  test("a network failure during refresh keeps the tokens", async () => {
    const store = memoryStore(pair(1));
    const { api } = scriptedApi((call) =>
      call.path === "/auth/refresh"
        ? fail(0, "network_error")
        : fail(401, "token_expired"),
    );
    await createAuthClient(api, store).authed("/x", { method: "GET" });
    expect(store.value).toEqual(pair(1));
  });

  test("no tokens means not authenticated, with no request", async () => {
    const { api, calls } = scriptedApi(() => ok({}));
    const result = await createAuthClient(api, memoryStore(null)).authed("/x");
    expect(result).toMatchObject({ ok: false, code: "not_authenticated" });
    expect(calls.length).toBe(0);
  });
});

describe("logout and restore", () => {
  test("logout revokes on the server and clears the tokens", async () => {
    const store = memoryStore(pair(1));
    const { api, calls } = scriptedApi(() => ok(null));
    await createAuthClient(api, store).logout();
    expect(calls[0]?.path).toBe("/auth/logout");
    expect(calls[0]?.options?.body).toEqual({ refresh_token: "r1" });
    expect(store.value).toBeNull();
  });

  test("logout clears the tokens even when the server is unreachable", async () => {
    const store = memoryStore(pair(1));
    const { api } = scriptedApi(() => fail(0, "network_error"));
    await createAuthClient(api, store).logout();
    expect(store.value).toBeNull();
  });

  test("restore returns the user, or null without a session", async () => {
    const { api } = scriptedApi(() => ok(user));
    expect(await createAuthClient(api, memoryStore(pair(1))).restore()).toEqual(
      user,
    );
    expect(await createAuthClient(api, memoryStore(null)).restore()).toBeNull();
  });
});
