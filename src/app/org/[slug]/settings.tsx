import { Text } from "react-native";
import { HourRuleForm } from "@/components/attendance/HourForms";
import { Loading } from "@/components/common/States";
import DeleteOrganizationPanel from "@/components/organizations/DeleteOrganizationPanel";
import { GalleryManager } from "@/components/organizations/GalleryManager";
import OrganizationForm from "@/components/organizations/OrganizationForm";
import OrgScreen from "@/components/organizations/OrgScreen";
import RequireUser from "@/components/RequireUser";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { getHourRule } from "@/lib/attendanceApi";
import { updateOrganization } from "@/lib/organizationActions";
import { getGallery } from "@/lib/organizationApi";
import type { OrganizationDetail } from "@/lib/organizations";
import { hasPermission } from "@/lib/roles";

function SettingsContent({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const slug = organization.slug;
  const allowed = hasPermission(organization.viewer, "organization.update");
  const extra = useLoad(async () => {
    if (!allowed) return null;
    const [rule, gallery] = await Promise.all([
      getHourRule(slug),
      getGallery(slug),
    ]);
    return { rule, gallery };
  }, [slug, allowed]);
  if (!allowed) {
    return (
      <Text className={mutedText}>Chỉ ban quản trị mới sửa được tổ chức.</Text>
    );
  }
  return (
    <>
      <OrganizationForm
        key={organization.id}
        submit={(values, logo, cover, listed, gallery) =>
          updateOrganization(slug, values, logo, cover, listed, gallery)
        }
        organization={organization}
      />
      {extra.data ? (
        <>
          <GalleryManager
            slug={slug}
            items={extra.data.gallery}
            logoUrl={organization.logo_url}
            coverUrl={organization.cover_url}
          />
          {extra.data.rule ? (
            <HourRuleForm slug={slug} rule={extra.data.rule} />
          ) : null}
        </>
      ) : (
        <Loading />
      )}
      {organization.viewer.role === "owner" ? (
        <DeleteOrganizationPanel
          slug={slug}
          name={organization.name}
          openActivityCount={organization.open_activity_count}
        />
      ) : null}
    </>
  );
}

export default function OrganizationSettingsScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <SettingsContent organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
