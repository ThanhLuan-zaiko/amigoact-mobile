import type { ConfigContext, ExpoConfig } from "expo/config";

// app.json holds the fixed settings, including the `amigoact` link scheme that
// opens amigoact://reset-password?token=... Here we add web-address links
// (iOS universal links and Android app links) when APP_LINK_HOST is set at
// build time, for example APP_LINK_HOST=amigoact.example.com. The host is the
// address of the web app that sends the emails (FRONTEND_URL on the backend).
// Without it the app builds with the custom scheme only.
//
// Web-address links also need the web app to serve two files, and the app
// needs its store ids. See docs/deep-links.md.
const LINK_PATHS = ["/reset-password", "/verify-email", "/checkin"];

export default ({ config }: ConfigContext): ExpoConfig => {
  const host = process.env.APP_LINK_HOST?.trim();
  if (!host) return config as ExpoConfig;
  if (!/^[a-z0-9.-]+$/i.test(host)) {
    throw new Error(
      "APP_LINK_HOST must be a bare host name, no scheme or path",
    );
  }
  return {
    ...config,
    ios: {
      ...config.ios,
      associatedDomains: [
        ...(config.ios?.associatedDomains ?? []),
        `applinks:${host}`,
      ],
    },
    android: {
      ...config.android,
      intentFilters: [
        ...(config.android?.intentFilters ?? []),
        {
          action: "VIEW",
          autoVerify: true,
          data: LINK_PATHS.map((pathPrefix) => ({
            scheme: "https",
            host,
            pathPrefix,
          })),
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
  } as ExpoConfig;
};
