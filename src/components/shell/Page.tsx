import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { useThemeColors } from "@/hooks/useThemeColors";
import Icon, { type IconName } from "../common/Icon";
import { screen } from "../ui";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";

const Safe = withUniwind(SafeAreaView);

// The web (app) layout on a phone: the header on top, the page in one column
// with 16 points of padding, and the quick navigation at the bottom.
// `scroll={false}` hands scrolling to the child, for screens built on a
// FlatList. `onRefresh` adds pull-to-refresh.
export default function Page({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const theme = useThemeColors();
  return (
    <Safe edges={["top"]} className={screen}>
      <AppHeader />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 p-4 pb-8 md:mx-auto md:w-full md:max-w-3xl"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.accent}
                  colors={[theme.accent]}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View className="flex-1">{children}</View>
        )}
      </KeyboardAvoidingView>
      <BottomNav />
    </Safe>
  );
}

// A page title with an optional icon, the web "text-2xl font-extrabold" h1.
export function PageTitle({
  icon,
  children,
  action,
}: {
  icon?: IconName;
  children: ReactNode;
  // A button at the end of the title row.
  action?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        {icon ? <Icon name={icon} size={22} /> : null}
        <Text
          accessibilityRole="header"
          className="shrink font-body-semibold text-2xl text-slate-900 dark:text-slate-100"
        >
          {children}
        </Text>
      </View>
      {action}
    </View>
  );
}

// Props for a FlatList that sits in a Page with scroll={false}.
export const listContent = "gap-4 p-4 pb-8 md:mx-auto md:w-full md:max-w-3xl";
