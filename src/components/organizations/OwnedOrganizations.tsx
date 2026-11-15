import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { firstError } from "@/lib/actionResult";
import {
  purgeOrganization,
  restoreOrganization,
} from "@/lib/organizationActions";
import {
  type DeletedOrganization,
  formatDate,
  initials,
  JOIN_POLICY_LABELS,
  type MyOrganization,
  ORG_TYPE_LABELS,
} from "@/lib/organizations";
import Button from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";
import Picture from "../common/Picture";
import { ErrorLine, IconStat } from "../common/States";
import {
  fieldLabel,
  inputField,
  mutedText,
  panel,
  sectionTitle,
  strongText,
} from "../ui";

// The web OwnedOrganizationCard: cover banner, logo, name, and "Quản lý".
export function OwnedOrganizationCard({
  organization,
}: {
  organization: MyOrganization;
}) {
  const href = `/org/${organization.slug}`;
  return (
    <View className={`${panel} min-w-0 overflow-hidden`}>
      {organization.cover_url ? (
        <Picture
          src={organization.cover_url}
          width={640}
          focus={organization.cover_focus}
          className="h-24 w-full"
        />
      ) : null}
      <View className="min-w-0 gap-3 p-4">
        <View className="min-w-0 flex-row items-center gap-3">
          {organization.logo_url ? (
            <Picture
              src={organization.logo_url}
              width={320}
              focus={organization.logo_focus}
              className="h-10 w-10 rounded-md border border-slate-300 dark:border-slate-700"
            />
          ) : (
            <View className="h-10 w-10 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800">
              <Text className="font-body-semibold text-sm text-slate-700 dark:text-slate-300">
                {initials(organization.name)}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => router.push(href as never)}
            accessibilityRole="link"
            className="min-w-0 flex-1"
          >
            <Text numberOfLines={1} className={strongText}>
              {organization.name}
            </Text>
          </Pressable>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className={mutedText}>
            {ORG_TYPE_LABELS[organization.org_type]} ·{" "}
            {JOIN_POLICY_LABELS[organization.join_policy]}
          </Text>
          <IconStat icon="users" label="Thành viên">
            {organization.member_count}
          </IconStat>
        </View>
        <Button
          variant="secondary"
          icon="settings"
          onPress={() => router.push(`${href}/settings` as never)}
        >
          Quản lý
        </Button>
      </View>
    </View>
  );
}

// Deletes a trashed organization for good. The owner types its name first.
function PurgeOrganizationButton({
  organizationId,
  name,
}: {
  organizationId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  function close() {
    setOpen(false);
    setTypedName("");
    setError(undefined);
  }

  async function confirm() {
    setPending(true);
    const state = await purgeOrganization(organizationId);
    setPending(false);
    if (state.error) {
      setError(state.error);
      return;
    }
    close();
  }

  return (
    <>
      <Button variant="danger" icon="trash-2" onPress={() => setOpen(true)}>
        Xóa vĩnh viễn
      </Button>
      <ConfirmDialog
        open={open}
        title="Xóa vĩnh viễn tổ chức?"
        confirmLabel="Xóa vĩnh viễn"
        confirmIcon="trash-2"
        confirmDisabled={typedName.trim() !== name}
        pending={pending}
        error={error}
        onConfirm={confirm}
        onClose={close}
      >
        <Text className={mutedText}>
          Thao tác này không thể hoàn tác. Hoạt động, đăng ký và điểm danh của
          tổ chức sẽ bị xóa hẳn. Giờ tình nguyện đã duyệt vẫn được giữ lại.
        </Text>
        <View className="gap-1 pt-2">
          <Text className={fieldLabel}>Nhập “{name}” để xác nhận</Text>
          <TextInput
            value={typedName}
            onChangeText={setTypedName}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={`Nhập ${name} để xác nhận`}
            className={inputField}
          />
        </View>
      </ConfirmDialog>
    </>
  );
}

function RestoreButton({
  organization,
}: {
  organization: DeletedOrganization;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  return (
    <View className="gap-1">
      <Button
        variant="secondary"
        icon="rotate-ccw"
        label={`Khôi phục ${organization.name}`}
        pending={pending}
        onPress={async () => {
          setPending(true);
          setError(firstError(await restoreOrganization(organization.id)));
          setPending(false);
        }}
      >
        Khôi phục
      </Button>
      <ErrorLine>{error}</ErrorLine>
    </View>
  );
}

// The owner's deleted organizations. A deleted organization has no public
// screen, so it is restored or deleted for good from here.
export function DeletedOrganizations({
  organizations,
}: {
  organizations: DeletedOrganization[];
}) {
  return (
    <View className="min-w-0 gap-3">
      <View className="flex-row items-baseline gap-2">
        <Text accessibilityRole="header" className={sectionTitle}>
          Tổ chức đã xóa
        </Text>
        <Text className={mutedText}>{organizations.length}</Text>
      </View>
      {organizations.map((organization) => (
        <View key={organization.id} className={`${panel} min-w-0 gap-3 p-4`}>
          <View className="min-w-0">
            <Text numberOfLines={1} className={strongText}>
              {organization.name}
            </Text>
            <Text className={mutedText}>
              Xóa ngày {formatDate(organization.deleted_at)}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <RestoreButton organization={organization} />
            <PurgeOrganizationButton
              organizationId={organization.id}
              name={organization.name}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
