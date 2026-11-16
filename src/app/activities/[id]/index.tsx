import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { RegisterControls } from "@/components/activities/ActivityParts";
import { ActivityNotFound } from "@/components/activities/ActivityScreen";
import ManageActions from "@/components/activities/ManageActions";
import CertificatePanel from "@/components/certificates/CertificatePanel";
import Icon from "@/components/common/Icon";
import { IconStat, LoadError, Loading } from "@/components/common/States";
import Page from "@/components/shell/Page";
import { panel, tagChip, tagChipText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import {
  ACTIVITY_STATUS_LABELS,
  type ActivityDetail,
  formatDateTimeZoned,
  formatTimeRange,
  seatsText,
} from "@/lib/activities";
import { getActivity } from "@/lib/activityApi";
import { param } from "@/lib/appPath";

function ActivityContent({ activity }: { activity: ActivityDetail }) {
  const place = [activity.location, activity.address, activity.city]
    .filter(Boolean)
    .join(", ");
  return (
    <>
      <View className={`${panel} min-w-0 gap-4 p-4`}>
        <View className="gap-2">
          <View className="flex-row flex-wrap items-start gap-2">
            <Text
              accessibilityRole="header"
              selectable
              className="min-w-0 flex-1 basis-56 font-body-semibold text-2xl text-slate-900 dark:text-slate-100"
            >
              {activity.title}
            </Text>
            <View className={tagChip}>
              <Text className={tagChipText}>
                {ACTIVITY_STATUS_LABELS[activity.status]}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() =>
              router.push(`/org/${activity.organization_slug}` as never)
            }
            accessibilityRole="link"
            className="self-start"
          >
            <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
              {activity.organization_name}
            </Text>
          </Pressable>
        </View>
        <View className="flex-row flex-wrap gap-x-5 gap-y-2">
          {activity.start_at ? (
            <IconStat icon="calendar" label="Thời gian">
              {formatTimeRange(activity.start_at, activity.end_at)}
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
          {activity.waitlist_count > 0 ? (
            <IconStat icon="list" label="Danh sách chờ">
              {activity.waitlist_count}
            </IconStat>
          ) : null}
          {activity.hours_awarded !== null ? (
            <IconStat icon="clock" label="Giờ tình nguyện">
              {`${activity.hours_awarded}h`}
            </IconStat>
          ) : null}
        </View>
        {activity.description ? (
          <Text
            selectable
            className="border-t border-slate-200 pt-4 font-body text-base leading-7 text-slate-700 dark:border-slate-800 dark:text-slate-300"
          >
            {activity.description}
          </Text>
        ) : null}
      </View>
      <View className={`${panel} gap-4 p-4`}>
        <View className="flex-row items-center gap-2">
          <Icon name="user-plus" />
          <Text
            accessibilityRole="header"
            className="font-body-semibold text-lg text-slate-900 dark:text-slate-100"
          >
            Đăng ký tham gia
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-x-5 gap-y-2">
          <IconStat icon="users" label="Số chỗ">
            {seatsText(activity.seats_taken, activity.capacity)}
          </IconStat>
          {activity.registration_deadline ? (
            <IconStat icon="watch" label="Hạn đăng ký">
              {formatDateTimeZoned(activity.registration_deadline)}
            </IconStat>
          ) : null}
        </View>
        <RegisterControls activity={activity} />
      </View>
      {activity.viewer.can_manage ? (
        <ManageActions activity={activity} />
      ) : null}
      {activity.viewer.can_manage && activity.status === "completed" ? (
        <CertificatePanel
          activityId={activity.id}
          organizationSlug={activity.organization_slug}
        />
      ) : null}
    </>
  );
}

export default function ActivityScreen() {
  const id = param(useLocalSearchParams<{ id?: string }>().id);
  const activity = useLoad(async () => {
    try {
      return { found: await getActivity(id) };
    } catch {
      return { found: undefined };
    }
  }, [id]);
  return (
    <Page
      refreshing={activity.refreshing}
      onRefresh={() => activity.reload(true)}
    >
      {activity.loading ? (
        <Loading />
      ) : activity.data?.found === undefined ? (
        <LoadError>Không tải được hoạt động. Vui lòng thử lại.</LoadError>
      ) : activity.data.found === null ? (
        <ActivityNotFound />
      ) : (
        <ActivityContent activity={activity.data.found} />
      )}
    </Page>
  );
}
