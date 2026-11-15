import { useState } from "react";
import { Text, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import { setMemberRoles } from "@/lib/roleActions";
import type { RoleBadge, RoleInfo } from "@/lib/roles";
import { roleDot } from "@/lib/roles";
import Button, { IconButton } from "../common/Button";
import Sheet from "../common/Sheet";
import { FormMessage } from "../FormParts";
import { CheckRow } from "../forms/Fields";

// A small colored dot that stands for a role. The name always sits beside it.
export function RoleDot({ color }: { color: string }) {
  return <View className={`h-3 w-3 rounded-full ${roleDot(color)}`} />;
}

// A sheet of checkboxes that sets all the roles of one member at once.
export function MemberRolePicker({
  slug,
  userId,
  roles,
  held,
}: {
  slug: string;
  userId: string;
  roles: RoleInfo[];
  held: RoleBadge[];
}) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState(
    () => new Set(held.map((role) => role.id)),
  );
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setState(await setMemberRoles(slug, userId, [...chosen]));
    setPending(false);
  }

  return (
    <>
      <IconButton
        icon="tag"
        label="Gán vai trò"
        onPress={() => setOpen(true)}
      />
      <Sheet
        open={open}
        title="Gán vai trò"
        onClose={() => setOpen(false)}
        footer={
          <Button icon="save" pending={pending} onPress={save}>
            Lưu
          </Button>
        }
      >
        <FormMessage state={state} />
        {roles.map((role) => (
          <View key={role.id} className="flex-row items-center gap-2">
            <View className="flex-1">
              <CheckRow
                label={role.name}
                checked={chosen.has(role.id)}
                onChange={(on) => {
                  const next = new Set(chosen);
                  if (on) next.add(role.id);
                  else next.delete(role.id);
                  setChosen(next);
                }}
              />
            </View>
            <RoleDot color={role.color} />
          </View>
        ))}
      </Sheet>
    </>
  );
}

export function RoleChip({ color, name }: { color: string; name: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-sm border border-slate-200 px-2 py-1 dark:border-slate-800">
      <RoleDot color={color} />
      <Text className="font-body-medium text-xs text-slate-600 dark:text-slate-300">
        {name}
      </Text>
    </View>
  );
}
