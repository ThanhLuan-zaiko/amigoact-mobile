import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { hoursText } from "@/lib/attendance";
import {
  type MyHourStats,
  type OrgHourStats,
  percentText,
  roundHours,
} from "@/lib/hoursStats";
import { MeterBar } from "../charts/BarCharts";
import Icon from "../common/Icon";
import { IconStat } from "../common/States";
import { mutedText, panel, strongText, tagChip, tagChipText } from "../ui";
import { Heading } from "./HoursParts";

// The short summary column of the personal and organization hours screens.
function Block({ children }: { children: ReactNode }) {
  return <View className="gap-2 p-4">{children}</View>;
}

function AttendanceRate({
  attendance,
}: {
  attendance: MyHourStats["attendance"];
}) {
  const finished = attendance.attended + attendance.absent;
  return (
    <Block>
      <Heading icon="check-circle">Tỉ lệ có mặt</Heading>
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="font-body-semibold text-2xl text-slate-900 dark:text-slate-100">
          {percentText(attendance.rate)}
        </Text>
        <Text className={mutedText}>
          {attendance.attended}/{finished} lượt
        </Text>
      </View>
      {attendance.rate === null ? (
        <Text className={mutedText}>Chưa có hoạt động nào kết thúc.</Text>
      ) : (
        <MeterBar value={attendance.rate} />
      )}
    </Block>
  );
}

function TermChips({ terms }: { terms: MyHourStats["by_term"] }) {
  if (terms.length === 0) return null;
  return (
    <Block>
      <Heading>Theo kỳ</Heading>
      <View className="flex-row flex-wrap gap-2">
        {terms.map(({ term, hours }) => (
          <View key={term} className={tagChip}>
            <Text className={tagChipText}>
              {term}: {hoursText(roundHours(hours))}
            </Text>
          </View>
        ))}
      </View>
    </Block>
  );
}

function Totals({ total, children }: { total: number; children: ReactNode }) {
  return (
    <Block>
      <View
        accessible
        accessibilityLabel={`Tổng giờ: ${hoursText(roundHours(total))}`}
        className="flex-row items-center gap-2"
      >
        <Icon name="clock" size={24} tone="subtle" />
        <Text className="font-body-semibold text-3xl text-slate-900 dark:text-slate-100">
          {hoursText(roundHours(total))}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-2">{children}</View>
    </Block>
  );
}

const Divided = ({ children }: { children: ReactNode }) => (
  <View className={`${panel} divide-y divide-slate-200 dark:divide-slate-800`}>
    {children}
  </View>
);

export function HoursSummary({ stats }: { stats: MyHourStats }) {
  const { totals } = stats;
  return (
    <Divided>
      <Totals total={totals.total}>
        <IconStat icon="plus-circle" label="Giờ được ghi">
          {hoursText(roundHours(totals.awarded))}
        </IconStat>
        <IconStat icon="edit-2" label="Giờ điều chỉnh">
          {hoursText(roundHours(totals.adjusted), { signed: true })}
        </IconStat>
        <IconStat icon="flag" label="Số hoạt động">
          {totals.activities}
        </IconStat>
        <IconStat icon="users" label="Số tổ chức">
          {totals.organizations}
        </IconStat>
      </Totals>
      <AttendanceRate attendance={stats.attendance} />
      <TermChips terms={stats.by_term} />
    </Divided>
  );
}

export function OrgHoursSummary({ stats }: { stats: OrgHourStats }) {
  const { totals } = stats;
  return (
    <Divided>
      <Totals total={totals.total}>
        <IconStat icon="plus-circle" label="Giờ được ghi">
          {hoursText(roundHours(totals.awarded))}
        </IconStat>
        <IconStat icon="edit-2" label="Giờ điều chỉnh, số lần">
          {`${hoursText(roundHours(totals.adjusted), { signed: true })} · ${totals.adjustments}`}
        </IconStat>
        <IconStat icon="flag" label="Số hoạt động">
          {totals.activities}
        </IconStat>
        <IconStat icon="users" label="Số tình nguyện viên">
          {totals.volunteers}
        </IconStat>
      </Totals>
      <AttendanceRate attendance={stats.attendance} />
      <Block>
        <Heading icon="award">Nhiều giờ nhất</Heading>
        {stats.top_volunteers.length === 0 ? (
          <Text className={mutedText}>Chưa có giờ trong khoảng này.</Text>
        ) : (
          stats.top_volunteers.map((person, index) => (
            <View
              key={person.user_id}
              className="flex-row items-center gap-3 py-2"
            >
              <Text className={`w-5 ${mutedText}`}>{index + 1}</Text>
              <Text
                numberOfLines={1}
                className="min-w-0 flex-1 font-body text-sm text-slate-900 dark:text-slate-100"
              >
                {person.full_name}
              </Text>
              <Text className={strongText}>
                {hoursText(roundHours(person.hours))}
              </Text>
            </View>
          ))
        )}
      </Block>
      <TermChips terms={stats.by_term} />
    </Divided>
  );
}
