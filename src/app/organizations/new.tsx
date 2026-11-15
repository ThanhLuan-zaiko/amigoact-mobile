import { Text, View } from "react-native";
import OrganizationForm from "@/components/organizations/OrganizationForm";
import RequireUser from "@/components/RequireUser";
import Page, { PageTitle } from "@/components/shell/Page";
import { mutedText } from "@/components/ui";
import { createOrganization } from "@/lib/organizationActions";

export default function NewOrganizationScreen() {
  return (
    <RequireUser>
      {(user) => (
        <Page>
          <View className="gap-1">
            <PageTitle>Tạo tổ chức</PageTitle>
            <Text className={mutedText}>
              Bạn sẽ là chủ sở hữu của tổ chức này và có thể thêm người quản trị
              sau.
            </Text>
          </View>
          <OrganizationForm
            submit={(values, logo, cover, _listed, gallery) =>
              createOrganization(values, logo, cover, gallery)
            }
            contactDefaults={{ email: user.email, phone: user.phone }}
          />
        </Page>
      )}
    </RequireUser>
  );
}
