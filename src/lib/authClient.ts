import type { AuthResponse, TokenPair, User } from "./account";
import type { Api, ApiResult, RequestOptions } from "./api";
import type { registerPayload } from "./registerForm";

export type RegisterBody = ReturnType<typeof registerPayload>;

// Where tokens are kept. The app uses expo-secure-store (see session.ts);
// tests use a plain object.
export type TokenStore = {
  load: () => Promise<TokenPair | null>;
  save: (tokens: TokenPair) => Promise<void>;
  clear: () => Promise<void>;
};

export type AuthClient = {
  login: (email: string, password: string) => Promise<ApiResult<AuthResponse>>;
  register: (body: RegisterBody) => Promise<ApiResult<AuthResponse>>;
  // Asks for a reset link by email. The answer never says if the email exists.
  forgotPassword: (email: string) => Promise<ApiResult<unknown>>;
  // Sets a new password with the token from the emailed link.
  resetPassword: (
    token: string,
    newPassword: string,
  ) => Promise<ApiResult<unknown>>;
  logout: () => Promise<void>;
  // The signed-in user from stored tokens, or null when there is no session.
  restore: () => Promise<User | null>;
  // Calls the API with the stored token. On 401 it refreshes once and retries.
  authed: <T>(
    path: string,
    options?: Omit<RequestOptions, "token">,
  ) => Promise<ApiResult<T>>;
};

export function createAuthClient(api: Api, store: TokenStore): AuthClient {
  // Refresh tokens rotate on every use, and reusing an old one ends the
  // session. So only one refresh runs at a time and every caller waits for it.
  let refreshing: Promise<TokenPair | null> | null = null;

  async function refreshTokens(stale: TokenPair): Promise<TokenPair | null> {
    const result = await api.request<TokenPair>("/auth/refresh", {
      body: { refresh_token: stale.refresh_token },
    });
    if (result.ok) {
      // Store the new pair before anything is retried with it.
      await store.save(result.data);
      return result.data;
    }
    // A network failure keeps the session, since the token may still be good.
    if (result.code !== "network_error") await store.clear();
    return null;
  }

  function refreshOnce(stale: TokenPair): Promise<TokenPair | null> {
    if (!refreshing) {
      refreshing = refreshTokens(stale).finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  }

  async function authed<T>(
    path: string,
    options: Omit<RequestOptions, "token"> = {},
  ): Promise<ApiResult<T>> {
    const tokens = await store.load();
    if (!tokens) {
      return { ok: false, status: 401, code: "not_authenticated", issues: [] };
    }
    const first = await api.request<T>(path, {
      ...options,
      token: tokens.access_token,
    });
    if (first.ok || first.status !== 401) return first;
    const fresh = await refreshOnce(tokens);
    if (!fresh) return first;
    return api.request<T>(path, { ...options, token: fresh.access_token });
  }

  return {
    async login(email, password) {
      const result = await api.request<AuthResponse>("/auth/login", {
        body: { email, password },
      });
      if (result.ok) await store.save(result.data.tokens);
      return result;
    },
    async register(body) {
      const result = await api.request<AuthResponse>("/auth/register", {
        body,
      });
      // A new account is signed in at once, as on the web.
      if (result.ok) await store.save(result.data.tokens);
      return result;
    },
    forgotPassword(email) {
      return api.request("/auth/password/forgot", { body: { email } });
    },
    resetPassword(token, newPassword) {
      return api.request("/auth/password/reset", {
        body: { token, new_password: newPassword },
      });
    },
    async logout() {
      const tokens = await store.load();
      // Revoke on the server first, so the session ends there too. The local
      // tokens go either way, even when the network is down.
      if (tokens) {
        await api.request("/auth/logout", {
          token: tokens.access_token,
          body: { refresh_token: tokens.refresh_token },
        });
      }
      await store.clear();
    },
    async restore() {
      const result = await authed<User>("/account/me", { method: "GET" });
      return result.ok ? result.data : null;
    },
    authed,
  };
}
