import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import ActionButton from "@/components/common/ActionButton";
import PageLinks from "@/components/common/PageLinks";
import EmptyState, { IconStat, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import PersonRow from "@/components/organizations/PersonRow";
import RequireUser from "@/components/RequireUser";
import { useLiveRefresh } from "@/components/realtime/hooks";
import { mutedText, panel, sectionTitle } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { param } from "@/lib/appPath";
import {
  approveApplication,
  rejectApplication,
} from "@/lib/organizationActions";
import { getApplications } from "@/lib/organizationApi";
import {
  formatDate,
  type OrganizationDetail,
  pageOffset,
} from "@/lib/organizations";
import { managersTopic } from "@/lib/realtime";

// An application arrived, was withdrawn, or was decided by another manager.
const REVIEW_EVENTS = ["applications.changed"] as const;

function ApplicationList({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const slug = organization.slug;
  const offset = pageOffset(
    param(useLocalSearchParams<{ page?: string }>().page) || undefined,
  );
  const page = useLoad(() => getApplications(slug, offset), [slug, offset]);
  useLiveRefresh(managersTopic(organization.id), REVIEW_EVENTS, () =>
    page.reload(),
  );
  if (page.loading) return <Loading />;
  if (!page.data) {
    return (
      <Text className={mutedText}>
        Chỉ ban quản trị mới xem được các yêu cầu này.
      </Text>
    );
  }
  if (page.data.items.length === 0 && offset === 0) {
    return (
      <EmptyState
        title="Không có yêu cầu nào"
        description="Yêu cầu tham gia mới sẽ hiện ở đây."
      />
    );
  }
  return (
    <View className={`${panel} gap-3 p-4`}>
      <Text accessibilityRole="header" className={sectionTitle}>
        Yêu cầu tham gia
      </Text>
      <View>
        {page.data.items.map((application, index) => (
          <PersonRow
            key={application.user_id}
            name={application.full_name}
            first={index === 0}
            details={
              <>
                <IconStat icon="calendar" label="Ngày gửi">
                  {formatDate(application.submitted_at)}
                </IconStat>
                {application.message ? (
                  <Text className="mt-1 font-body text-sm text-slate-700 dark:text-slate-300">
                    {application.message}
                  </Text>
                ) : null}
              </>
            }
            trailing={
              <View className="flex-row flex-wrap items-start gap-2">
                <ActionButton
                  action={() => approveApplication(slug, application.user_id)}
                  icon="check"
                  label="Duyệt"
                />
                <ActionButton
                  action={() => rejectApplication(slug, application.user_id)}
                  icon="x"
                  label="Từ chối"
                  confirmLabel="Từ chối?"
                />
              </View>
            }
          />
        ))}
      </View>
      <PageLinks
        offset={offset}
        total={page.data.total}
        onPage={(next) =>
          router.setParams({ page: next > 1 ? String(next) : undefined })
        }
      />
    </View>
  );
}

export default function ApplicationsScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <ApplicationList organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
