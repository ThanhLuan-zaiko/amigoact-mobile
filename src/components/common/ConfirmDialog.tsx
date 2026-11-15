import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { errorText, mutedText, sectionTitle } from "../ui";
import Button from "./Button";
import type { IconName } from "./Icon";

// The native counterpart of the web ConfirmDialog. The confirm button is red,
// so use it only for actions that cannot be undone.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  confirmIcon,
  pending = false,
  confirmDisabled = false,
  error,
  tone = "danger",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  confirmIcon?: IconName;
  pending?: boolean;
  confirmDisabled?: boolean;
  error?: string;
  // "primary" or "neutral" for a confirmation that can be undone.
  tone?: "danger" | "primary" | "neutral";
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center p-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          onPress={onClose}
          className="absolute inset-0 bg-slate-900/50"
        />
        <View
          accessibilityViewIsModal
          className="w-full max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
        >
          <Text accessibilityRole="header" className={sectionTitle}>
            {title}
          </Text>
          {typeof children === "string" ? (
            <Text className={mutedText}>{children}</Text>
          ) : (
            <View className="gap-2">{children}</View>
          )}
          {error ? (
            <Text accessibilityRole="alert" className={errorText}>
              {error}
            </Text>
          ) : null}
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="secondary" onPress={onClose}>
              Hủy
            </Button>
            <Button
              variant={tone}
              icon={confirmIcon}
              onPress={onConfirm}
              pending={pending}
              disabled={confirmDisabled}
            >
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
