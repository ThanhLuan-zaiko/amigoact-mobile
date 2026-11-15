import type { ValidationIssue } from "./forms";

// The same result shape as the web backendFetch, so screens read alike.
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; issues: ValidationIssue[] };

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
};

type ValidationItem = { loc?: unknown[]; type?: unknown };

// Reads a backend or gateway error: `detail` is a stable code, or a list of
// field problems for validation errors.
export function parseFailure(
  status: number,
  payload: unknown,
): ApiResult<never> {
  const detail = (payload as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") {
    return { ok: false, status, code: detail, issues: [] };
  }
  if (Array.isArray(detail)) {
    const issues = (detail as ValidationItem[]).map((item) => ({
      field: String(item.loc?.at(-1) ?? ""),
      type: String(item.type ?? ""),
    }));
    return { ok: false, status, code: "validation_error", issues };
  }
  return { ok: false, status, code: "unknown_error", issues: [] };
}

const TIMEOUT_MS = 30_000;

export type Api = {
  request: <T>(path: string, options?: RequestOptions) => Promise<ApiResult<T>>;
};

// `fetchImpl` is injectable so tests need no network.
export function createApi(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): Api {
  async function request<T>(
    path: string,
    { method = "POST", body, token }: RequestOptions = {},
  ): Promise<ApiResult<T>> {
    const headers: Record<string, string> = { accept: "application/json" };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (token) headers.authorization = `Bearer ${token}`;
    // AbortSignal.timeout is not available in every React Native engine.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const text = await response.text();
      let payload: unknown = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = null;
      }
      if (!response.ok) return parseFailure(response.status, payload);
      return { ok: true, data: payload as T };
    } catch {
      // No answer at all: offline, DNS, timeout, or a refused connection.
      return { ok: false, status: 0, code: "network_error", issues: [] };
    } finally {
      clearTimeout(timer);
    }
  }
  return { request };
}
