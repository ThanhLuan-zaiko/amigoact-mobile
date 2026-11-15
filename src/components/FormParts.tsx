import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  fieldError,
  fieldLabel,
  inputField,
  inputFieldFocused,
  inputFieldInvalid,
  mutedText,
} from "./ui";

// What a form needs from an input: to move focus to it.
export type Focusable = { focus: () => void };

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  // Shown under the field while there is no error.
  hint?: string;
  // Adds the red asterisk. The legend is RequiredLegend.
  required?: boolean;
  maxLength?: number;
  autoComplete?:
    | "email"
    | "current-password"
    | "new-password"
    | "name"
    | "tel"
    | "organization";
  autoCapitalize?: "none" | "words";
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
  inputRef?: (input: Focusable | null) => void;
};

function FieldNotes({ error, hint }: { error?: string; hint?: string }) {
  const theme = useThemeColors();
  if (error) {
    return (
      <View className="flex-row items-start gap-1">
        <View className="mt-0.5">
          <Feather name="alert-circle" size={14} color={theme.error} />
        </View>
        <Text accessibilityRole="alert" className={`flex-1 ${fieldError}`}>
          {error}
        </Text>
      </View>
    );
  }
  return hint ? <Text className={`text-xs ${mutedText}`}>{hint}</Text> : null;
}

function FieldLabel({ label, required }: { label: string; required: boolean }) {
  return (
    <Text className={fieldLabel}>
      {label}
      {required ? (
        <Text className="text-red-700 dark:text-red-400"> *</Text>
      ) : null}
    </Text>
  );
}

function fieldClass(error: string | undefined, focused: boolean): string {
  if (error) return inputFieldInvalid;
  return focused ? inputFieldFocused : inputField;
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  required = false,
  maxLength,
  autoComplete,
  autoCapitalize = "none",
  keyboardType = "default",
  returnKeyType,
  onSubmitEditing,
  inputRef,
}: FieldProps) {
  const theme = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1">
      <FieldLabel label={label} required={required} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        placeholderTextColor={theme.muted}
        accessibilityLabel={label}
        aria-invalid={error ? true : undefined}
        className={fieldClass(error, focused)}
      />
      <FieldNotes error={error} hint={hint} />
    </View>
  );
}

type PasswordFieldProps = FieldProps & {
  visible: boolean;
  onToggle: () => void;
};

export function PasswordField({
  label,
  value,
  onChangeText,
  error,
  hint,
  maxLength,
  autoComplete,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  visible,
  onToggle,
}: PasswordFieldProps) {
  const theme = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1">
      <Text className={fieldLabel}>{label}</Text>
      <View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          placeholderTextColor={theme.muted}
          accessibilityLabel={label}
          aria-invalid={error ? true : undefined}
          className={`${fieldClass(error, focused)} pr-12`}
        />
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          accessibilityState={{ selected: visible }}
          className="absolute inset-y-0 right-0 w-11 items-center justify-center"
        >
          <Feather
            name={visible ? "eye-off" : "eye"}
            size={18}
            color={theme.muted}
          />
        </Pressable>
      </View>
      <FieldNotes error={error} hint={hint} />
    </View>
  );
}

export { FormMessage, RequiredLegend, SubmitButton } from "./FormChrome";
