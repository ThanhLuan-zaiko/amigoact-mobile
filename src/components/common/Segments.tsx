import { Pressable, ScrollView, Text, View } from "react-native";
import {
  segmentActive,
  segmentActiveText,
  segmentIdle,
  segmentIdleText,
  segmentItem,
  segmentList,
} from "../ui";
import Icon, { type IconName } from "./Icon";

export type Segment<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
};

// The web segmented control for tabs and sub-navigation. As on the web phone
// layout, only the current item keeps its word when `compact` is set.
export default function Segments<T extends string>({
  items,
  current,
  onChange,
  label,
  compact = false,
  fill = false,
}: {
  items: Segment<T>[];
  current: T;
  onChange: (value: T) => void;
  label: string;
  compact?: boolean;
  // Items share the width equally, as the home feed tabs do.
  fill?: boolean;
}) {
  const row = items.map(({ value, label: text, icon }) => {
    const active = value === current;
    return (
      <Pressable
        key={value}
        onPress={() => onChange(value)}
        accessibilityRole="tab"
        accessibilityLabel={text}
        accessibilityState={{ selected: active }}
        className={`${segmentItem} ${active ? segmentActive : segmentIdle} ${fill ? "flex-1" : ""}`}
      >
        {icon ? (
          <Icon name={icon} size={14} tone={active ? "accent" : "muted"} />
        ) : null}
        {compact && !active && icon ? null : (
          <Text
            numberOfLines={1}
            className={active ? segmentActiveText : segmentIdleText}
          >
            {text}
          </Text>
        )}
      </Pressable>
    );
  });
  if (fill) {
    return (
      <View
        accessibilityRole="tablist"
        accessibilityLabel={label}
        className={segmentList}
      >
        {row}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      accessibilityLabel={label}
      className="grow-0"
      contentContainerClassName={segmentList}
    >
      {row}
    </ScrollView>
  );
}
