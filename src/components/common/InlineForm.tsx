import { useState } from "react";
import { View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import { FormMessage } from "../FormParts";
import { TextAreaField } from "../forms/Fields";
import Button, { type ButtonVariant, IconButton } from "./Button";
import type { IconName } from "./Icon";

// A button that opens a one-field form in place: the web AppealButton and
// RevokeButton. `validate` runs before the action, as the web form check does.
export default function InlineReasonForm({
  openIcon,
  openLabel,
  fieldLabel,
  hint,
  rows = 3,
  required = false,
  submitIcon,
  submitLabel,
  submitVariant = "primary",
  validate,
  submit,
}: {
  openIcon: IconName;
  openLabel: string;
  fieldLabel: string;
  hint?: string;
  rows?: number;
  required?: boolean;
  submitIcon: IconName;
  submitLabel: string;
  submitVariant?: ButtonVariant;
  validate?: (value: string) => string | null;
  submit: (value: string) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);

  if (!open) {
    return (
      <IconButton
        icon={openIcon}
        label={openLabel}
        onPress={() => setOpen(true)}
      />
    );
  }

  async function send() {
    const problem = validate?.(value);
    if (problem) {
      setState({ fieldErrors: { reason: problem } });
      return;
    }
    setPending(true);
    const result = await submit(value);
    setPending(false);
    setState(result);
    if (result.success) setValue("");
  }

  return (
    <View className="w-full gap-2">
      <FormMessage state={state} />
      <TextAreaField
        label={fieldLabel}
        value={value}
        onChangeText={setValue}
        rows={rows}
        maxLength={1000}
        hint={hint}
        required={required}
        error={state.fieldErrors?.reason}
      />
      <View className="flex-row items-center gap-2">
        <Button
          variant={submitVariant}
          icon={submitIcon}
          pending={pending}
          onPress={send}
        >
          {submitLabel}
        </Button>
        <IconButton icon="x" label="Hủy" onPress={() => setOpen(false)} />
      </View>
    </View>
  );
}
