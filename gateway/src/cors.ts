import { METHODS } from "./allowlist";
import type { Config } from "./config";

// CORS is for running the app in a browser during development (Expo web).
// Native apps send no Origin and never need it. Only exact origins listed in
// CORS_ORIGINS get the headers; every other origin gets none, so the browser
// blocks the page. Credentials are never allowed: the app sends a bearer
// token, not cookies.

const ALLOW_HEADERS = "authorization, content-type, accept, accept-language";
const EXPOSE_HEADERS = "retry-after, content-disposition";
const MAX_AGE_SECONDS = "600";

export function allowedOrigin(request: Request, config: Config): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return config.corsOrigins.includes(origin) ? origin : null;
}

export function isPreflight(request: Request): boolean {
  return (
    request.method === "OPTIONS" &&
    request.headers.has("access-control-request-method")
  );
}

// Answers a preflight without touching the backend or the rate limiter.
export function preflight(request: Request, config: Config): Response {
  const origin = allowedOrigin(request, config);
  const headers = new Headers({ vary: "Origin" });
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", [...METHODS].join(", "));
    headers.set("access-control-allow-headers", ALLOW_HEADERS);
    headers.set("access-control-max-age", MAX_AGE_SECONDS);
  }
  return new Response(null, { status: origin ? 204 : 403, headers });
}

// Adds CORS headers to any response, including gateway errors, so the page
// can read a `rate_limited` or `not_found` code instead of a network error.
export function withCors(
  response: Response,
  request: Request,
  config: Config,
): Response {
  if (config.corsOrigins.length === 0) return response;
  const origin = allowedOrigin(request, config);
  const headers = new Headers(response.headers);
  headers.append("vary", "Origin");
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-expose-headers", EXPOSE_HEADERS);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
