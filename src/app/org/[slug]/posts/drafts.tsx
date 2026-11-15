import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/common/Button";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import { DraftList } from "@/components/posts/DraftAndTrash";
import RequireUser from "@/components/RequireUser";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { getOrgDrafts } from "@/lib/postApi";
import { postPath } from "@/lib/posts";

function DraftsContent({ slug }: { slug: string }) {
  const page = useLoad(() => getOrgDrafts(slug), [slug]);
  const base = postPath(slug);
  const posts = page.data?.posts ?? [];
  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center gap-3">
        <View className="flex-1 gap-1">
          <Text
            accessibilityRole="header"
            className="font-body-semibold text-xl text-slate-900 dark:text-slate-100"
          >
            Bản nháp của tôi
          </Text>
          <Text className={mutedText}>Chỉ bạn nhìn thấy các bài này.</Text>
        </View>
        <Button
          icon="edit-3"
          onPress={() => router.push(`${base}/new` as never)}
        >
          Viết bài
        </Button>
      </View>
      {page.loading ? (
        <Loading />
      ) : page.data === null ? (
        <LoadError>Không tải được bản nháp. Vui lòng thử lại.</LoadError>
      ) : posts.length === 0 ? (
        <EmptyState
          title="Chưa có bản nháp"
          description="Bài bạn lưu nháp trong tổ chức này sẽ hiện ở đây."
        />
      ) : (
        <DraftList posts={posts} back={`${base}/drafts`} />
      )}
    </View>
  );
}

export default function OrganizationDraftsScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>{(_org, slug) => <DraftsContent slug={slug} />}</OrgScreen>
      )}
    </RequireUser>
  );
}
