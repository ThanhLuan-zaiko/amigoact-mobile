import { router } from "expo-router";
import { type ReactNode, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { type ActionResult, firstError } from "@/lib/actionResult";
import { appPath } from "@/lib/appPath";
import { purgeConfirmed } from "@/lib/posts";
import { fieldError, inputField, strongText } from "../ui";
import { IconButton } from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import Icon, { type ExtraIconName, type IconName } from "./Icon";

// Opens the screen an action asks for, as a web Server Action redirects.
export function follow(state: ActionResult, replace = false): void {
  if (!state.next) return;
  const href = appPath(state.next) as never;
  if (replace) router.replace(href);
  else router.push(href);
}

// One icon button that runs an action and shows the error next to it, the
// native counterpart of the web ActionButton. With `confirmLabel`, the first
// press asks for confirmation with that text.
export default function ActionButton({
  action,
  icon,
  label,
  confirmLabel,
  extra,
}: {
  action: () => Promise<ActionResult>;
  icon: IconName;
  label: string;
  confirmLabel?: string;
  // Drawn instead of the Feather icon, such as the pin icons.
  extra?: ExtraIconName;
}) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();

  async function run() {
    setPending(true);
    setError(undefined);
    try {
      const state = await action();
      setError(firstError(state));
      setConfirming(false);
      follow(state, true);
    } catch {
      setError("Mất kết nối. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <View className="items-start gap-2">
      <View className="flex-row flex-wrap items-center gap-2">
        {confirmLabel && confirming ? (
          <>
            <Pressable
              onPress={run}
              disabled={pending}
              accessibilityRole="button"
              className={`min-h-11 justify-center rounded-md border border-teal-700 px-3 dark:border-teal-400 ${pending ? "opacity-50" : ""}`}
            >
              <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
                {confirmLabel}
              </Text>
            </Pressable>
            <IconButton
              icon="x"
              label="Hủy"
              onPress={() => setConfirming(false)}
            />
          </>
        ) : (
          <IconButton
            icon={icon}
            label={label}
            disabled={pending}
            extra={extra}
            onPress={confirmLabel ? () => setConfirming(true) : run}
          />
        )}
      </View>
      {error ? (
        <View className="flex-row items-start gap-1">
          <Icon name="alert-circle" size={12} tone="error" />
          <Text accessibilityRole="alert" className={fieldError}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// An icon button that asks first in a dialog, then runs the action, the
// native counterpart of the web ConfirmAction. Errors stay in the dialog.
export function ConfirmAction({
  action,
  label,
  icon,
  title,
  children,
  confirmLabel,
  typeToConfirm,
  tone = "danger",
}: {
  action: () => Promise<ActionResult>;
  label: string;
  icon: IconName;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  // When set, the viewer must type this text again before the button unlocks.
  typeToConfirm?: string;
  tone?: "danger" | "neutral" | "primary";
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const locked =
    typeToConfirm !== undefined && !purgeConfirmed(typeToConfirm, typed);

  function close() {
    setOpen(false);
    setTyped("");
    setError(undefined);
  }

  async function confirm() {
    setPending(true);
    try {
      const state = await action();
      const failure = firstError(state);
      if (failure) {
        setError(failure);
        return;
      }
      close();
      follow(state, true);
    } catch {
      setError("Mất kết nối. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <IconButton icon={icon} label={label} onPress={() => setOpen(true)} />
      <ConfirmDialog
        open={open}
        title={title}
        confirmLabel={pending ? "Đang xử lý…" : confirmLabel}
        confirmIcon={icon}
        pending={pending}
        confirmDisabled={locked}
        error={error}
        tone={tone}
        onConfirm={confirm}
        onClose={close}
      >
        {children}
        {typeToConfirm !== undefined ? (
          <View className="gap-1">
            <Text className="font-body text-sm text-slate-500 dark:text-slate-400">
              Gõ lại chính xác{" "}
              <Text className={strongText}>{typeToConfirm}</Text> để xác nhận.
            </Text>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel={`Gõ lại ${typeToConfirm}`}
              className={inputField}
            />
          </View>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
