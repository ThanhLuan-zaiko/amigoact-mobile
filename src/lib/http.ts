import type { ApiResult, RequestOptions } from "./api";
import { API_URL, api, auth } from "./client";
import { asFocus, type Focus } from "./focus";
import { sizedSrc } from "./pictureSizes";

// The mobile counterpart of the web backendFetch and authedFetch. Every call
// goes to the gateway (EXPO_PUBLIC_API_URL), never to the backend itself.

type Method = NonNullable<RequestOptions["method"]>;

// A read that sends the viewer's token when there is one, so members see what
// members see and visitors see the public view. Like the web, a failure is null.
export async function read<T>(path: string): Promise<T | null> {
  const result = await readResult<T>(path);
  return result.ok ? result.data : null;
}

export async function readResult<T>(path: string): Promise<ApiResult<T>> {
  if (auth.accessToken()) {
    return auth.authed<T>(path, { method: "GET" });
  }
  return api.request<T>(path, { method: "GET" });
}

// A write with the stored token. The backend checks every call again.
export function send<T = unknown>(
  path: string,
  method: Method = "POST",
  body?: unknown,
): Promise<ApiResult<T>> {
  return auth.authed<T>(
    path,
    body === undefined ? { method } : { method, body },
  );
}

export function pathPart(value: string): string {
  return encodeURIComponent(value);
}

export function orgPath(slug: string): string {
  return `/organizations/${pathPart(slug)}`;
}

// A file picked on the phone, as React Native's FormData takes it.
export type LocalFile = { uri: string; name: string; type: string };

export type UploadResult =
  | { ok: true; id: string; focus: Focus | null }
  | { ok: false; code: string };

// Uploads one picture or video. Only the returned asset id goes with a form,
// the same as the web /media/upload route.
export async function uploadMedia(file: LocalFile): Promise<UploadResult> {
  const form = new FormData();
  // React Native reads { uri, name, type } as a file part.
  form.append("file", file as unknown as Blob);
  const result = await auth.authed<{ id: string; focus?: unknown }>("/media", {
    method: "POST",
    form,
    timeoutMs: 180_000,
  });
  return result.ok
    ? { ok: true, id: result.data.id, focus: asFocus(result.data.focus) }
    : { ok: false, code: result.code };
}

// A source for expo-image. Server paths ("/media/...") go through the gateway
// with the token, so private pictures load for people allowed to see them.
// Local files and data URIs pass through unchanged.
export type ImageSource = {
  uri: string;
  headers?: Record<string, string>;
};

export function mediaSource(src: string, width?: number): ImageSource {
  if (!src.startsWith("/")) return { uri: src };
  const path = width ? sizedSrc(src, width) : src;
  const token = auth.accessToken();
  return token
    ? {
        uri: `${API_URL}${path}`,
        headers: { authorization: `Bearer ${token}` },
      }
    : { uri: `${API_URL}${path}` };
}

// A plain address on the gateway, for links opened in the browser (PDFs).
export function gatewayUrl(path: string): string {
  return `${API_URL}${path}`;
}
