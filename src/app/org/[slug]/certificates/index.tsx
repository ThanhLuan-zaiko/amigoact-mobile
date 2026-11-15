import { router } from "expo-router";
import { Text, View } from "react-native";
import CertificatePreview from "@/components/certificates/CertificatePreview";
import ActionButton from "@/components/common/ActionButton";
import Button, { IconButton } from "@/components/common/Button";
import EmptyState, { IconStat, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import RequireUser from "@/components/RequireUser";
import {
  mutedText,
  panel,
  sectionTitle,
  strongText,
  tagChip,
  tagChipText,
} from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { getTemplates, setTemplateActive } from "@/lib/certificateApi";
import { formatDate, type OrganizationDetail } from "@/lib/organizations";
import { hasPermission } from "@/lib/roles";

function TemplatesContent({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const slug = organization.slug;
  const allowed = hasPermission(organization.viewer, "certificates.templates");
  const templates = useLoad(
    async () => (allowed ? getTemplates(slug) : null),
    [slug, allowed],
  );
  if (templates.loading) return <Loading />;
  if (!templates.data) {
    return (
      <Text className={mutedText}>
        Chỉ ban quản trị mới quản lý được chứng nhận.
      </Text>
    );
  }
  const base = `/org/${slug}/certificates`;
  return (
    <>
      <View className="flex-row flex-wrap items-center gap-3">
        <Text accessibilityRole="header" className={`flex-1 ${sectionTitle}`}>
          Mẫu chứng nhận
        </Text>
        <Button icon="plus" onPress={() => router.push(`${base}/new` as never)}>
          Tạo mẫu
        </Button>
      </View>
      <Text className={mutedText}>
        Chọn mẫu khi cấp chứng nhận ở trang của hoạt động đã kết thúc. Mẫu không
        xóa được, chỉ tắt để ẩn khỏi việc cấp.
      </Text>
      {templates.data.length === 0 ? (
        <EmptyState
          title="Chưa có mẫu nào"
          description="Tạo một mẫu với ảnh nền và vị trí các nội dung để in chứng nhận."
        />
      ) : (
        templates.data.map((template) => (
          <View key={template.id} className={`${panel} min-w-0 gap-3 p-4`}>
            <CertificatePreview
              layout={template.layout}
              backgroundUrl={template.background_url}
              label={`Mẫu ${template.name}`}
            />
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className={`min-w-0 flex-1 basis-32 ${strongText}`}>
                {template.name}
              </Text>
              <View className={tagChip}>
                <Text className={tagChipText}>
                  {template.is_active ? "Đang dùng" : "Đã tắt"}
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap items-start gap-2">
              <IconStat icon="calendar" label="Ngày tạo">
                {formatDate(template.created_at)}
              </IconStat>
              <View className="ml-auto flex-row items-start gap-2">
                <IconButton
                  icon="edit-2"
                  label="Sửa mẫu"
                  onPress={() => router.push(`${base}/${template.id}` as never)}
                />
                <ActionButton
                  action={() =>
                    setTemplateActive(template.id, !template.is_active)
                  }
                  icon={template.is_active ? "eye-off" : "eye"}
                  label={template.is_active ? "Tắt mẫu" : "Bật lại mẫu"}
                />
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );
}

export default function CertificateTemplatesScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <TemplatesContent organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
