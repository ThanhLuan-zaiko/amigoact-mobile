import { useLocalSearchParams } from "expo-router";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import {
  BreakdownSection,
  HourEntries,
  StatsFilters,
  TrendSection,
} from "@/components/hours/HoursParts";
import { HoursSummary } from "@/components/hours/HoursSummary";
import RequireUser from "@/components/RequireUser";
import Page, { PageTitle } from "@/components/shell/Page";
import { useLoad } from "@/hooks/useLoad";
import { param } from "@/lib/appPath";
import { getMyHourStats, getMyHours } from "@/lib/attendanceApi";
import { organizationRows, readBucket, readRange } from "@/lib/hoursStats";

function HoursContent() {
  const params = useLocalSearchParams<{ range?: string; bucket?: string }>();
  const range = readRange(param(params.range) || undefined);
  const bucket = readBucket(param(params.bucket) || undefined);
  const data = useLoad(async () => {
    const [stats, hours] = await Promise.all([
      getMyHourStats(range, bucket),
      getMyHours(),
    ]);
    return { stats, hours };
  }, [range, bucket]);

  let body: React.ReactNode;
  if (data.loading) body = <Loading />;
  else if (!data.data?.stats || !data.data.hours) body = <LoadError />;
  else if (data.data.hours.entries.length === 0) {
    body = (
      <EmptyState
        title="Chưa có giờ nào"
        description="Giờ được ghi khi hoạt động kết thúc và bạn đã điểm danh."
      />
    );
  } else {
    const { stats, hours } = data.data;
    // Phones read the summary first, as on the web.
    body = (
      <>
        <StatsFilters range={range} bucket={bucket} />
        <HoursSummary stats={stats} />
        <TrendSection series={stats.series} bucket={stats.bucket} />
        <BreakdownSection
          title="Theo tổ chức"
          icon="users"
          rows={organizationRows(stats)}
          description="Giờ tình nguyện theo tổ chức"
        />
        <HourEntries entries={hours.entries} />
      </>
    );
  }
  return (
    <Page refreshing={data.refreshing} onRefresh={() => data.reload(true)}>
      <PageTitle>Giờ tình nguyện</PageTitle>
      {body}
    </Page>
  );
}

export default function HoursScreen() {
  return <RequireUser>{() => <HoursContent />}</RequireUser>;
}
