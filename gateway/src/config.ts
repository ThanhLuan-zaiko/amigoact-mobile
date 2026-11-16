export type Config = {
  backendUrl: string;
  internalKey: string;
  port: number;
  rateLimit: number;
  authRateLimit: number;
  maxBodyBytes: number;
  upstreamTimeoutMs: number;
  maxSocketsPerIp: number;
  trustProxy: boolean;
  wsOrigins: string[];
  corsOrigins: string[];
};

type Env = Record<string, string | undefined>;

const ORIGIN = /^https?:\/\/[A-Za-z0-9.-]+(:[0-9]{1,5})?$/;

function integer(env: Env, name: string, fallback: number, min = 1): number {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  if (!/^[0-9]+$/.test(raw) || Number(raw) < min) {
    throw new Error(`${name} must be a whole number of at least ${min}`);
  }
  return Number(raw);
}

function parseBackendUrl(raw: string | undefined): string {
  if (!raw?.trim()) throw new Error("BACKEND_URL is required");
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("BACKEND_URL is not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("BACKEND_URL must start with http:// or https://");
  }
  if (url.search || url.hash || url.username || url.password) {
    throw new Error("BACKEND_URL must not hold credentials, query, or hash");
  }
  return url.toString().replace(/\/+$/, "");
}

export function parseOrigins(
  text: string | undefined,
  name = "WS_ORIGINS",
): string[] {
  const origins = (text ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const origin of origins) {
    if (!ORIGIN.test(origin)) {
      throw new Error(`${name} has an invalid origin: ${origin}`);
    }
  }
  return origins;
}

// Reads and checks every setting once at start, so a bad value stops the
// gateway instead of failing on the first request.
export function loadConfig(env: Env = Bun.env): Config {
  const internalKey = env.INTERNAL_API_KEY?.trim() ?? "";
  if (internalKey.length < 32) {
    throw new Error("INTERNAL_API_KEY must be at least 32 characters");
  }
  const trust = (env.TRUST_PROXY ?? "false").trim().toLowerCase();
  if (trust !== "true" && trust !== "false") {
    throw new Error("TRUST_PROXY must be true or false");
  }
  return {
    backendUrl: parseBackendUrl(env.BACKEND_URL),
    internalKey,
    port: integer(env, "PORT", 8200),
    rateLimit: integer(env, "RATE_LIMIT", 300),
    authRateLimit: integer(env, "AUTH_RATE_LIMIT", 20),
    maxBodyBytes: integer(env, "MAX_BODY_MB", 52) * 1024 * 1024,
    upstreamTimeoutMs: integer(env, "UPSTREAM_TIMEOUT", 30) * 1000,
    maxSocketsPerIp: integer(env, "MAX_SOCKETS_PER_IP", 5),
    trustProxy: trust === "true",
    wsOrigins: parseOrigins(env.WS_ORIGINS, "WS_ORIGINS"),
    corsOrigins: parseOrigins(env.CORS_ORIGINS, "CORS_ORIGINS"),
  };
}
