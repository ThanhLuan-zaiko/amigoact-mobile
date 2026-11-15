import { Text, View } from "react-native";
import { MoreButton } from "@/components/common/PageLinks";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import { TrashList } from "@/components/posts/DraftAndTrash";
import RequireUser from "@/components/RequireUser";
import { mutedText } from "@/components/ui";
import { useCursorList } from "@/hooks/useCursorList";
import type { OrganizationDetail } from "@/lib/organizations";
import { getPostTrash } from "@/lib/postApi";
import { hasPermission } from "@/lib/roles";

function TrashContent({ organization }: { organization: OrganizationDetail }) {
  const slug = organization.slug;
  const allowed = hasPermission(organization.viewer, "posts.moderate");
  const trash = useCursorList(
    async (before) => {
      if (!allowed) return { items: [], next: null };
      const page = await getPostTrash(slug, before);
      return page ? { items: page.items, next: page.next_before } : null;
    },
    [slug, allowed],
  );
  if (!allowed) {
    return (
      <Text className={mutedText}>
        Chỉ ban quản trị mới xem được thùng rác.
      </Text>
    );
  }
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="font-body-semibold text-xl text-slate-900 dark:text-slate-100"
        >
          Thùng rác bài viết
        </Text>
        <Text className={mutedText}>
          Bài đã xóa được giữ 30 ngày. Ban quản trị khôi phục được, chỉ chủ sở
          hữu xóa vĩnh viễn được.
        </Text>
      </View>
      {trash.loading ? (
        <Loading />
      ) : trash.failed ? (
        <LoadError>Không tải được thùng rác. Vui lòng thử lại.</LoadError>
      ) : trash.items.length === 0 ? (
        <EmptyState
          title="Thùng rác trống"
          description="Bài viết bị xóa sẽ nằm ở đây trong 30 ngày."
        />
      ) : (
        <TrashList items={trash.items} />
      )}
      <MoreButton
        visible={trash.hasMore && !trash.loadingMore}
        onPress={trash.loadMore}
      />
    </View>
  );
}

export default function PostTrashScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <TrashContent organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
