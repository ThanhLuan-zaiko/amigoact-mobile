import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { sectionTitle } from "../ui";
import { IconButton } from "./Button";

const Safe = withUniwind(SafeAreaView);

// A floating layer from the bottom of the screen, separated by a border, not a
// shadow. The native counterpart of the web dropdown panels and dialogs.
export default function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
  scroll = true,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  // Off for content that scrolls on its own, such as a FlatList.
  scroll?: boolean;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          onPress={onClose}
          className="absolute inset-0 bg-slate-900/50"
        />
        <Safe
          edges={["bottom"]}
          className="max-h-[85%] rounded-t-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
        >
          {title ? (
            <View className="flex-row items-center justify-between gap-2 border-b border-slate-200 py-1 pl-4 pr-2 dark:border-slate-800">
              <Text
                accessibilityRole="header"
                className={`flex-1 ${sectionTitle}`}
              >
                {title}
              </Text>
              <IconButton
                icon="x"
                label="Đóng"
                onPress={onClose}
                className="border-transparent"
              />
            </View>
          ) : null}
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-4 p-4"
            >
              {children}
            </ScrollView>
          ) : (
            <View className="shrink">{children}</View>
          )}
          {footer ? (
            <View className="border-t border-slate-200 p-4 dark:border-slate-800">
              {footer}
            </View>
          ) : null}
        </Safe>
      </KeyboardAvoidingView>
    </Modal>
  );
}
