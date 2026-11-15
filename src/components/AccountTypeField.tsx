import { Pressable, Text, View } from "react-native";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/registerForm";
import { fieldLabel } from "./ui";

const base = "min-h-11 flex-row items-center gap-2 rounded-md border p-3";
const selected = `${base} border-teal-700 dark:border-teal-400`;
const idle = `${base} border-slate-200 dark:border-slate-700`;

// Two options as a radio group: one is always chosen, like the web radios.
export default function AccountTypeField({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (value: AccountType) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" className="gap-2">
      <Text className={fieldLabel}>Loại tài khoản</Text>
      <View className="gap-2">
        {ACCOUNT_TYPES.map((option) => {
          const checked = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              className={checked ? selected : idle}
            >
              <View
                className={`size-4 items-center justify-center rounded-full border ${
                  checked
                    ? "border-teal-700 dark:border-teal-400"
                    : "border-slate-400 dark:border-slate-500"
                }`}
              >
                {checked ? (
                  <View className="size-2 rounded-full bg-teal-700 dark:bg-teal-400" />
                ) : null}
              </View>
              <Text
                className={`font-body-semibold text-sm ${
                  checked
                    ? "text-teal-700 dark:text-teal-400"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
