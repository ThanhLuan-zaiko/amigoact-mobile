import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ActivityCard } from "@/components/activities/ActivityParts";
import Button from "@/components/common/Button";
import PageLinks from "@/components/common/PageLinks";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import RequireUser from "@/components/RequireUser";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { listOrganizationActivities } from "@/lib/activityApi";
import { orgActivitiesPath } from "@/lib/activityList";
import { param } from "@/lib/appPath";
import { type OrganizationDetail, pageOffset } from "@/lib/organizations";
import { hasModule } from "@/lib/roles";

function DraftsContent({ organization }: { organization: OrganizationDetail }) {
  const slug = organization.slug;
  const base = orgActivitiesPath(slug);
  const allowed = hasModule(organization.viewer, "activities");
  const offset = pageOffset(
    param(useLocalSearchParams<{ page?: string }>().page) || undefined,
  );
  const page = useLoad(
    async () =>
      allowed ? listOrganizationActivities(slug, offset, "draft") : null,
    [slug, offset, allowed],
  );
  if (!allowed) {
    return (
      <Text className={mutedText}>
        Chỉ ban quản trị mới xem được hoạt động nháp.
      </Text>
    );
  }
  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center gap-3">
        <View className="flex-1 gap-1">
          <Text
            accessibilityRole="header"
            className="font-body-semibold text-xl text-slate-900 dark:text-slate-100"
          >
            Hoạt động nháp
          </Text>
          <Text className={mutedText}>
            Chỉ ban quản trị nhìn thấy. Đăng hoạt động để mọi người đăng ký.
          </Text>
        </View>
        <Button icon="plus" onPress={() => router.push(`${base}/new` as never)}>
          Tạo hoạt động
        </Button>
      </View>
      {page.loading ? (
        <Loading />
      ) : page.data === null ? (
        <LoadError>Không tải được bản nháp. Vui lòng thử lại.</LoadError>
      ) : (page.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="Chưa có hoạt động nháp"
          description="Hoạt động mới tạo nằm ở đây cho tới khi được đăng."
        />
      ) : (
        <View className="gap-3">
          {page.data?.items.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      )}
      <PageLinks
        offset={offset}
        total={page.data?.total ?? 0}
        onPage={(next) =>
          router.setParams({ page: next > 1 ? String(next) : undefined })
        }
      />
    </View>
  );
}

export default function ActivityDraftsScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <DraftsContent organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
