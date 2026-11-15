import { isAllowedPath, isSensitivePath, METHODS } from "./allowlist";
import type { Config } from "./config";
import { clientIp, downstreamHeaders, upstreamHeaders } from "./headers";
import type { RateLimiter } from "./rateLimit";

// Error bodies copy the backend shape: `detail` is a stable code that the app
// translates, the same as for backend errors.
export function problem(
  status: number,
  detail: string,
  extra: Record<string, string> = {},
): Response {
  return Response.json(
    { detail },
    {
      status,
      headers: {
        "x-content-type-options": "nosniff",
        "cache-control": "no-store",
        ...extra,
      },
    },
  );
}

export function limited(
  limiter: RateLimiter,
  ip: string,
  pathname: string,
  config: Config,
): Response | null {
  const sensitive = isSensitivePath(pathname);
  const verdict = limiter.hit(
    `${sensitive ? "auth" : "all"}:${ip}`,
    sensitive ? config.authRateLimit : config.rateLimit,
  );
  if (verdict.ok) return null;
  return problem(429, "rate_limited", {
    "retry-after": String(verdict.retryAfterSeconds),
  });
}

export async function forward(
  request: Request,
  socketIp: string | undefined,
  config: Config,
  limiter: RateLimiter,
): Promise<Response> {
  const url = new URL(request.url);
  if (!METHODS.has(request.method)) return problem(405, "method_not_allowed");
  if (!isAllowedPath(url.pathname)) return problem(404, "not_found");

  const ip = clientIp(request, socketIp, config);
  const refused = limited(limiter, ip, url.pathname, config);
  if (refused) return refused;

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > config.maxBodyBytes) return problem(413, "payload_too_large");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const controller = new AbortController();
  // The timer covers the wait for the first byte. A long download or video
  // stream is not cut once the backend has started to answer.
  const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);
  try {
    const upstream = await fetch(
      config.backendUrl + url.pathname + url.search,
      {
        method: request.method,
        headers: upstreamHeaders(request, ip, config),
        body: hasBody ? request.body : undefined,
        redirect: "manual",
        signal: controller.signal,
      },
    );
    clearTimeout(timer);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: downstreamHeaders(upstream.headers),
    });
  } catch (error) {
    clearTimeout(timer);
    if (controller.signal.aborted) return problem(504, "upstream_timeout");
    console.error("upstream error:", (error as Error).name);
    return problem(502, "upstream_unavailable");
  }
}
