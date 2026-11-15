import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import Button, { IconButton } from "@/components/common/Button";
import { MoreButton } from "@/components/common/PageLinks";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import { FeedFilters, TagFilterBar } from "@/components/posts/FeedParts";
import PostCard from "@/components/posts/PostCard";
import { useCursorList } from "@/hooks/useCursorList";
import { param } from "@/lib/appPath";
import type { OrganizationDetail } from "@/lib/organizations";
import { getOrgPosts } from "@/lib/postApi";
import { feedFilter, postPath } from "@/lib/posts";
import { hasPermission } from "@/lib/roles";
import { readTag, tagLabel } from "@/lib/tagLinks";

function OrganizationFeed({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const params = useLocalSearchParams<{ filter?: string; tag?: string }>();
  const slug = organization.slug;
  const filter = feedFilter(param(params.filter) || undefined);
  const tag = readTag(param(params.tag) || undefined);
  const feed = useCursorList(
    async (before) => {
      const page = await getOrgPosts(slug, filter, before, 20, tag);
      return page ? { items: page.posts, next: page.nextBefore } : null;
    },
    [slug, filter, tag],
  );
  const base = postPath(slug);
  const isMember = organization.viewer.status === "active";

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <View className="min-w-0 flex-1">
          <FeedFilters
            current={filter}
            onChange={(value) =>
              router.setParams({ filter: value === "all" ? undefined : value })
            }
          />
        </View>
        {isMember ? (
          <IconButton
            icon="file-text"
            label="Bản nháp của tôi"
            onPress={() => router.push(`${base}/drafts` as never)}
          />
        ) : null}
        {hasPermission(organization.viewer, "posts.moderate") ? (
          <IconButton
            icon="trash-2"
            label="Thùng rác bài viết"
            onPress={() => router.push(`${base}/trash` as never)}
          />
        ) : null}
        {isMember ? (
          <Button
            icon="edit-3"
            onPress={() => router.push(`${base}/new` as never)}
          >
            Viết bài
          </Button>
        ) : null}
      </View>
      {tag ? (
        <TagFilterBar
          label={tagLabel(tag, feed.items)}
          onClear={() => router.setParams({ tag: undefined })}
        />
      ) : null}
      {feed.loading ? (
        <Loading />
      ) : feed.failed ? (
        <LoadError>Không tải được bài viết. Vui lòng thử lại.</LoadError>
      ) : feed.items.length === 0 ? (
        <EmptyState
          title={tag ? "Chưa có bài với thẻ này" : "Chưa có bài viết"}
          description={
            tag
              ? "Bỏ lọc thẻ để xem mọi bài của tổ chức."
              : isMember
                ? "Hãy viết bài đầu tiên cho tổ chức."
                : "Bài viết công khai của tổ chức sẽ hiện ở đây."
          }
        />
      ) : (
        <View className="gap-3">
          {feed.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </View>
      )}
      <MoreButton
        visible={feed.hasMore && !feed.loadingMore}
        onPress={feed.loadMore}
      />
      {feed.loadingMore ? <Loading /> : null}
    </View>
  );
}

export default function OrganizationPostsScreen() {
  return (
    <OrgScreen>
      {(organization) => <OrganizationFeed organization={organization} />}
    </OrgScreen>
  );
}
