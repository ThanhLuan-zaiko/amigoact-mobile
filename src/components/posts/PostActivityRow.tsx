import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  ACTIVITY_STATUS_LABELS,
  type ActivitySummary,
  formatDateTime,
  seatsText,
} from "@/lib/activities";
import { canSignUp, isFull } from "@/lib/postActivity";
import Button from "../common/Button";
import Icon from "../common/Icon";
import { IconStat } from "../common/States";
import { tagChip, tagChipText } from "../ui";

// The activity a post is about, as a section of the post rather than a card
// in a card. People sign up on the activity screen, which checks every rule.
export default function PostActivityRow({
  activity,
}: {
  activity: ActivitySummary;
}) {
  const href = `/activities/${activity.id}`;
  const place = [activity.location, activity.city].filter(Boolean).join(", ");
  const open = canSignUp(activity);
  const go = () => router.push(href as never);

  return (
    <View
      accessibilityLabel="Hoạt động liên quan"
      className="gap-3 border-t border-slate-200 pt-3 dark:border-slate-800"
    >
      <View className="min-w-0 gap-1">
        <Pressable
          onPress={go}
          accessibilityRole="link"
          className="min-w-0 flex-row items-center gap-2"
        >
          <Icon name="calendar" tone="accent" />
          <Text
            numberOfLines={1}
            className="shrink font-body-semibold text-sm text-slate-900 dark:text-slate-100"
          >
            {activity.title}
          </Text>
          <Icon name="chevron-right" />
        </Pressable>
        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
          {activity.start_at ? (
            <IconStat icon="calendar" label="Thời gian">
              {formatDateTime(activity.start_at)}
            </IconStat>
          ) : null}
          {activity.is_remote ? (
            <IconStat icon="wifi" label="Trực tuyến">
              Online
            </IconStat>
          ) : place ? (
            <IconStat icon="map-pin" label="Địa điểm">
              {place}
            </IconStat>
          ) : null}
          <IconStat icon="users" label="Số chỗ">
            {seatsText(activity.seats_taken, activity.capacity)}
          </IconStat>
        </View>
      </View>
      {open ? (
        <Button icon="user-plus" onPress={go} className="self-start">
          {isFull(activity) ? "Vào hàng chờ" : "Đăng ký"}
        </Button>
      ) : (
        <View className={`${tagChip} self-start`}>
          <Text className={tagChipText}>
            {activity.status === "published"
              ? "Đã đóng đăng ký"
              : ACTIVITY_STATUS_LABELS[activity.status]}
          </Text>
        </View>
      )}
    </View>
  );
}
