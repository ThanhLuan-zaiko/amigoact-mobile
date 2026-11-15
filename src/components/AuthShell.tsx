import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { mutedText, pageTitle, panel, screen } from "./ui";

// react-native-safe-area-context is not a React Native core component, so it
// needs withUniwind before it accepts className.
const Safe = withUniwind(SafeAreaView);

// Auth content inside a full screen: keyboard aware, scrollable on small
// phones, and centered to a readable width on tablets.
export default function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Safe className={screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow items-center justify-center p-4"
        >
          <View className="w-full max-w-md gap-6">
            <View className="gap-1">
              <Text accessibilityRole="header" className={pageTitle}>
                {title}
              </Text>
              {description ? (
                <Text className={mutedText}>{description}</Text>
              ) : null}
            </View>
            <View className={`${panel} p-5`}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Safe>
  );
}
