import { checkInUrl } from "./attendance";

// The web address that the attendance QR opens, as on the web page. A phone
// camera opens it in the browser, and the app's scanner reads its token. The
// address is EXPO_PUBLIC_APP_URL (a URL, not a secret). Without it the QR
// opens the app through its own scheme.
export function sessionQrUrl(
  appUrl: string | undefined,
  token: string,
): string {
  const origin = appUrl?.trim();
  return origin
    ? checkInUrl(origin, origin, token)
    : `amigoact://checkin?token=${encodeURIComponent(token)}`;
}

const MAX_TOKEN = 512;

// The check-in token in a scanned QR: the ?token= of a /checkin address on
// any host or on the app scheme. Anything else is not a check-in QR.
export function tokenFromScan(text: string): string | null {
  const value = text.trim();
  const match =
    /^(?:https?:\/\/[^/?#]+|amigoact:\/\/?)\/?checkin\/?\?(.*)$/i.exec(value);
  if (!match) return null;
  const query = match[1].split("#")[0];
  for (const part of query.split("&")) {
    const [key, raw = ""] = part.split("=");
    if (key !== "token") continue;
    let token: string;
    try {
      token = decodeURIComponent(raw.replace(/\+/g, " ")).trim();
    } catch {
      return null;
    }
    return token && token.length <= MAX_TOKEN ? token : null;
  }
  return null;
}
