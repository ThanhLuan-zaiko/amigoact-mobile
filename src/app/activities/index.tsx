import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { RegistrationBadge } from "@/components/activities/ActivityParts";
import ActionButton from "@/components/common/ActionButton";
import Button, { IconButton } from "@/components/common/Button";
import Icon, { ExtraIcon } from "@/components/common/Icon";
import InlineReasonForm from "@/components/common/InlineForm";
import EmptyState, { IconStat, Loading } from "@/components/common/States";
import RequireUser from "@/components/RequireUser";
import Page, { PageTitle } from "@/components/shell/Page";
import {
  mutedText,
  panel,
  strongText,
  tagChip,
  tagChipText,
} from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { formatDateTime, type MyRegistration } from "@/lib/activities";
import { cancelRegistration } from "@/lib/activityActions";
import { getMyRegistrations } from "@/lib/activityApi";
import { APPEAL_STATUS_LABELS } from "@/lib/attendance";
import { createAppeal } from "@/lib/attendanceApi";

function Badge({
  icon,
  children,
}: {
  icon: "check" | "flag" | "qr";
  children: string;
}) {
  return (
    <View className={`${tagChip} flex-row items-center gap-1`}>
      {icon === "qr" ? (
        <ExtraIcon name="qrcode" size={12} tone="muted" />
      ) : (
        <Icon name={icon} size={12} tone="muted" />
      )}
      <Text className={tagChipText}>{children}</Text>
    </View>
  );
}

function RegistrationRow({
  registration,
  first,
}: {
  registration: MyRegistration;
  first: boolean;
}) {
  return (
    <View
      className={`flex-row flex-wrap items-center gap-3 py-3 ${first ? "" : "border-t border-slate-200 dark:border-slate-800"}`}
    >
      <View className="min-w-0 flex-1 basis-56 gap-1">
        <Pressable
          onPress={() =>
            router.push(`/activities/${registration.activity_id}` as never)
          }
          accessibilityRole="link"
        >
          <Text className={strongText}>{registration.activity_title}</Text>
        </Pressable>
        <Text numberOfLines={1} className={mutedText}>
          {registration.organization_name}
          {registration.shift_title ? ` · ${registration.shift_title}` : ""}
        </Text>
        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
          <IconStat icon="calendar" label="Thời gian">
            {formatDateTime(registration.start_at)}
          </IconStat>
          {registration.location ? (
            <IconStat icon="map-pin" label="Địa điểm">
              {registration.location}
            </IconStat>
          ) : null}
        </View>
      </View>
      <RegistrationBadge
        status={registration.status}
        waitlistPosition={registration.waitlist_position}
      />
      {registration.attendance === "pending" ? (
        <Badge icon="qr">Chờ xác nhận</Badge>
      ) : null}
      {registration.attendance === "verified" &&
      registration.status !== "attended" ? (
        <Badge icon="check">Có mặt</Badge>
      ) : null}
      {registration.appeal_status ? (
        <Badge icon="flag">
          {APPEAL_STATUS_LABELS[registration.appeal_status]}
        </Badge>
      ) : null}
      {registration.can_appeal ? (
        <InlineReasonForm
          openIcon="flag"
          openLabel="Khiếu nại điểm danh"
          fieldLabel="Lý do khiếu nại"
          submitIcon="send"
          submitLabel="Gửi"
          submit={(reason) => createAppeal(registration.id, reason)}
        />
      ) : null}
      {registration.can_cancel ? (
        <ActionButton
          action={() => cancelRegistration(registration.id)}
          icon="x"
          label="Hủy đăng ký"
          confirmLabel="Hủy đăng ký?"
        />
      ) : null}
    </View>
  );
}

function MyActivities() {
  const registrations = useLoad(() => getMyRegistrations(), []);
  const list = registrations.data ?? [];
  return (
    <Page
      refreshing={registrations.refreshing}
      onRefresh={() => registrations.reload(true)}
    >
      <PageTitle
        action={
          <View className="flex-row items-center gap-2">
            <IconButton
              icon="clock"
              label="Giờ tình nguyện"
              onPress={() => router.push("/hours")}
            />
            <Button extra="qrcode" onPress={() => router.push("/checkin")}>
              Điểm danh
            </Button>
          </View>
        }
      >
        Hoạt động
      </PageTitle>
      {registrations.loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <View className="items-start gap-4">
          <View className="w-full">
            <EmptyState
              title="Bạn chưa đăng ký hoạt động nào"
              description="Các hoạt động bạn đăng ký sẽ hiện ở đây."
            />
          </View>
          <Button
            icon="compass"
            onPress={() => router.navigate("/?tab=activities")}
          >
            Khám phá
          </Button>
        </View>
      ) : (
        <View className={`${panel} px-4`}>
          {list.map((registration, index) => (
            <RegistrationRow
              key={registration.id}
              registration={registration}
              first={index === 0}
            />
          ))}
        </View>
      )}
    </Page>
  );
}

export default function ActivitiesScreen() {
  return <RequireUser>{() => <MyActivities />}</RequireUser>;
}
