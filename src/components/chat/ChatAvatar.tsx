import { Text, View } from "react-native";
import { initials } from "@/lib/organizations";
import Icon from "../common/Icon";
import Picture from "../common/Picture";

const SIZES = { sm: "h-9 w-9", md: "h-11 w-11" };

// A round picture, or the initials when there is none. A channel shows its
// mark instead, so it reads apart from the general room.
export default function ChatAvatar({
  name,
  url,
  channel = null,
  size = "md",
}: {
  name: string;
  url: string | null;
  channel?: "open" | "restricted" | null;
  size?: "sm" | "md";
}) {
  const box = `${SIZES[size]} items-center justify-center overflow-hidden rounded-full border border-slate-200 dark:border-slate-800`;
  if (channel) {
    return (
      <View className={box}>
        <Icon name={channel === "restricted" ? "lock" : "hash"} tone="muted" />
      </View>
    );
  }
  if (url) {
    return (
      <View className={box}>
        <Picture src={url} width={320} className="h-full w-full" />
      </View>
    );
  }
  return (
    <View className={box}>
      <Text
        className={`font-body-semibold text-slate-700 dark:text-slate-300 ${size === "sm" ? "text-xs" : "text-sm"}`}
      >
        {initials(name) || "?"}
      </Text>
    </View>
  );
}
