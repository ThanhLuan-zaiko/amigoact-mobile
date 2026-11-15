import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/common/Button";
import { Loading } from "@/components/common/States";
import { DeletedOrganizations } from "@/components/organizations/OwnedOrganizations";
import Page, { PageTitle } from "@/components/shell/Page";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { getDeletedOrganizations } from "@/lib/organizationApi";

// The owner's deleted organizations, linked from "Tổ chức của tôi".
export default function TrashScreen() {
  const deleted = useLoad(() => getDeletedOrganizations(), []);
  return (
    <Page
      refreshing={deleted.refreshing}
      onRefresh={() => deleted.reload(true)}
    >
      <View className="self-start">
        <Button
          variant="neutral"
          icon="arrow-left"
          onPress={() => router.navigate("/organizations")}
        >
          Quay lại
        </Button>
      </View>
      <PageTitle>Tổ chức đã xóa</PageTitle>
      {deleted.loading ? (
        <Loading />
      ) : (deleted.data ?? []).length === 0 ? (
        <Text className={mutedText}>Chưa có tổ chức nào đã xóa.</Text>
      ) : (
        <DeletedOrganizations organizations={deleted.data ?? []} />
      )}
    </Page>
  );
}
