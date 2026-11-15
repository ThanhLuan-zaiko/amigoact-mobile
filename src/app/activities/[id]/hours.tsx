import { Text, View } from "react-native";
import ActivityScreen from "@/components/activities/ActivityScreen";
import { AdjustHours } from "@/components/attendance/HourForms";
import EmptyState, { Loading } from "@/components/common/States";
import PersonRow from "@/components/organizations/PersonRow";
import BackTitle from "@/components/shell/BackTitle";
import { mutedText, panel } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { hoursText } from "@/lib/attendance";
import { getActivityHours } from "@/lib/attendanceApi";

function Entries({ id }: { id: string }) {
  const entries = useLoad(() => getActivityHours(id), [id]);
  if (entries.loading) return <Loading />;
  if (!entries.data)
    return <Text className={mutedText}>Chỉ ban quản trị mới xem được.</Text>;
  if (entries.data.length === 0) {
    return (
      <EmptyState
        title="Chưa ghi giờ"
        description="Giờ được ghi khi hoạt động kết thúc, cho người đã điểm danh."
      />
    );
  }
  return (
    <View className={`${panel} px-4`}>
      {entries.data.map((entry, index) => (
        <PersonRow
          key={entry.user_id}
          name={entry.full_name}
          first={index === 0}
          details={null}
          trailing={
            <View className="flex-row flex-wrap items-center gap-3">
              <Text className="font-body-semibold text-sm text-slate-900 dark:text-slate-100">
                {hoursText(entry.hours)}
              </Text>
              <AdjustHours activityId={id} userId={entry.user_id} />
            </View>
          }
        />
      ))}
    </View>
  );
}

export default function ActivityHoursScreen() {
  return (
    <ActivityScreen>
      {(activity, id) => (
        <>
          <BackTitle href={`/activities/${id}`}>{activity.title}</BackTitle>
          <Entries id={id} />
        </>
      )}
    </ActivityScreen>
  );
}
