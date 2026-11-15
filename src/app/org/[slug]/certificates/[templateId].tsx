import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import TemplateForm from "@/components/certificates/TemplateForm";
import { Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import RequireUser from "@/components/RequireUser";
import { mutedText, sectionTitle } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { param } from "@/lib/appPath";
import { getTemplate, updateTemplate } from "@/lib/certificateApi";

function EditTemplateContent({ slug }: { slug: string }) {
  const templateId = param(
    useLocalSearchParams<{ templateId?: string }>().templateId,
  );
  // Null for a template that does not exist or that the viewer may not manage.
  const template = useLoad(() => getTemplate(templateId), [templateId]);
  if (template.loading) return <Loading />;
  if (!template.data) {
    return (
      <Text className={mutedText}>
        Không tìm thấy mẫu này, hoặc bạn không có quyền sửa mẫu.
      </Text>
    );
  }
  const found = template.data;
  return (
    <>
      <Text accessibilityRole="header" className={sectionTitle}>
        Sửa mẫu chứng nhận
      </Text>
      <TemplateForm
        submit={(name, background, layout) =>
          updateTemplate(slug, found.id, name, background, layout)
        }
        cancelHref={`/org/${slug}/certificates`}
        template={found}
      />
    </>
  );
}

export default function EditTemplateScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(_org, slug) => <EditTemplateContent slug={slug} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
