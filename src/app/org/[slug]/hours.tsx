import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { LoadError, Loading } from "@/components/common/States";
import {
  BreakdownSection,
  StatsFilters,
  TrendSection,
} from "@/components/hours/HoursParts";
import { OrgHoursSummary } from "@/components/hours/HoursSummary";
import OrgScreen from "@/components/organizations/OrgScreen";
import RequireUser from "@/components/RequireUser";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { param } from "@/lib/appPath";
import { getOrgHourStats } from "@/lib/attendanceApi";
import { activityRows, readBucket, readRange } from "@/lib/hoursStats";
import type { OrganizationDetail } from "@/lib/organizations";
import { hasPermission } from "@/lib/roles";

function OrgHoursContent({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const params = useLocalSearchParams<{ range?: string; bucket?: string }>();
  const range = readRange(param(params.range) || undefined);
  const bucket = readBucket(param(params.bucket) || undefined);
  const allowed = hasPermission(organization.viewer, "attendance.hours");
  const stats = useLoad(
    async () =>
      allowed ? getOrgHourStats(organization.slug, range, bucket) : null,
    [organization.slug, range, bucket, allowed],
  );
  if (!allowed) {
    return (
      <Text className={mutedText}>
        Bạn không có quyền xem giờ của tổ chức này.
      </Text>
    );
  }
  if (stats.loading) return <Loading />;
  if (!stats.data) return <LoadError />;
  return (
    <>
      <StatsFilters range={range} bucket={bucket} />
      <OrgHoursSummary stats={stats.data} />
      <TrendSection series={stats.data.series} bucket={stats.data.bucket} />
      <BreakdownSection
        title="Theo hoạt động"
        icon="flag"
        rows={activityRows(stats.data)}
        description="Giờ tình nguyện theo hoạt động"
      />
    </>
  );
}

export default function OrgHoursScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <OrgHoursContent organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
