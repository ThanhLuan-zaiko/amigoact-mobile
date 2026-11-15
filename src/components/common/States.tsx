import type { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { errorText, mutedText, smallMuted } from "../ui";
import Icon, { type IconName } from "./Icon";

// The web "Đang tải…" line, with a spinner.
export function Loading({ label = "Đang tải…" }: { label?: string }) {
  const theme = useThemeColors();
  return (
    <View className="flex-row items-center gap-2 py-2">
      <ActivityIndicator size="small" color={theme.subtle} />
      <Text className={mutedText}>{label}</Text>
    </View>
  );
}

// A failed load, in the same words as the web page that could not load.
export function LoadError({
  children = "Không tải được dữ liệu. Vui lòng thử lại.",
}: {
  children?: ReactNode;
}) {
  return <Text className={mutedText}>{children}</Text>;
}

export function ErrorLine({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <Text accessibilityRole="alert" className={errorText}>
      {children}
    </Text>
  );
}

export default function EmptyState({
  title,
  description,
  icon = "inbox",
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <View className="items-center gap-3 rounded-md border border-dashed border-slate-300 px-6 py-10 dark:border-slate-700">
      <View className="h-12 w-12 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800">
        <Icon name={icon} size={20} tone="muted" />
      </View>
      <Text className="text-center font-body-semibold text-base text-slate-900 dark:text-slate-100">
        {title}
      </Text>
      <Text className={`text-center ${mutedText}`}>{description}</Text>
    </View>
  );
}

// An icon with a value, for what everyone understands: dates, places, counts.
export function IconStat({
  icon,
  label,
  children,
}: {
  icon: IconName;
  // Read by screen readers, since the icon replaces the word.
  label: string;
  children: ReactNode;
}) {
  const spoken =
    typeof children === "string" || typeof children === "number"
      ? `${label}: ${children}`
      : label;
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      className="min-w-0 shrink flex-row items-center gap-1.5"
    >
      <Icon name={icon} size={14} tone="subtle" />
      <Text className={`shrink ${mutedText}`}>{children}</Text>
    </View>
  );
}

// A sky notice for information, the only color in its block.
export function InfoNotice({ children }: { children: ReactNode }) {
  return (
    <View className="flex-row items-start gap-2 rounded-md border border-sky-200 p-3 dark:border-sky-900">
      <View className="mt-0.5">
        <Icon name="info" tone="info" />
      </View>
      <Text className="flex-1 font-body text-sm text-sky-700 dark:text-sky-400">
        {children}
      </Text>
    </View>
  );
}

export function WarningNotice({ children }: { children: ReactNode }) {
  return (
    <View className="flex-row items-start gap-2 rounded-md border border-amber-200 p-3 dark:border-amber-900">
      <View className="mt-0.5">
        <Icon name="alert-triangle" tone="warning" />
      </View>
      <Text className="flex-1 font-body text-sm text-amber-700 dark:text-amber-400">
        {children}
      </Text>
    </View>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <Text className={smallMuted}>{children}</Text>;
}
