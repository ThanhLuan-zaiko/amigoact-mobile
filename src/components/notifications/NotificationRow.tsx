import { Pressable, Text, View } from "react-native";
import {
  describeNotification,
  type NotificationItem,
  timeAgo,
} from "@/lib/notifications";
import Icon, { type IconName } from "../common/Icon";

function iconFor(type: string): IconName {
  if (type === "membership_requested") return "user-plus";
  if (type === "member_left") return "user-minus";
  if (type === "membership_removed") return "user-x";
  if (type.startsWith("membership_")) return "users";
  if (type === "hours_awarded") return "clock";
  if (type.startsWith("certificate_")) return "award";
  if (type.startsWith("registration_") || type.startsWith("activity_")) {
    return "calendar";
  }
  return "bell";
}

// One notification in the bell panel or on the notifications screen.
export default function NotificationRow({
  item,
  onChoose,
}: {
  item: NotificationItem;
  onChoose: (item: NotificationItem) => void;
}) {
  const view = describeNotification(item);
  return (
    <Pressable
      onPress={() => onChoose(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.read ? "" : "Chưa đọc. "}${view.text}`}
      className={`flex-row items-start gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-900 ${
        item.read ? "" : "bg-teal-50 dark:bg-teal-950/40"
      }`}
    >
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700">
        <Icon name={iconFor(item.type)} size={14} tone="muted" />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text
          className={`text-sm text-slate-900 dark:text-slate-100 ${
            item.read ? "font-body" : "font-body-semibold"
          }`}
        >
          {view.text}
        </Text>
        {view.detail ? (
          <Text
            numberOfLines={2}
            className="border-l-2 border-slate-300 pl-2 font-body text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400"
          >
            {view.detail}
          </Text>
        ) : null}
        <Text className="font-body text-xs text-slate-500 dark:text-slate-400">
          {timeAgo(item.created_at)}
        </Text>
      </View>
      {item.read ? null : (
        <View className="mt-2 h-2 w-2 rounded-full bg-teal-700 dark:bg-teal-400" />
      )}
    </Pressable>
  );
}
