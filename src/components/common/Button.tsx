import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  chipButton,
  chipPressed,
  chipPressedText,
  chipText,
  dangerButton,
  dangerButtonText,
  iconButton,
  iconButtonActive,
  neutralButton,
  neutralButtonText,
  primaryButton,
  primaryButtonText,
  secondaryButton,
  secondaryButtonText,
} from "../ui";
import Icon, {
  ExtraIcon,
  type ExtraIconName,
  type IconName,
  type IconTone,
} from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "neutral" | "danger";

const BOX: Record<ButtonVariant, string> = {
  primary: primaryButton,
  secondary: secondaryButton,
  neutral: neutralButton,
  danger: dangerButton,
};

const TEXT: Record<ButtonVariant, string> = {
  primary: primaryButtonText,
  secondary: secondaryButtonText,
  neutral: neutralButtonText,
  danger: dangerButtonText,
};

const ICON_TONE: Record<ButtonVariant, IconTone> = {
  primary: "onAccent",
  secondary: "accent",
  neutral: "text",
  danger: "onDanger",
};

// A button with a word, as on the web: primary (teal), secondary (teal
// outline), neutral (slate outline), or danger (red, cannot be undone).
export default function Button({
  variant = "primary",
  icon,
  onPress,
  pending = false,
  disabled = false,
  label,
  className = "",
  extra,
  children,
}: {
  variant?: ButtonVariant;
  icon?: IconName;
  // One of the three non-Feather icons, drawn instead of `icon`.
  extra?: ExtraIconName;
  onPress: () => void;
  pending?: boolean;
  disabled?: boolean;
  // For screen readers when the visible text differs.
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  const theme = useThemeColors();
  const off = pending || disabled;
  const tone = ICON_TONE[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy: pending }}
      className={`${BOX[variant]} ${off ? "opacity-50" : ""} ${className}`}
    >
      {pending ? (
        <ActivityIndicator size="small" color={theme[tone]} />
      ) : extra ? (
        <ExtraIcon name={extra} tone={tone} />
      ) : icon ? (
        <Icon name={icon} tone={tone} />
      ) : null}
      {children ? <Text className={TEXT[variant]}>{children}</Text> : null}
    </Pressable>
  );
}

// An icon-only button. The label is read by screen readers.
export function IconButton({
  icon,
  label,
  onPress,
  active = false,
  disabled = false,
  tone,
  size = 18,
  className = "",
  extra,
  children,
}: {
  icon: IconName;
  // One of the three non-Feather icons, drawn instead of `icon`.
  extra?: ExtraIconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: IconTone;
  size?: number;
  className?: string;
  // A badge drawn over the button, such as an unread count.
  children?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      hitSlop={4}
      className={`${active ? iconButtonActive : iconButton} ${disabled ? "opacity-40" : ""} ${className}`}
    >
      {extra ? (
        <ExtraIcon
          name={extra}
          size={size}
          tone={tone ?? (active ? "accent" : "text")}
        />
      ) : (
        <Icon
          name={icon}
          size={size}
          tone={tone ?? (active ? "accent" : "text")}
        />
      )}
      {children}
    </Pressable>
  );
}

// A small toggle or filter chip.
export function Chip({
  icon,
  pressed = false,
  onPress,
  label,
  children,
}: {
  icon?: IconName;
  pressed?: boolean;
  onPress: () => void;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: pressed }}
      className={pressed ? chipPressed : chipButton}
    >
      {icon ? (
        <Icon name={icon} size={14} tone={pressed ? "accent" : "text"} />
      ) : null}
      {children ? (
        <Text className={pressed ? chipPressedText : chipText}>{children}</Text>
      ) : null}
    </Pressable>
  );
}
