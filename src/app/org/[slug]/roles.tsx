import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import Icon from "@/components/common/Icon";
import { Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import RequireUser from "@/components/RequireUser";
import { useLiveRefresh } from "@/components/realtime/hooks";
import RoleDetail, { NEW_ROLE, RoleList } from "@/components/roles/RoleDetail";
import RoleForm from "@/components/roles/RoleForm";
import { mutedText, panel, sectionTitle } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { param } from "@/lib/appPath";
import { getRoles } from "@/lib/organizationApi";
import type { OrganizationDetail } from "@/lib/organizations";
import { orgTopic } from "@/lib/realtime";
import { createRole } from "@/lib/roleActions";
import { hasPermission } from "@/lib/roles";

// A role was created, edited, moved, or deleted, or someone was given one.
const ROLE_EVENTS = ["roles.changed", "members.changed"] as const;

// The roles in rank order, then the chosen role (or the new role form) under
// them, as the web shows them on a phone. The choice lives in ?role=.
function RolesContent({ organization }: { organization: OrganizationDetail }) {
  const slug = organization.slug;
  const wanted = param(useLocalSearchParams<{ role?: string }>().role) || null;
  const roles = useLoad(() => getRoles(slug), [slug]);
  useLiveRefresh(orgTopic(organization.id), ROLE_EVENTS, () => roles.reload());
  if (roles.loading) return <Loading />;
  if (!roles.data) {
    return (
      <Text className={mutedText}>
        Chỉ thành viên mới xem được danh sách này.
      </Text>
    );
  }
  const list = roles.data;
  const { viewer } = organization;
  const canCreate = hasPermission(viewer, "roles.create");
  // Nobody hands out a permission they do not hold.
  const grantable = list.catalog.filter((code) => hasPermission(viewer, code));
  const creating = canCreate && wanted === NEW_ROLE;
  const role = creating
    ? null
    : (list.items.find((item) => item.id === wanted) ?? list.items[0] ?? null);
  const selected = creating ? NEW_ROLE : (role?.id ?? null);

  return (
    <View className="gap-4">
      <View className={`${panel} gap-3 p-4`}>
        <View className="flex-row items-center gap-2">
          <Icon name="tag" />
          <Text accessibilityRole="header" className={sectionTitle}>
            Vai trò
          </Text>
        </View>
        <Text className={mutedText}>
          Xếp theo thứ bậc, cao nhất ở trên. Chủ sở hữu đứng trên mọi vai trò.
        </Text>
        <RoleList
          roles={list.items}
          selected={selected}
          canCreate={canCreate}
          onSelect={(id) => router.setParams({ role: id })}
        />
      </View>
      <View className={`${panel} gap-4 p-4`}>
        {creating ? (
          <>
            <View className="flex-row items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
              <Icon name="plus" />
              <Text
                accessibilityRole="header"
                className="font-body-semibold text-lg text-slate-900 dark:text-slate-100"
              >
                Vai trò mới
              </Text>
            </View>
            <Text className={mutedText}>
              Vai trò mới nằm ở cuối danh sách. Đưa lên bằng nút mũi tên khi
              cần.
            </Text>
            <RoleForm
              submit={(fields) => createRole(slug, fields)}
              grantable={grantable}
              submitLabel="Tạo vai trò"
            />
          </>
        ) : role ? (
          <RoleDetail
            slug={slug}
            role={role}
            roles={list}
            viewer={viewer}
            grantable={grantable}
          />
        ) : (
          <Text className={mutedText}>Chọn hoặc tạo một vai trò.</Text>
        )}
      </View>
    </View>
  );
}

export default function RolesScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <RolesContent organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
