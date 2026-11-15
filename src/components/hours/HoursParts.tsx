import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { type HourEntry, hoursText } from "@/lib/attendance";
import {
  type BreakdownRow,
  BUCKETS,
  type Bucket,
  type PeriodHours,
  periodLabel,
  periodTitle,
  RANGES,
  type RangeKey,
  roundHours,
} from "@/lib/hoursStats";
import { formatDate } from "@/lib/organizations";
import { BarListChart } from "../charts/BarCharts";
import { ColumnChart } from "../charts/Charts";
import Icon, { type IconName } from "../common/Icon";
import Segments from "../common/Segments";
import { IconStat } from "../common/States";
import { mutedText, panel, sectionTitle, strongText } from "../ui";

export function Heading({
  icon,
  children,
}: {
  icon?: IconName;
  children: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      {icon ? <Icon name={icon} /> : null}
      <Text accessibilityRole="header" className={sectionTitle}>
        {children}
      </Text>
    </View>
  );
}

// The range and grouping, kept in the route params as the web keeps them.
export function StatsFilters({
  range,
  bucket,
}: {
  range: RangeKey;
  bucket: Bucket;
}) {
  return (
    <View className="gap-2">
      <Segments
        items={RANGES.map((item) => ({ value: item.key, label: item.label }))}
        current={range}
        onChange={(value) => router.setParams({ range: value })}
        label="Khoảng thời gian"
      />
      <Segments
        items={BUCKETS.map((item) => ({ value: item.key, label: item.label }))}
        current={bucket}
        onChange={(value) => router.setParams({ bucket: value })}
        label="Gộp theo"
      />
    </View>
  );
}

export function TrendSection({
  series,
  bucket,
}: {
  series: PeriodHours[];
  bucket: Bucket;
}) {
  const points = series.map((point) => ({
    key: point.period,
    label: periodLabel(point.period, bucket),
    title: periodTitle(point.period, bucket),
    awarded: roundHours(point.awarded),
    adjusted: roundHours(point.adjusted),
  }));
  const unit = bucket === "month" ? "tháng" : "tuần";
  return (
    <View className={`${panel} gap-4 p-4`}>
      <Heading icon="bar-chart-2">{`Giờ theo ${unit}`}</Heading>
      <ColumnChart
        points={points}
        names={{ awarded: "Được ghi", adjusted: "Điều chỉnh" }}
        description={`Giờ tình nguyện theo ${unit}`}
      />
    </View>
  );
}

export function BreakdownSection({
  title,
  icon,
  rows,
  description,
}: {
  title: string;
  icon: IconName;
  rows: BreakdownRow[];
  description: string;
}) {
  const rounded = rows.map((row) => ({ ...row, hours: roundHours(row.hours) }));
  return (
    <View className={`${panel} gap-4 p-4`}>
      <Heading icon={icon}>{title}</Heading>
      {rounded.length === 0 ? (
        <Text className={mutedText}>Chưa có giờ trong khoảng này.</Text>
      ) : (
        <BarListChart rows={rounded} description={description} />
      )}
    </View>
  );
}

// The latest rows of the ledger, newest first.
export function HourEntries({ entries }: { entries: HourEntry[] }) {
  return (
    <View className={`${panel} gap-1 px-4 pt-4`}>
      <Heading icon="list">Ghi nhận gần đây</Heading>
      {entries.map((entry, index) => (
        <View
          key={entry.id}
          className={`flex-row items-center gap-3 py-3 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
        >
          <View className="min-w-0 flex-1 gap-1">
            {entry.activity_id ? (
              <Pressable
                onPress={() =>
                  router.push(`/activities/${entry.activity_id}` as never)
                }
                accessibilityRole="link"
              >
                <Text className={strongText}>{entry.activity_title}</Text>
              </Pressable>
            ) : (
              <Text className={strongText}>{entry.organization_name}</Text>
            )}
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              <IconStat icon="calendar" label="Ngày ghi">
                {formatDate(entry.recorded_at)}
              </IconStat>
              {entry.source === "adjustment" ? (
                <IconStat icon="edit-2" label="Điều chỉnh">
                  {entry.note}
                </IconStat>
              ) : null}
            </View>
          </View>
          <Text className="font-body-semibold text-sm text-slate-900 dark:text-slate-100">
            {hoursText(entry.hours, { signed: true })}
          </Text>
        </View>
      ))}
    </View>
  );
}
