import { Pressable, Text, View } from "react-native";
import { deleteRole, reorderRoles, updateRole } from "@/lib/roleActions";
import {
  ADMINISTRATOR,
  hasPermission,
  movedOrder,
  type RoleInfo,
  type RoleList as RoleListType,
  summarize,
} from "@/lib/roles";
import ActionButton from "../common/ActionButton";
import Icon from "../common/Icon";
import { IconStat } from "../common/States";
import { mutedText, strongText } from "../ui";
import RoleForm from "./RoleForm";
import { RoleDot } from "./RoleParts";

export const NEW_ROLE = "new";

const row =
  "min-h-11 flex-row items-center gap-3 rounded-md border px-3 py-2.5";
const active =
  "border-teal-700 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/40";

// The roles in rank order, one compact row each, ported from the web RoleList.
export function RoleList({
  roles,
  selected,
  canCreate,
  onSelect,
}: {
  roles: RoleInfo[];
  selected: string | null;
  canCreate: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <View className="gap-2">
      {canCreate ? (
        <Pressable
          onPress={() => onSelect(NEW_ROLE)}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === NEW_ROLE }}
          className={`${row} border-dashed ${selected === NEW_ROLE ? active : "border-slate-300 dark:border-slate-700"}`}
        >
          <Icon name="plus" tone="accent" />
          <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
            Vai trò mới
          </Text>
        </Pressable>
      ) : null}
      {roles.length === 0 ? (
        <Text className={mutedText}>Chưa có vai trò nào.</Text>
      ) : (
        roles.map((role, index) => {
          const current = selected === role.id;
          return (
            <Pressable
              key={role.id}
              onPress={() => onSelect(role.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: current }}
              className={`${row} ${current ? active : "border-transparent"}`}
            >
              <Text className={`w-5 text-right ${mutedText}`}>{index + 1}</Text>
              <RoleDot color={role.color} />
              <Text
                numberOfLines={1}
                className={`min-w-0 flex-1 ${strongText}`}
              >
                {role.name}
              </Text>
              {role.permissions.includes(ADMINISTRATOR) ? (
                <View accessible accessibilityLabel="Quản trị viên">
                  <Icon name="shield" size={14} tone="subtle" />
                </View>
              ) : null}
              <IconStat icon="users" label="Số thành viên">
                {role.member_count}
              </IconStat>
              <Icon name="chevron-right" tone="subtle" />
            </Pressable>
          );
        })
      )}
    </View>
  );
}

// One role: rank controls, then the edit form or a read-only summary.
export default function RoleDetail({
  slug,
  role,
  roles,
  viewer,
  grantable,
}: {
  slug: string;
  role: RoleInfo;
  roles: RoleListType;
  viewer: { permissions: string[] };
  grantable: string[];
}) {
  const canUpdate = role.below_you && hasPermission(viewer, "roles.update");
  const canDelete = role.below_you && hasPermission(viewer, "roles.delete");
  const up = canUpdate ? movedOrder(roles.items, role.id, "up") : null;
  const down = canUpdate ? movedOrder(roles.items, role.id, "down") : null;
  const lines = summarize(role.permissions);

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <RoleDot color={role.color} />
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="min-w-0 flex-1 basis-40 font-body-semibold text-lg text-slate-900 dark:text-slate-100"
        >
          {role.name}
        </Text>
        <IconStat icon="users" label="Số thành viên">
          {role.member_count}
        </IconStat>
        <View className="flex-row flex-wrap items-center gap-2">
          {up ? (
            <ActionButton
              action={() => reorderRoles(slug, up)}
              icon="arrow-up"
              label="Đưa lên"
            />
          ) : null}
          {down ? (
            <ActionButton
              action={() => reorderRoles(slug, down)}
              icon="arrow-down"
              label="Đưa xuống"
            />
          ) : null}
          {canDelete ? (
            <ActionButton
              action={() => deleteRole(slug, role.id)}
              icon="trash-2"
              label="Xóa vai trò"
              confirmLabel="Xóa vai trò?"
            />
          ) : null}
        </View>
      </View>
      {canUpdate ? (
        <RoleForm
          key={role.id}
          submit={(fields) => updateRole(slug, role.id, fields)}
          role={role}
          grantable={grantable}
          submitLabel="Lưu thay đổi"
        />
      ) : (
        <>
          <View className="flex-row items-center gap-2">
            <Icon name="lock" size={14} tone="subtle" />
            <Text className={`flex-1 ${mutedText}`}>
              {role.below_you
                ? "Bạn không có quyền sửa vai trò, nên chỉ xem được."
                : "Vai trò này ngang hoặc cao hơn vai trò của bạn, nên bạn chỉ xem được."}
            </Text>
          </View>
          {lines.length === 0 ? (
            <Text className={mutedText}>
              Chỉ để nhận diện, không có quyền nào.
            </Text>
          ) : (
            <View className="gap-2">
              {lines.map((line) => (
                <View key={line.module} className="gap-0.5">
                  <Text className="font-body-semibold text-sm text-slate-700 dark:text-slate-300">
                    {line.module}
                  </Text>
                  <Text className={mutedText}>{line.actions.join(", ")}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}
