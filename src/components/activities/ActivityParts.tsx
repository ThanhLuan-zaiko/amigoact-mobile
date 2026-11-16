import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  ACTIVITY_STATUS_LABELS,
  type ActivityDetail,
  type ActivitySummary,
  formatDateTime,
  formatTimeRange,
  REGISTRATION_STATUS_LABELS,
  type RegistrationStatus,
  type Shift,
  seatsText,
} from "@/lib/activities";
import { cancelRegistration, registerForActivity } from "@/lib/activityActions";
import { activityTagHref } from "@/lib/activityList";
import { appPath } from "@/lib/appPath";
import { auth } from "@/lib/client";
import ActionButton from "../common/ActionButton";
import ActionTextButton from "../common/ActionTextButton";
import Icon, { type IconName } from "../common/Icon";
import Picture from "../common/Picture";
import { IconStat } from "../common/States";
import {
  mutedText,
  panel,
  sectionTitle,
  strongText,
  tagChip,
  tagChipText,
} from "../ui";

// The web ActivityCard: the whole card opens the activity, tag chips lead to
// the activities with the same tag.
// A picture borrowed from a public post (or the organization cover) leads the
// card when the list has one, as on the web.
export function ActivityCard({ activity }: { activity: ActivitySummary }) {
  const place = [activity.location, activity.city].filter(Boolean).join(", ");
  const tags = activity.tags ?? [];
  const picture = activity.picture;
  return (
    <Pressable
      onPress={() => router.push(`/activities/${activity.id}` as never)}
      accessibilityRole="link"
      accessibilityLabel={activity.title}
      className={`${panel} min-w-0 overflow-hidden active:border-teal-700 dark:active:border-teal-400`}
    >
      {picture ? (
        <Picture
          src={picture.url}
          width={640}
          focus={picture.focus}
          className="aspect-video w-full"
        />
      ) : null}
      <View className="min-w-0 gap-2 p-4">
        <View className="flex-row items-start gap-2">
          <Text className={`min-w-0 flex-1 ${strongText}`}>
            {activity.title}
          </Text>
          {activity.status !== "published" ? (
            <View className={tagChip}>
              <Text className={tagChipText}>
                {ACTIVITY_STATUS_LABELS[activity.status]}
              </Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} className={mutedText}>
          {activity.organization_name}
        </Text>
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
          {activity.hours_awarded !== null ? (
            <IconStat icon="clock" label="Giờ tình nguyện">
              {`${activity.hours_awarded}h`}
            </IconStat>
          ) : null}
        </View>
        {tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {tags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() =>
                  router.push(
                    appPath(
                      activityTagHref(activity.organization_slug, tag),
                    ) as never,
                  )
                }
                accessibilityRole="link"
                accessibilityLabel={`Xem hoạt động cùng thẻ ${tag}`}
                className={tagChip}
              >
                <Text className={tagChipText}>#{tag}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const STATUS_ICONS: Record<RegistrationStatus, IconName> = {
  pending: "clock",
  approved: "check-circle",
  rejected: "x-circle",
  waitlisted: "list",
  cancelled: "slash",
  attended: "star",
};

export function RegistrationBadge({
  status,
  waitlistPosition,
}: {
  status: RegistrationStatus;
  waitlistPosition?: number | null;
}) {
  return (
    <View className={`${tagChip} flex-row items-center gap-1`}>
      <Icon name={STATUS_ICONS[status]} size={12} tone="muted" />
      <Text className={tagChipText}>
        {REGISTRATION_STATUS_LABELS[status]}
        {waitlistPosition ? ` #${waitlistPosition}` : ""}
      </Text>
    </View>
  );
}

// What the viewer can do for one seat: the whole activity, or one shift.
function SeatControl({
  activity,
  shift,
}: {
  activity: ActivityDetail;
  shift: Shift | null;
}) {
  const shiftId = shift?.id ?? null;
  const registration = activity.viewer.registrations.find(
    (item) => item.shift_id === shiftId,
  );
  const active =
    registration &&
    ["pending", "approved", "waitlisted"].includes(registration.status);
  const capacity = shift ? shift.capacity : activity.capacity;
  const taken = shift ? shift.seats_taken : activity.seats_taken;
  const full = capacity !== null && taken >= capacity;
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {registration ? (
        <RegistrationBadge
          status={registration.status}
          waitlistPosition={registration.waitlist_position}
        />
      ) : null}
      {active && activity.can_cancel_registration ? (
        <ActionButton
          action={() => cancelRegistration(registration.id)}
          icon="x"
          label="Hủy đăng ký"
          confirmLabel="Hủy đăng ký?"
        />
      ) : null}
      {!registration && activity.registration_open ? (
        <ActionTextButton
          action={async () => {
            // Visitors see the button too, so they log in first and come back.
            if (!auth.accessToken())
              return { next: `/login?next=/activities/${activity.id}` };
            return registerForActivity(activity.id, shiftId);
          }}
          icon={full ? "list" : "check"}
          label={full ? "Hết chỗ, vào danh sách chờ" : "Đăng ký"}
          variant={full ? "secondary" : "primary"}
        >
          {full ? "Xếp hàng chờ" : "Đăng ký"}
        </ActionTextButton>
      ) : null}
    </View>
  );
}

export function RegisterControls({ activity }: { activity: ActivityDetail }) {
  if (activity.shifts.length === 0) {
    return <SeatControl activity={activity} shift={null} />;
  }
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className={sectionTitle}>
        Ca
      </Text>
      {activity.shifts.map((shift, index) => (
        <View
          key={shift.id}
          className={`flex-row flex-wrap items-center gap-3 py-3 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
        >
          <View className="min-w-0 flex-1 basis-48 gap-1">
            <Text numberOfLines={1} className={strongText}>
              {shift.title}
            </Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              <IconStat icon="calendar" label="Thời gian">
                {formatTimeRange(shift.start_at, shift.end_at)}
              </IconStat>
              <IconStat icon="users" label="Số chỗ">
                {seatsText(shift.seats_taken, shift.capacity)}
              </IconStat>
            </View>
          </View>
          <SeatControl activity={activity} shift={shift} />
        </View>
      ))}
    </View>
  );
}
