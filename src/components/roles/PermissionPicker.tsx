import { Pressable, Text, View } from "react-native";
import { ADMINISTRATOR, MODULES, moduleCodes, PRESETS } from "@/lib/roles";
import { Chip } from "../common/Button";
import Icon from "../common/Icon";
import { CheckRow } from "../forms/Fields";
import { fieldError, fieldLabel, mutedText } from "../ui";

// Permissions grouped by module, plus ready-made sets on top, ported from the
// web PermissionPicker. A permission the viewer does not hold stays locked.
export default function PermissionPicker({
  selected,
  onChange,
  grantable,
  error,
}: {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  grantable: string[];
  error?: string;
}) {
  const canGrant = (code: string) => grantable.includes(code);

  function toggle(codes: string[], on: boolean) {
    const next = new Set(selected);
    for (const code of codes.filter(canGrant)) {
      if (on) next.add(code);
      else next.delete(code);
    }
    onChange(next);
  }

  // A preset replaces what can be changed. What the viewer cannot change stays.
  function applyPreset(codes: string[]) {
    const kept = [...selected].filter((code) => !canGrant(code));
    onChange(new Set([...kept, ...codes.filter(canGrant)]));
  }

  return (
    <View className="gap-3">
      <View className="gap-2">
        <Text className={fieldLabel}>Mẫu quyền</Text>
        <View className="flex-row flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Chip key={preset.id} onPress={() => applyPreset(preset.codes)}>
              {preset.label}
            </Chip>
          ))}
        </View>
        <Text className={mutedText}>
          Chọn một mẫu để điền sẵn, rồi bỏ hoặc thêm từng quyền bên dưới.
        </Text>
      </View>
      {canGrant(ADMINISTRATOR) ? (
        <View className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
          <CheckRow
            label="Quản trị viên"
            hint="Có mọi quyền dưới đây, kể cả quyền thêm sau này."
            checked={selected.has(ADMINISTRATOR)}
            onChange={(on) => toggle([ADMINISTRATOR], on)}
          />
        </View>
      ) : null}
      {MODULES.map((module) => {
        const codes = moduleCodes(module);
        const editable = codes.filter(canGrant);
        const allOn = editable.every((code) => selected.has(code));
        return (
          <View
            key={module.id}
            className="gap-1 border-t border-slate-200 pt-3 dark:border-slate-800"
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text accessibilityRole="header" className={fieldLabel}>
                {module.label}
              </Text>
              {editable.length > 1 ? (
                <Pressable
                  onPress={() => toggle(codes, !allOn)}
                  accessibilityRole="button"
                  className="min-h-9 flex-row items-center gap-1.5"
                >
                  <Icon
                    name={allOn ? "square" : "check-square"}
                    size={12}
                    tone="accent"
                  />
                  <Text className="font-body-semibold text-xs text-teal-700 dark:text-teal-400">
                    {allOn ? "Bỏ hết" : "Chọn hết"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {module.permissions.map((permission) => (
              <CheckRow
                key={permission.code}
                label={permission.label}
                hint={permission.hint}
                checked={selected.has(permission.code)}
                disabled={!canGrant(permission.code)}
                onChange={(on) => toggle([permission.code], on)}
              />
            ))}
          </View>
        );
      })}
      {error ? (
        <Text accessibilityRole="alert" className={fieldError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
