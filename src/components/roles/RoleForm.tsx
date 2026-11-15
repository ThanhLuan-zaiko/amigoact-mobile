import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import type { RoleFields } from "@/lib/roleActions";
import { ROLE_COLORS, type RoleInfo } from "@/lib/roles";
import Button from "../common/Button";
import { FormMessage } from "../FormParts";
import { InputField } from "../forms/Fields";
import { fieldError, fieldLabel } from "../ui";
import PermissionPicker from "./PermissionPicker";

// The create and edit form of a role, ported from the web RoleForm.
export default function RoleForm({
  submit,
  role,
  grantable,
  submitLabel,
}: {
  submit: (fields: RoleFields) => Promise<ActionResult>;
  role?: RoleInfo;
  grantable: string[];
  submitLabel: string;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [color, setColor] = useState(role?.color ?? "");
  const [selected, setSelected] = useState(
    () => new Set(role?.permissions ?? []),
  );
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);

  async function send() {
    setPending(true);
    const result = await submit({ name, color, permissions: [...selected] });
    setPending(false);
    setState(result);
    // A new role starts empty again once it is saved.
    if (result.success && !role) {
      setName("");
      setColor("");
      setSelected(new Set());
    }
  }

  const colorError = state.fieldErrors?.role_color;
  return (
    <View className="gap-4">
      <FormMessage state={state} />
      <InputField
        label="Tên vai trò"
        value={name}
        onChangeText={setName}
        maxLength={50}
        error={state.fieldErrors?.role_name}
        required
      />
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Màu"
        className="gap-2"
      >
        <Text className={fieldLabel}>Màu</Text>
        <View className="flex-row flex-wrap gap-2">
          {ROLE_COLORS.map((option) => {
            const on = color === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setColor(option.value)}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: on }}
                className={`h-11 w-11 items-center justify-center rounded-md border ${
                  on
                    ? "border-teal-700 dark:border-teal-400"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <View className={`h-4 w-4 rounded-full ${option.dot}`} />
              </Pressable>
            );
          })}
        </View>
        {colorError ? (
          <Text accessibilityRole="alert" className={fieldError}>
            {colorError}
          </Text>
        ) : null}
      </View>
      <PermissionPicker
        selected={selected}
        onChange={setSelected}
        grantable={grantable}
        error={state.fieldErrors?.role_permissions}
      />
      <View className="border-t border-slate-200 pt-3 dark:border-slate-800">
        <Button icon="save" pending={pending} onPress={send}>
          {submitLabel}
        </Button>
      </View>
    </View>
  );
}
