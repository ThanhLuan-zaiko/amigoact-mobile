import { router } from "expo-router";
import { Text, View } from "react-native";
import Button, { IconButton } from "@/components/common/Button";
import EmptyState, { Loading } from "@/components/common/States";
import { OwnedOrganizationCard } from "@/components/organizations/OwnedOrganizations";
import RequireUser from "@/components/RequireUser";
import Page, { PageTitle } from "@/components/shell/Page";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { getMyOrganizations } from "@/lib/organizationApi";
import { MAX_OWNED_ORGANIZATIONS } from "@/lib/organizations";

// Only organizations the viewer owns. Finding other organizations is the
// home screen's job (the "Tổ chức" tab).
function OrganizationsContent() {
  const mine = useLoad(() => getMyOrganizations(), []);
  const owned = (mine.data ?? []).filter(({ role }) => role === "owner");
  return (
    <Page refreshing={mine.refreshing} onRefresh={() => mine.reload(true)}>
      <PageTitle>Tổ chức của tôi</PageTitle>
      <View className="flex-row flex-wrap items-center gap-2">
        <IconButton
          icon="file-text"
          label="Bản nháp"
          onPress={() => router.push("/drafts")}
        />
        <IconButton
          icon="compass"
          label="Khám phá tổ chức"
          onPress={() => router.navigate("/?tab=orgs")}
        />
        <IconButton
          icon="trash-2"
          label="Tổ chức đã xóa"
          onPress={() => router.push("/trash")}
        />
        <Button icon="plus" onPress={() => router.push("/organizations/new")}>
          Tạo tổ chức
        </Button>
      </View>
      {mine.loading ? (
        <Loading />
      ) : owned.length === 0 ? (
        <EmptyState
          title="Bạn chưa sở hữu tổ chức nào"
          description="Tạo tổ chức của riêng bạn, hoặc khám phá các tổ chức khác ở trang chủ."
        />
      ) : (
        <View className="min-w-0 gap-3">
          <Text className={mutedText}>
            {owned.length}/{MAX_OWNED_ORGANIZATIONS} tổ chức
          </Text>
          {owned.map((organization) => (
            <OwnedOrganizationCard
              key={organization.id}
              organization={organization}
            />
          ))}
        </View>
      )}
    </Page>
  );
}

export default function OrganizationsScreen() {
  return <RequireUser>{() => <OrganizationsContent />}</RequireUser>;
}
