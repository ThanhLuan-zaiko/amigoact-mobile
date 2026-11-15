import "../global.css";
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  useFonts,
} from "@expo-google-fonts/be-vietnam-pro";
import { Stack } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useUniwind } from "uniwind";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";
import { useThemeColors } from "@/hooks/useThemeColors";
import { restoreTheme } from "@/lib/themePreference";

function Routes() {
  const { status } = useAuth();
  const theme = useThemeColors();
  // Nothing is drawn until the stored session has been checked, so a signed-in
  // user never sees the login screen flash by.
  if (status === "loading") return null;
  // Every screen is open to visitors, as on the web. Screens that need an
  // account check it themselves with RequireUser and send visitors to log in.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.surface },
      }}
    />
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
  });
  const [themeReady, setThemeReady] = useState(false);
  const { theme } = useUniwind();

  useEffect(() => {
    restoreTheme().finally(() => setThemeReady(true));
  }, []);

  // The status bar follows the theme the app draws with, which may differ
  // from the system theme when the viewer picked one in the header.
  useEffect(() => {
    setStatusBarStyle(theme === "dark" ? "light" : "dark");
  }, [theme]);

  if (!loaded || !themeReady) return null;

  return (
    <AuthProvider>
      <RealtimeProvider>
        <Routes />
      </RealtimeProvider>
    </AuthProvider>
  );
}
