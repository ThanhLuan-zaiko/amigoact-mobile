import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { linkText, mutedText } from "./ui";

// "Already have an account? Sign in" under an auth form.
export default function AuthSwitch({
  question,
  action,
  href,
}: {
  question: string;
  action: string;
  href: "/login" | "/register";
}) {
  return (
    <View className="flex-row flex-wrap items-center gap-1">
      <Text className={mutedText}>{question}</Text>
      <Link href={href} asChild>
        <Pressable accessibilityRole="link" className="min-h-11 justify-center">
          <Text className={linkText}>{action}</Text>
        </Pressable>
      </Link>
    </View>
  );
}
