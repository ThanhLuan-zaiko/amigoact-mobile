import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import Icon from "../common/Icon";
import {
  fieldError,
  fieldLabel,
  inputField,
  inputFieldFocused,
  inputFieldInvalid,
  mutedText,
  smallMuted,
} from "../ui";

export { TextField } from "../FormParts";

function fieldClass(error: string | undefined, focused: boolean): string {
  if (error) return inputFieldInvalid;
  return focused ? inputFieldFocused : inputField;
}

export function Label({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text className={fieldLabel}>
      {label}
      {required ? (
        <Text className="text-red-700 dark:text-red-400"> *</Text>
      ) : null}
    </Text>
  );
}

export function Notes({ error, hint }: { error?: string; hint?: string }) {
  if (error) {
    return (
      <View className="flex-row items-start gap-1">
        <View className="mt-0.5">
          <Icon name="alert-circle" size={12} tone="error" />
        </View>
        <Text accessibilityRole="alert" className={`flex-1 ${fieldError}`}>
          {error}
        </Text>
      </View>
    );
  }
  return hint ? <Text className={smallMuted}>{hint}</Text> : null;
}

// Number inputs refuse letters as they are typed, as on the web. The form and
// the backend check again.
export type NumericKind = "integer" | "decimal" | "signed-decimal";

const NUMERIC_INPUT: Record<NumericKind, RegExp> = {
  integer: /^[0-9]*$/,
  decimal: /^[0-9.]*$/,
  "signed-decimal": /^[0-9.-]*$/,
};

// A single-line field with every option the web TextField takes.
export function InputField({
  label,
  value,
  onChangeText,
  error,
  hint,
  required = false,
  maxLength,
  numeric,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  secure = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  numeric?: NumericKind;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "url";
  autoCapitalize?: "none" | "sentences" | "words";
  secure?: boolean;
}) {
  const theme = useThemeColors();
  const [focused, setFocused] = useState(false);
  const allowed = numeric ? NUMERIC_INPUT[numeric] : null;
  return (
    <View className="gap-1">
      <Label label={label} required={required} />
      <TextInput
        value={value}
        onChangeText={(next) => {
          if (!allowed || allowed.test(next)) onChangeText(next);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={theme.subtle}
        keyboardType={
          numeric === "integer"
            ? "number-pad"
            : numeric
              ? "decimal-pad"
              : (keyboardType ?? "default")
        }
        autoCapitalize={autoCapitalize}
        secureTextEntry={secure}
        accessibilityLabel={label}
        aria-invalid={error ? true : undefined}
        className={fieldClass(error, focused)}
      />
      <Notes error={error} hint={hint} />
    </View>
  );
}

export function TextAreaField({
  label,
  value,
  onChangeText,
  error,
  hint,
  required = false,
  maxLength,
  rows = 4,
  placeholder,
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  hideLabel?: boolean;
}) {
  const theme = useThemeColors();
  const [focused, setFocused] = useState(false);
  // Each row is about 24 points of text, plus the padding.
  const height =
    rows <= 2
      ? "min-h-16"
      : rows <= 3
        ? "min-h-20"
        : rows <= 5
          ? "min-h-28"
          : "min-h-48";
  return (
    <View className="gap-1">
      {hideLabel ? null : <Label label={label} required={required} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline
        textAlignVertical="top"
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={theme.subtle}
        accessibilityLabel={label}
        aria-invalid={error ? true : undefined}
        className={`${fieldClass(error, focused)} ${height} leading-relaxed`}
      />
      <Notes error={error} hint={hint} />
    </View>
  );
}

// A labeled checkbox, the web <input type="checkbox"> row.
export function CheckRow({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      className={`min-h-11 flex-row items-start gap-3 py-1 ${disabled ? "opacity-50" : ""}`}
    >
      <View
        className={`mt-0.5 h-5 w-5 items-center justify-center rounded-sm border ${
          checked
            ? "border-teal-700 bg-teal-700 dark:border-teal-400 dark:bg-teal-400"
            : "border-slate-400 dark:border-slate-600"
        }`}
      >
        {checked ? <Icon name="check" size={14} tone="onAccent" /> : null}
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-body text-sm text-slate-900 dark:text-slate-100">
          {label}
        </Text>
        {hint ? <Text className={mutedText}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}
