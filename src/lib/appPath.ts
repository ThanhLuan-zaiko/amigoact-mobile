import { pagePath } from "./orgRoutes";

// Links built by the shared web helpers (notifications, tags, back links) are
// web addresses. The app has one address per screen: an organization's
// screens live at /org/<slug>/... for everyone, because a phone has no
// address bar to keep the owner's /organizations/<slug> form in. The hash is
// dropped; the query is kept as route params.
export function appPath(href: string): string {
  const hash = href.indexOf("#");
  const withoutHash = hash === -1 ? href : href.slice(0, hash);
  const cut = withoutHash.indexOf("?");
  const path = cut === -1 ? withoutHash : withoutHash.slice(0, cut);
  const query = cut === -1 ? "" : withoutHash.slice(cut);
  return `${pagePath(path) || "/"}${query}`;
}

// A route param as one string. Expo Router gives an array for repeated keys.
export function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
