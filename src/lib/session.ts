import * as SecureStore from "expo-secure-store";
import type { TokenPair } from "./account";
import type { TokenStore } from "./authClient";

// Tokens live only in the device keystore (Keychain on iOS, Keystore on
// Android). Never use AsyncStorage for them and never log them.
const KEY = "amigoact.tokens";

function isTokenPair(value: unknown): value is TokenPair {
  const pair = value as Partial<TokenPair> | null;
  return (
    typeof pair?.access_token === "string" &&
    typeof pair?.refresh_token === "string"
  );
}

export const secureTokenStore: TokenStore = {
  async load() {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isTokenPair(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  async save(tokens) {
    await SecureStore.setItemAsync(KEY, JSON.stringify(tokens));
  },
  async clear() {
    await SecureStore.deleteItemAsync(KEY);
  },
};
