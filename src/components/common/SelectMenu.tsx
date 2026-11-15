import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { fieldLabel, inputField } from "../ui";
import Icon from "./Icon";
import Sheet from "./Sheet";

export type SelectOption = { value: string; label: string; disabled?: boolean };

// Turns a { value: label } map, such as ORG_TYPE_LABELS, into menu options.
export function optionsFrom(labels: Record<string, string>): SelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

// The native counterpart of the web SelectMenu: a field that opens a sheet of
// options. Controlled, since there is no form to read it from.
export default function SelectMenu({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View className="min-w-0 gap-1">
      {hideLabel ? null : <Text className={fieldLabel}>{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? "" }}
        className={`${inputField} flex-row items-center justify-between gap-2`}
      >
        <Text
          numberOfLines={1}
          className="flex-1 font-body text-sm text-slate-900 dark:text-slate-100"
        >
          {selected?.label ?? ""}
        </Text>
        <Icon name="chevron-down" tone="subtle" />
      </Pressable>
      <Sheet open={open} title={label} onClose={() => setOpen(false)}>
        <View className="gap-1">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                disabled={option.disabled}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{
                  selected: isSelected,
                  disabled: option.disabled,
                }}
                className={`min-h-11 flex-row items-center justify-between gap-2 rounded-sm px-3 py-2 ${isSelected ? "bg-teal-50 dark:bg-teal-950/40" : "active:bg-slate-100 dark:active:bg-slate-800"}`}
              >
                <Text
                  className={`flex-1 font-body text-sm ${option.disabled ? "text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}`}
                >
                  {option.label}
                </Text>
                {isSelected ? <Icon name="check" tone="accent" /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}
