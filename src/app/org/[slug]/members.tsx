import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import ActionButton from "@/components/common/ActionButton";
import PageLinks from "@/components/common/PageLinks";
import { IconStat, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import PersonRow from "@/components/organizations/PersonRow";
import RequireUser from "@/components/RequireUser";
import { useLiveRefresh } from "@/components/realtime/hooks";
import { MemberRolePicker, RoleChip } from "@/components/roles/RoleParts";
import {
  mutedText,
  panel,
  sectionTitle,
  tagChip,
  tagChipText,
} from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import type { User } from "@/lib/account";
import { param } from "@/lib/appPath";
import { removeMember } from "@/lib/organizationActions";
import { getMembers, getRoles } from "@/lib/organizationApi";
import {
  formatDate,
  type MemberInfo,
  type OrganizationDetail,
  pageOffset,
  ROLE_LABELS,
} from "@/lib/organizations";
import { orgTopic } from "@/lib/realtime";
import { assignableRoles, hasPermission, type RoleList } from "@/lib/roles";

// Someone joined, left, was removed, or changed role.
const MEMBER_EVENTS = ["members.changed", "roles.changed"] as const;

function MemberActions({
  organization,
  member,
  currentUserId,
  roles,
}: {
  organization: OrganizationDetail;
  member: MemberInfo;
  currentUserId: string;
  roles: RoleList | null;
}) {
  const { slug, viewer } = organization;
  const isOwner = viewer.role === "owner";
  const others = member.role !== "owner" && member.user_id !== currentUserId;
  // Every role of the member sits below the viewer's top role.
  const below = new Set(
    (roles?.items ?? []).filter((role) => role.below_you).map((r) => r.id),
  );
  const outranks = isOwner || member.roles.every((role) => below.has(role.id));
  const assignable = roles ? assignableRoles(roles.items) : [];
  const canAssign =
    others &&
    outranks &&
    hasPermission(viewer, "roles.assign") &&
    assignable.length > 0;
  const canRemove =
    others && outranks && hasPermission(viewer, "members.remove");
  if (!canAssign && !canRemove) return null;
  return (
    <View className="flex-row flex-wrap items-start gap-2">
      {canAssign ? (
        <MemberRolePicker
          slug={slug}
          userId={member.user_id}
          roles={assignable}
          held={member.roles}
        />
      ) : null}
      {canRemove ? (
        <ActionButton
          action={() => removeMember(slug, member.user_id)}
          icon="user-x"
          label="Xóa khỏi tổ chức"
          confirmLabel="Xóa khỏi tổ chức?"
        />
      ) : null}
    </View>
  );
}

function MemberList({
  organization,
  user,
}: {
  organization: OrganizationDetail;
  user: User;
}) {
  const slug = organization.slug;
  const offset = pageOffset(
    param(useLocalSearchParams<{ page?: string }>().page) || undefined,
  );
  const data = useLoad(async () => {
    const [page, roles] = await Promise.all([
      getMembers(slug, offset),
      getRoles(slug),
    ]);
    return { page, roles };
  }, [slug, offset]);
  useLiveRefresh(orgTopic(organization.id), MEMBER_EVENTS, () => data.reload());
  if (!data.data) return <Loading />;
  const { page, roles } = data.data;
  if (!page) {
    return (
      <Text className={mutedText}>
        Chỉ thành viên mới xem được danh sách này.
      </Text>
    );
  }
  return (
    <View className={`${panel} gap-3 p-4`}>
      <Text accessibilityRole="header" className={sectionTitle}>
        Thành viên
      </Text>
      <View>
        {page.items.map((member, index) => (
          <PersonRow
            key={member.user_id}
            name={member.full_name}
            first={index === 0}
            details={
              <>
                <IconStat icon="calendar" label="Ngày tham gia">
                  {formatDate(member.joined_at)}
                </IconStat>
                <View className="flex-row flex-wrap gap-2 pt-1">
                  {member.role === "owner" || member.roles.length === 0 ? (
                    <View className={tagChip}>
                      <Text className={tagChipText}>
                        {ROLE_LABELS[member.role]}
                      </Text>
                    </View>
                  ) : (
                    member.roles.map((role) => (
                      <RoleChip
                        key={role.id}
                        color={role.color}
                        name={role.name}
                      />
                    ))
                  )}
                </View>
              </>
            }
            trailing={
              <MemberActions
                organization={organization}
                member={member}
                currentUserId={user.id}
                roles={roles}
              />
            }
          />
        ))}
      </View>
      <PageLinks
        offset={offset}
        total={page.total}
        onPage={(next) =>
          router.setParams({ page: next > 1 ? String(next) : undefined })
        }
      />
    </View>
  );
}

export default function MembersScreen() {
  return (
    <RequireUser>
      {(user) => (
        <OrgScreen>
          {(organization) => (
            <MemberList organization={organization} user={user} />
          )}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
