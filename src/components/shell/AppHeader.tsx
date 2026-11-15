import { Link, router, useGlobalSearchParams, usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useUniwind } from "uniwind";
import { chooseTheme } from "@/lib/themePreference";
import { useAuth } from "../AuthProvider";
import { IconButton } from "../common/Button";
import NotificationBell from "../notifications/NotificationBell";
import AccountMenu from "./AccountMenu";
import ComposeMenu from "./ComposeMenu";

// The home screen's "Tổ chức" tab searches organizations. Every other screen
// searches activities, as the web header search does.
function useSearchTarget() {
  const pathname = usePathname();
  const { tab } = useGlobalSearchParams<{ tab?: string }>();
  return pathname === "/" && tab === "orgs"
    ? { label: "Tìm tổ chức", href: "/?tab=orgs&focus=search" }
    : { label: "Tìm hoạt động", href: "/explore?focus=search" };
}

export function ThemeToggle() {
  const { theme } = useUniwind();
  return (
    <IconButton
      icon={theme === "dark" ? "sun" : "moon"}
      label="Đổi giao diện sáng/tối"
      onPress={() => chooseTheme(theme === "dark" ? "light" : "dark")}
    />
  );
}

// The web AppHeader at phone width: the "A" mark, then search, compose, theme,
// bell (signed in only) and the account button.
export default function AppHeader() {
  const { user } = useAuth();
  const search = useSearchTarget();
  return (
    <View className="h-16 flex-row items-center gap-2 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
      <Link href="/" asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="AmigoACT"
          className="h-11 justify-center"
        >
          <View className="h-8 w-8 items-center justify-center rounded-md border border-slate-900 dark:border-slate-100">
            <Text className="font-body-semibold text-sm text-slate-900 dark:text-slate-100">
              A
            </Text>
          </View>
        </Pressable>
      </Link>
      <View className="ml-auto flex-row items-center gap-2">
        <IconButton
          icon="search"
          label={search.label}
          onPress={() => router.push(search.href as never)}
        />
        <ComposeMenu />
        <ThemeToggle />
        {user ? <NotificationBell /> : null}
        <AccountMenu />
      </View>
    </View>
  );
}
