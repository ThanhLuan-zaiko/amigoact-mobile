import { useState } from "react";
import { type LayoutChangeEvent, Text, View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { useUniwind } from "uniwind";
import { hoursText } from "@/lib/attendance";
import {
  columnLayout,
  indexAt,
  labelStride,
  niceScale,
  plotBox,
  stackExtent,
  yOf,
} from "@/lib/chartGeometry";

// The web charts draw on a canvas with the shared geometry in chartGeometry.ts.
// Here the same geometry draws with react-native-svg. The colors are the web
// chart swatches (CHART_SWATCHES) as hex values.
const PALETTE = {
  light: {
    primary: "#0f766e",
    secondary: "#94a3b8",
    grid: "#e2e8f0",
    zero: "#94a3b8",
    ink: "#0f172a",
    muted: "#64748b",
    track: "#f1f5f9",
    highlight: "#f1f5f9",
  },
  dark: {
    primary: "#2dd4bf",
    secondary: "#64748b",
    grid: "#1e293b",
    zero: "#475569",
    ink: "#f1f5f9",
    muted: "#94a3b8",
    track: "#0f172a",
    highlight: "#0f172a",
  },
};

export function usePalette() {
  return useUniwind().theme === "dark" ? PALETTE.dark : PALETTE.light;
}

export function useWidth() {
  const [width, setWidth] = useState(0);
  return {
    width,
    onLayout: (event: LayoutChangeEvent) =>
      setWidth(event.nativeEvent.layout.width),
  };
}

export type ColumnPoint = {
  key: string;
  label: string;
  title: string;
  awarded: number;
  adjusted: number;
};

const PADDING = { top: 8, right: 4, bottom: 24, left: 40 };
const HEIGHT = 224;
const LABEL_WIDTH = 44;
const FONT = "BeVietnamPro_400Regular";

// Hours by week or month as stacked columns. Tapping a column shows its numbers.
export function ColumnChart({
  points,
  names,
  description,
}: {
  points: ColumnPoint[];
  names: { awarded: string; adjusted: string };
  description: string;
}) {
  const palette = usePalette();
  const { width, onLayout } = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const plot = plotBox(width, HEIGHT, PADDING);
  const [low, high] = stackExtent(points);
  const scale = niceScale(low, high);
  const columns = columnLayout(points, scale, plot);
  const stride = labelStride(points.length, plot.width, LABEL_WIDTH);
  const shown = points[active ?? points.length - 1];
  const slot = points.length > 0 ? plot.width / points.length : 0;

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
        <View className="flex-row items-center gap-2">
          <View className="h-2.5 w-2.5 rounded-full bg-teal-700 dark:bg-teal-400" />
          <Text className="font-body text-sm text-slate-600 dark:text-slate-300">
            {names.awarded}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
          <Text className="font-body text-sm text-slate-600 dark:text-slate-300">
            {names.adjusted}
          </Text>
        </View>
      </View>
      <View
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${description}: ${points.map((p) => `${p.title} ${hoursText(p.awarded)}`).join(", ")}`}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) =>
          setActive(indexAt(event.nativeEvent.locationX, points.length, plot))
        }
        onResponderMove={(event) =>
          setActive(indexAt(event.nativeEvent.locationX, points.length, plot))
        }
        className="h-56 w-full"
      >
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {active !== null ? (
              <Rect
                x={plot.x + active * slot}
                y={plot.y}
                width={slot}
                height={plot.height}
                fill={palette.highlight}
              />
            ) : null}
            {scale.ticks.map((tick) => {
              const y = yOf(tick, scale, plot);
              return (
                <G key={`tick-${tick}`}>
                  <Line
                    x1={plot.x}
                    x2={plot.x + plot.width}
                    y1={y}
                    y2={y}
                    stroke={tick === 0 ? palette.zero : palette.grid}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={plot.x - 8}
                    y={y + 4}
                    fontSize={11}
                    fontFamily={FONT}
                    fill={palette.muted}
                    textAnchor="end"
                  >
                    {hoursText(tick)}
                  </SvgText>
                </G>
              );
            })}
            {columns.map((column, index) => (
              <G key={points[index].key}>
                <Rect {...column.awarded} rx={2} fill={palette.primary} />
                <Rect {...column.adjusted} rx={2} fill={palette.secondary} />
                {index % stride === 0 ? (
                  <SvgText
                    x={column.center}
                    y={plot.y + plot.height + 16}
                    fontSize={11}
                    fontFamily={FONT}
                    fill={index === active ? palette.ink : palette.muted}
                    textAnchor="middle"
                  >
                    {points[index].label}
                  </SvgText>
                ) : null}
              </G>
            ))}
          </Svg>
        ) : null}
      </View>
      {shown ? (
        <Text className="font-body text-sm text-slate-600 dark:text-slate-300">
          <Text className="font-body-semibold text-slate-900 dark:text-slate-100">
            {shown.title}
          </Text>
          {` · ${names.awarded} ${hoursText(shown.awarded)} · ${names.adjusted} ${hoursText(shown.adjusted, { signed: true })}`}
        </Text>
      ) : null}
    </View>
  );
}
