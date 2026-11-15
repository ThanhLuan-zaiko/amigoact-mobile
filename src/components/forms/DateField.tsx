import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useUniwind } from "uniwind";
import { IconButton } from "../common/Button";
import Icon from "../common/Icon";
import Sheet from "../common/Sheet";
import { inputField, inputFieldInvalid } from "../ui";
import { Label, Notes } from "./Fields";
import { fromWallClock, showWallClock, toWallClock } from "./wallClock";

// The native counterpart of the web <input type="date"> and
// <input type="datetime-local">. The value is the same text the web input
// holds ("2026-11-15" or "2026-11-15T08:30"), a Vietnam wall-clock time that
// the shared helpers (fromLocalInput) turn into an instant.
export default function DateField({
  label,
  value,
  onChange,
  mode = "datetime",
  error,
  hint,
  required = false,
  clearable = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mode?: "date" | "datetime";
  error?: string;
  hint?: string;
  required?: boolean;
  clearable?: boolean;
}) {
  const [iosOpen, setIosOpen] = useState(false);
  const { theme } = useUniwind();
  const current = toWallClock(value) ?? new Date();

  function set(date: Date) {
    onChange(fromWallClock(date, mode));
  }

  function open() {
    if (Platform.OS !== "android") {
      setIosOpen(true);
      return;
    }
    // Android shows a date dialog, then a time dialog for a date and time.
    DateTimePickerAndroid.open({
      value: current,
      mode: "date",
      onChange: (event: DateTimePickerEvent, date?: Date) => {
        if (event.type !== "set" || !date) return;
        if (mode === "date") {
          set(date);
          return;
        }
        DateTimePickerAndroid.open({
          value: date,
          mode: "time",
          is24Hour: true,
          onChange: (timeEvent: DateTimePickerEvent, time?: Date) => {
            if (timeEvent.type === "set" && time) set(time);
          },
        });
      },
    });
  }

  return (
    <View className="gap-1">
      <Label label={label} required={required} />
      <View className="flex-row gap-2">
        <Pressable
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{
            text: value ? showWallClock(value) : "Chưa chọn",
          }}
          className={`flex-1 flex-row items-center justify-between gap-2 ${error ? inputFieldInvalid : inputField}`}
        >
          <Text
            className={`font-body text-sm ${value ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}
          >
            {value
              ? showWallClock(value)
              : mode === "date"
                ? "dd/mm/yyyy"
                : "dd/mm/yyyy --:--"}
          </Text>
          <Icon name="calendar" tone="subtle" />
        </Pressable>
        {clearable && value ? (
          <IconButton
            icon="x"
            label={`Xóa ${label}`}
            onPress={() => onChange("")}
          />
        ) : null}
      </View>
      <Notes error={error} hint={hint} />
      {Platform.OS === "android" ? null : (
        <Sheet open={iosOpen} title={label} onClose={() => setIosOpen(false)}>
          <DateTimePicker
            value={current}
            mode={mode}
            display="inline"
            themeVariant={theme === "dark" ? "dark" : "light"}
            onChange={(_event, date) => {
              if (date) set(date);
            }}
          />
        </Sheet>
      )}
    </View>
  );
}
