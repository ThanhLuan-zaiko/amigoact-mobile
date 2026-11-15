import { Text } from "react-native";
import ActivityForm from "@/components/activities/ActivityForm";
import ActivityScreen from "@/components/activities/ActivityScreen";
import ShiftEditor from "@/components/activities/ShiftEditor";
import BackTitle from "@/components/shell/BackTitle";
import { mutedText } from "@/components/ui";
import { updateActivity } from "@/lib/activityActions";

export default function EditActivityScreen() {
  return (
    <ActivityScreen>
      {(activity, id) =>
        activity.viewer.can_manage ? (
          <>
            <BackTitle href={`/activities/${id}`}>{activity.title}</BackTitle>
            <ActivityForm
              submit={(values) => updateActivity(id, values)}
              orgSlug={activity.organization_slug}
              activity={activity}
            />
            <ShiftEditor activityId={id} shifts={activity.shifts} />
          </>
        ) : (
          <Text className={mutedText}>Chỉ ban quản trị mới sửa được.</Text>
        )
      }
    </ActivityScreen>
  );
}
