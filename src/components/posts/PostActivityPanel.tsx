import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  ACTIVITY_STATUS_LABELS,
  type ActivitySummary,
  formatDateTimeZoned,
  seatsText,
} from "@/lib/activities";
import { canSignUp, isFull, seatWidthClass } from "@/lib/postActivity";
import Button from "../common/Button";
import Icon from "../common/Icon";
import Picture from "../common/Picture";
import { IconStat } from "../common/States";
import { mutedText, tagChip, tagChipText } from "../ui";

// The web PostActivityPanel, the "Hoạt động" tab of a post: what the activity
// is, when and where, how full it is, and the way to sign up. The activity
// screen checks every rule.
export default function PostActivityPanel({
  activity,
  postPictureUrls,
}: {
  activity: ActivitySummary;
  // Pictures already shown in the post, so the panel does not repeat one.
  postPictureUrls: string[];
}) {
  const href = `/activities/${activity.id}`;
  const go = () => router.push(href as never);
  const place = [activity.location, activity.city].filter(Boolean).join(", ");
  const open = canSignUp(activity);
  const bar = seatWidthClass(activity.seats_taken, activity.capacity);
  const picture =
    activity.picture && !postPictureUrls.includes(activity.picture.url)
      ? activity.picture
      : null;

  return (
    <View>
      {picture ? (
        <Picture
          src={picture.url}
          width={640}
          focus={picture.focus}
          className="aspect-video w-full"
        />
      ) : null}
      <View className="gap-3 p-4">
        <Pressable onPress={go} accessibilityRole="link">
          <Text className="font-body-semibold text-lg text-slate-900 dark:text-slate-100">
            {activity.title}
          </Text>
        </Pressable>
        <View className="flex-row flex-wrap gap-y-2">
          {activity.start_at ? (
            <View className="w-1/2">
              <IconStat icon="calendar" label="Thời gian">
                {formatDateTimeZoned(activity.start_at)}
              </IconStat>
            </View>
          ) : null}
          {activity.hours_awarded !== null ? (
            <View className="w-1/2">
              <IconStat icon="clock" label="Giờ tình nguyện">
                {`${activity.hours_awarded}h`}
              </IconStat>
            </View>
          ) : null}
          <View className="w-1/2">
            {activity.is_remote ? (
              <IconStat icon="wifi" label="Trực tuyến">
                Online
              </IconStat>
            ) : place ? (
              <IconStat icon="map-pin" label="Địa điểm">
                {place}
              </IconStat>
            ) : null}
          </View>
          <View className="w-1/2">
            <IconStat icon="users" label="Số chỗ">
              {seatsText(activity.seats_taken, activity.capacity)}
            </IconStat>
          </View>
        </View>
        {bar ? (
          <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <View
              className={`h-full rounded-full bg-teal-700 dark:bg-teal-400 ${bar}`}
            />
          </View>
        ) : null}
        {activity.registration_deadline ? (
          <Text className={mutedText}>
            {`Hạn đăng ký: ${formatDateTimeZoned(activity.registration_deadline)}`}
          </Text>
        ) : null}
        {open ? (
          <Button icon="user-plus" onPress={go}>
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
        <Pressable
          onPress={go}
          accessibilityRole="link"
          className="min-h-11 flex-row items-center justify-center gap-1"
        >
          <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
            Xem chi tiết hoạt động
          </Text>
          <Icon name="chevron-right" tone="accent" />
        </Pressable>
      </View>
    </View>
  );
}
