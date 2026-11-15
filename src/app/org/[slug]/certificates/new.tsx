import { Text } from "react-native";
import TemplateForm from "@/components/certificates/TemplateForm";
import OrgScreen from "@/components/organizations/OrgScreen";
import RequireUser from "@/components/RequireUser";
import { mutedText, sectionTitle } from "@/components/ui";
import { createTemplate } from "@/lib/certificateApi";
import { hasPermission } from "@/lib/roles";

export default function NewTemplateScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization, slug) =>
            hasPermission(organization.viewer, "certificates.templates") ? (
              <>
                <Text accessibilityRole="header" className={sectionTitle}>
                  Tạo mẫu chứng nhận
                </Text>
                <TemplateForm
                  submit={(name, background, layout) =>
                    createTemplate(slug, name, background, layout)
                  }
                  cancelHref={`/org/${slug}/certificates`}
                />
              </>
            ) : (
              <Text className={mutedText}>
                Chỉ ban quản trị mới tạo được mẫu chứng nhận.
              </Text>
            )
          }
        </OrgScreen>
      )}
    </RequireUser>
  );
}
