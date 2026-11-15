import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Icon from "../common/Icon";
import { fieldLabel, sectionTitle, smallMuted } from "../ui";

// A titled group inside a form, the web FormSection. Every group after the
// first gets a border above it.
export default function FormSection({
  title,
  first = false,
  children,
}: {
  title: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <View
      className={`gap-4 ${first ? "" : "border-t border-slate-200 pt-6 dark:border-slate-800"}`}
    >
      <Text accessibilityRole="header" className={sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

// The dashed upload box of the web forms. A phone has no drag and drop, so it
// opens the photo library.
export function UploadBox({
  title,
  hint,
  onPress,
  disabled = false,
}: {
  title: string;
  hint: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      className={`items-center gap-1 rounded-md border border-dashed border-slate-300 p-6 active:border-teal-700 dark:border-slate-700 dark:active:border-teal-400 ${disabled ? "opacity-60" : ""}`}
    >
      <Icon name="upload-cloud" size={24} tone="subtle" />
      <Text className={`text-center ${fieldLabel}`}>{title}</Text>
      <Text className={`text-center ${smallMuted}`}>{hint}</Text>
    </Pressable>
  );
}
