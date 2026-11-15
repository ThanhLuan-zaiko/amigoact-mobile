import { useState } from "react";
import { View } from "react-native";
import { type ActionResult, firstError } from "@/lib/actionResult";
import { follow } from "./ActionButton";
import Button, { type ButtonVariant } from "./Button";
import type { IconName } from "./Icon";
import { ErrorLine } from "./States";

// A button with a word that runs an action and shows its error under it, for
// the web ActionButtons that carry text (Đăng, Đăng ký, Khôi phục).
export default function ActionTextButton({
  action,
  icon,
  label,
  variant = "primary",
  children,
}: {
  action: () => Promise<ActionResult>;
  icon: IconName;
  label?: string;
  variant?: ButtonVariant;
  children: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  async function run() {
    setPending(true);
    setError(undefined);
    try {
      const state = await action();
      setError(firstError(state));
      follow(state, true);
    } catch {
      setError("Mất kết nối. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }
  return (
    <View className="items-start gap-1">
      <Button
        variant={variant}
        icon={icon}
        label={label}
        pending={pending}
        onPress={run}
      >
        {children}
      </Button>
      <ErrorLine>{error}</ErrorLine>
    </View>
  );
}
