import { Text } from "react-native";
import ActivityForm from "@/components/activities/ActivityForm";
import OrgScreen from "@/components/organizations/OrgScreen";
import RequireUser from "@/components/RequireUser";
import { mutedText } from "@/components/ui";
import { createActivity } from "@/lib/activityActions";
import { hasPermission } from "@/lib/roles";

export default function NewActivityScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization, slug) =>
            hasPermission(organization.viewer, "activities.create") ? (
              <ActivityForm
                submit={(values, publish) =>
                  createActivity(slug, values, publish)
                }
                orgSlug={slug}
              />
            ) : (
              <Text className={mutedText}>
                Chỉ ban quản trị mới tạo được hoạt động.
              </Text>
            )
          }
        </OrgScreen>
      )}
    </RequireUser>
  );
}
