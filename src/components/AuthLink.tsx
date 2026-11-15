import { Link } from "expo-router";
import { Pressable, Text } from "react-native";
import { linkText } from "./ui";

export type AuthHref = "/login" | "/register" | "/forgot-password";

// A text link between auth screens, at least 44 points tall to touch.
export default function AuthLink({
  href,
  children,
}: {
  href: AuthHref;
  children: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        className="min-h-11 items-start justify-center"
      >
        <Text className={linkText}>{children}</Text>
      </Pressable>
    </Link>
  );
}
