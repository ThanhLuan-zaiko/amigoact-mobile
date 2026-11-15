import { Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { hoursText } from "@/lib/attendance";
import { barLength } from "@/lib/chartGeometry";
import { usePalette, useWidth } from "./Charts";

export type BarRow = { key: string; label: string; hours: number };

// Hours by organization or activity as horizontal bars: name and value on
// top, the bar below, as on the web.
export function BarListChart({
  rows,
  description,
}: {
  rows: BarRow[];
  description: string;
}) {
  const { width, onLayout } = useWidth();
  const max = Math.max(...rows.map((row) => row.hours), 0);
  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityLabel={`${description}: ${rows.map((row) => `${row.label} ${hoursText(row.hours)}`).join(", ")}`}
      className="gap-3"
    >
      {rows.map((row) => (
        <View key={row.key} className="gap-1.5">
          <View className="flex-row items-center justify-between gap-3">
            <Text
              numberOfLines={1}
              className="shrink font-body text-[13px] text-slate-900 dark:text-slate-100"
            >
              {row.label}
            </Text>
            <Text className="font-body-semibold text-[13px] text-slate-900 dark:text-slate-100">
              {hoursText(row.hours)}
            </Text>
          </View>
          <MeterTrack
            fraction={width > 0 ? barLength(row.hours, max, width) / width : 0}
          />
        </View>
      ))}
    </View>
  );
}

// A thin bar between 0 and 1. The caller shows the number beside it.
export function MeterBar({ value }: { value: number }) {
  return <MeterTrack fraction={barLength(value, 1, 1000) / 1000} />;
}

function MeterTrack({ fraction }: { fraction: number }) {
  const palette = usePalette();
  const { width, onLayout } = useWidth();
  return (
    <View
      onLayout={onLayout}
      className="h-2 w-full overflow-hidden rounded-full"
    >
      {width > 0 ? (
        <Svg width={width} height={8}>
          <Rect
            x={0}
            y={0}
            width={width}
            height={8}
            rx={4}
            fill={palette.track}
          />
          <Rect
            x={0}
            y={0}
            width={Math.max(0, Math.min(1, fraction)) * width}
            height={8}
            rx={4}
            fill={palette.primary}
          />
        </Svg>
      ) : null}
    </View>
  );
}
