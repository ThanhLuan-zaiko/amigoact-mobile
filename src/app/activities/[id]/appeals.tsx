import { Text, View } from "react-native";
import ActivityScreen from "@/components/activities/ActivityScreen";
import ActionButton from "@/components/common/ActionButton";
import ActionTextButton from "@/components/common/ActionTextButton";
import EmptyState, { IconStat, Loading } from "@/components/common/States";
import BackTitle from "@/components/shell/BackTitle";
import {
  mutedText,
  panel,
  sectionTitle,
  strongText,
  tagChip,
  tagChipText,
} from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { APPEAL_STATUS_LABELS } from "@/lib/attendance";
import { approveAppeal, getAppeals, rejectAppeal } from "@/lib/attendanceApi";
import { formatDate } from "@/lib/organizations";

function Appeals({ id }: { id: string }) {
  const appeals = useLoad(() => getAppeals(id), [id]);
  if (appeals.loading) return <Loading />;
  if (!appeals.data)
    return <Text className={mutedText}>Chỉ ban quản trị mới xem được.</Text>;
  const list = appeals.data;
  return (
    <>
      <View className={`${panel} gap-3 p-4`}>
        <Text accessibilityRole="header" className={sectionTitle}>
          Tổng quan
        </Text>
        <IconStat icon="list" label="Tổng số">
          {list.length}
        </IconStat>
        <IconStat icon="clock" label="Đang chờ">
          {list.filter((appeal) => appeal.status === "pending").length}
        </IconStat>
      </View>
      {list.length === 0 ? (
        <EmptyState
          title="Không có khiếu nại nào"
          description="Khiếu nại về điểm danh sẽ hiện ở đây."
        />
      ) : (
        <View className={`${panel} px-4`}>
          {list.map((appeal, index) => (
            <View
              key={appeal.id}
              className={`gap-2 py-3 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
            >
              <View className="flex-row flex-wrap items-center gap-3">
                <Text
                  numberOfLines={1}
                  className={`min-w-0 flex-1 ${strongText}`}
                >
                  {appeal.full_name}
                </Text>
                <IconStat icon="calendar" label="Ngày gửi">
                  {formatDate(appeal.created_at)}
                </IconStat>
                <View className={tagChip}>
                  <Text className={tagChipText}>
                    {APPEAL_STATUS_LABELS[appeal.status]}
                  </Text>
                </View>
              </View>
              <Text className="font-body text-sm text-slate-700 dark:text-slate-300">
                {appeal.reason}
              </Text>
              {appeal.status === "pending" ? (
                <View className="flex-row flex-wrap items-start gap-2">
                  {appeal.registrations.map((registration) => (
                    <ActionTextButton
                      key={registration.registration_id}
                      action={() =>
                        approveAppeal(appeal.id, registration.registration_id)
                      }
                      icon="check"
                      label="Chấp nhận"
                    >
                      {registration.shift_title ?? "Chấp nhận"}
                    </ActionTextButton>
                  ))}
                  <ActionButton
                    action={() => rejectAppeal(appeal.id)}
                    icon="x"
                    label="Từ chối"
                    confirmLabel="Từ chối khiếu nại?"
                  />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </>
  );
}

export default function AppealsScreen() {
  return (
    <ActivityScreen>
      {(_activity, id) => (
        <>
          <BackTitle href={`/activities/${id}`}>Khiếu nại</BackTitle>
          <Appeals id={id} />
        </>
      )}
    </ActivityScreen>
  );
}
