// A link such as amigoact://reset-password?token=abc (or the same path on the
// web address, once app links are set up) opens a screen with the token in the
// query. Expo Router hands the query value over as a string, a list, or nothing.
const MAX_TOKEN_LENGTH = 512;

// The token from a route param, or null when it is missing or not usable. The
// backend decides whether it is valid; this only refuses what cannot be one.
export function tokenFromParam(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const token = raw.trim();
  if (!token || token.length > MAX_TOKEN_LENGTH) return null;
  return token;
}
