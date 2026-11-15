import { Text, View } from "react-native";
import AuthLink, { type AuthHref } from "./AuthLink";
import { mutedText } from "./ui";

// "Already have an account? Sign in" under an auth form.
export default function AuthSwitch({
  question,
  action,
  href,
}: {
  question: string;
  action: string;
  href: AuthHref;
}) {
  return (
    <View className="flex-row flex-wrap items-center gap-1">
      <Text className={mutedText}>{question}</Text>
      <AuthLink href={href}>{action}</AuthLink>
    </View>
  );
}
