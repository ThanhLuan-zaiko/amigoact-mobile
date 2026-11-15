import type { ReactNode } from "react";
import { Text, View } from "react-native";
import BackLink from "./BackLink";

// The web row of a back arrow and the page title, used on sub-screens.
export default function BackTitle({
  href,
  children,
  action,
}: {
  href: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <BackLink href={href} />
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        className="min-w-0 flex-1 font-body-semibold text-2xl text-slate-900 dark:text-slate-100"
      >
        {children}
      </Text>
      {action}
    </View>
  );
}
