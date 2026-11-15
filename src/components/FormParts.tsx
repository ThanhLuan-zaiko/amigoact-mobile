import { Feather } from "@expo/vector-icons";
import { type ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FormState } from "@/lib/account";
import {
  fieldError,
  fieldLabel,
  inputField,
  inputFieldFocused,
  inputFieldInvalid,
  primaryButton,
  primaryButtonText,
} from "./ui";

// What a form needs from an input: to move focus to it.
export type Focusable = { focus: () => void };

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  autoComplete?: "email" | "current-password";
  keyboardType?: "default" | "email-address";
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
  inputRef?: (input: Focusable | null) => void;
};

function FieldError({ error }: { error?: string }) {
  const theme = useThemeColors();
  if (!error) return null;
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

function fieldClass(error: string | undefined, focused: boolean): string {
  if (error) return inputFieldInvalid;
  return focused ? inputFieldFocused : inputField;
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  autoComplete,
  keyboardType = "default",
  returnKeyType,
  onSubmitEditing,
  inputRef,
}: FieldProps) {
  const theme = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1">
      <Text className={fieldLabel}>{label}</Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        placeholderTextColor={theme.muted}
        accessibilityLabel={label}
        className={fieldClass(error, focused)}
      />
      <FieldError error={error} />
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
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          placeholderTextColor={theme.muted}
          accessibilityLabel={label}
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
      <FieldError error={error} />
    </View>
  );
}

export function SubmitButton({
  pending,
  icon,
  onPress,
  children,
}: {
  pending: boolean;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      accessibilityRole="button"
      accessibilityState={{ disabled: pending, busy: pending }}
      className={`${primaryButton} ${pending ? "opacity-50" : ""}`}
    >
      {pending ? (
        <ActivityIndicator size="small" color={theme.onAccent} />
      ) : (
        <Feather name={icon} size={16} color={theme.onAccent} />
      )}
      <Text className={primaryButtonText}>{children}</Text>
    </Pressable>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  const theme = useThemeColors();
  if (!state.error) return null;
  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-start gap-2 rounded-md border border-red-200 p-3 dark:border-red-900"
    >
      <View className="mt-0.5">
        <Feather name="alert-circle" size={16} color={theme.error} />
      </View>
      <Text className={`flex-1 text-sm ${fieldError}`}>{state.error}</Text>
    </View>
  );
}
