import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/common/Button";
import EmptyState, { Loading } from "@/components/common/States";
import { DraftList } from "@/components/posts/DraftAndTrash";
import RequireUser from "@/components/RequireUser";
import Page, { PageTitle } from "@/components/shell/Page";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { getMyDrafts } from "@/lib/postApi";

// The viewer's drafts in every organization.
function DraftsContent() {
  const drafts = useLoad(() => getMyDrafts(), []);
  return (
    <Page refreshing={drafts.refreshing} onRefresh={() => drafts.reload(true)}>
      <View className="self-start">
        <Button
          variant="neutral"
          icon="arrow-left"
          onPress={() => router.navigate("/organizations")}
        >
          Quay lại
        </Button>
      </View>
      <View className="gap-1">
        <PageTitle
          action={
            <Button icon="edit-3" onPress={() => router.push("/compose")}>
              Viết bài
            </Button>
          }
        >
          Bản nháp
        </PageTitle>
        <Text className={mutedText}>Chỉ bạn nhìn thấy các bài này.</Text>
      </View>
      {drafts.loading ? (
        <Loading />
      ) : (drafts.data ?? []).length === 0 ? (
        <EmptyState
          title="Chưa có bản nháp"
          description="Bài bạn lưu nháp sẽ hiện ở đây, chỉ mình bạn nhìn thấy."
        />
      ) : (
        <DraftList posts={drafts.data ?? []} back="/drafts" />
      )}
    </Page>
  );
}

export default function DraftsScreen() {
  return <RequireUser>{() => <DraftsContent />}</RequireUser>;
}
