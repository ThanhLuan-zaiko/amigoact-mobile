import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Page from "./shell/Page";
import { mutedText, pageTitle, panel } from "./ui";

// Auth content inside the shared app frame, which already provides the header
// and navigation, as the web AuthShell sits inside the (app) layout.
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
    <Page>
      <View className="w-full max-w-md gap-6 self-center">
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
    </Page>
  );
}
