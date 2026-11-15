import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FormState } from "@/lib/account";
import {
  fieldError,
  mutedText,
  primaryButton,
  primaryButtonText,
  successText,
} from "./ui";

export function SubmitButton({
  pending,
  icon,
  onPress,
  children,
}: {
  pending: boolean;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      accessibilityRole="button"
      accessibilityState={{ disabled: pending, busy: pending }}
      className={`${primaryButton} ${pending ? "opacity-50" : ""}`}
    >
      {pending ? (
        <ActivityIndicator size="small" color={theme.onAccent} />
      ) : (
        <Feather name={icon} size={16} color={theme.onAccent} />
      )}
      <Text className={primaryButtonText}>{children}</Text>
    </Pressable>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  const theme = useThemeColors();
  if (state.success) {
    return (
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="flex-row items-start gap-2 rounded-md border border-green-200 p-3 dark:border-green-900"
      >
        <View className="mt-0.5">
          <Feather name="check-circle" size={16} color={theme.success} />
        </View>
        <Text className={`flex-1 text-sm ${successText}`}>{state.success}</Text>
      </View>
    );
  }
  if (!state.error) return null;
  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-start gap-2 rounded-md border border-red-200 p-3 dark:border-red-900"
    >
      <View className="mt-0.5">
        <Feather name="alert-circle" size={16} color={theme.error} />
      </View>
      <Text className={`flex-1 text-sm ${fieldError}`}>{state.error}</Text>
    </View>
  );
}

// Explains the asterisk once, above a form that has required fields.
export function RequiredLegend() {
  return (
    <Text className={mutedText}>
      <Text className="text-red-700 dark:text-red-400">*</Text> Trường bắt buộc
    </Text>
  );
}
