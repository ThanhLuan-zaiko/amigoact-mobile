import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import EmptyState, { Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import PostForm from "@/components/posts/PostForm";
import RequireUser from "@/components/RequireUser";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { getLinkableActivities } from "@/lib/activityApi";
import { param } from "@/lib/appPath";
import type { OrganizationDetail } from "@/lib/organizations";
import { activityOptions } from "@/lib/postActivity";
import { getPostForEdit, updatePost } from "@/lib/postApi";
import { isPostId, postPath } from "@/lib/posts";

function EditPostContent({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const postId = param(useLocalSearchParams<{ postId?: string }>().postId);
  const slug = organization.slug;
  const data = useLoad(async () => {
    if (!isPostId(postId)) return null;
    const [post, activities] = await Promise.all([
      getPostForEdit(postId),
      getLinkableActivities(slug),
    ]);
    return post ? { post, activities } : null;
  }, [postId, slug]);
  if (data.loading) return <Loading />;
  if (!data.data || data.data.post.org.slug !== slug) {
    return (
      <EmptyState
        title="Không tìm thấy bài viết"
        description="Bài viết này không tồn tại hoặc đã bị xóa."
      />
    );
  }
  const { post, activities } = data.data;
  if (!post.viewer?.can_edit) {
    return <Text className={mutedText}>Chỉ tác giả mới sửa được bài này.</Text>;
  }
  const isDraft = post.status === "draft";
  return (
    <PostForm
      orgSlug={slug}
      activities={activityOptions(activities, post.activity ?? null)}
      submit={(_kind, fields, intent) =>
        updatePost(
          slug,
          postId,
          isDraft,
          fields,
          intent === "publish" ? "publish" : "save",
        )
      }
      kinds={[post.kind]}
      organizationName={organization.name}
      cancelHref={isDraft ? `${postPath(slug)}/drafts` : postPath(slug, postId)}
      draftsHref={`${postPath(slug)}/drafts`}
      initial={{
        kind: post.kind,
        visibility: post.visibility,
        title: post.title,
        body: post.body,
        tags: post.tags,
        media: post.media.map(({ id, mime }) => ({ id, mime })),
        activityId: post.activity?.id ?? null,
        isDraft,
      }}
    />
  );
}

export default function EditPostScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <EditPostContent organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
