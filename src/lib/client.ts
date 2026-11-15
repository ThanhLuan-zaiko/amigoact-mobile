import { createApi } from "./api";
import { createAuthClient } from "./authClient";
import { secureTokenStore } from "./session";

// The gateway address. It is a URL, not a secret: the internal key stays in
// the gateway. EXPO_PUBLIC_* values are inlined into the bundle at build time.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(
  /\/+$/,
  "",
);

export const api = createApi(API_URL);
export const auth = createAuthClient(api, secureTokenStore);
