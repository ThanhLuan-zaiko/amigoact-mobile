import { router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import PostActions from "@/components/posts/PostActions";
import PostCard from "@/components/posts/PostCard";
import PostSidePanel from "@/components/posts/PostSidePanel";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { param } from "@/lib/appPath";
import { pickPostSideTab, postSideTabs } from "@/lib/postActivity";
import { getPost } from "@/lib/postApi";
import { isPostId } from "@/lib/posts";

function NotFound() {
  return (
    <EmptyState
      title="Không tìm thấy bài viết"
      description="Bài viết này không tồn tại, đã bị xóa hoặc bạn không có quyền xem."
    />
  );
}

function PostContent({ slug }: { slug: string }) {
  const params = useLocalSearchParams<{ postId?: string; tab?: string }>();
  const postId = param(params.postId);
  const { user } = useAuth();
  const valid = isPostId(postId);
  const post = useLoad(
    async () => ({ found: valid ? await getPost(postId) : null }),
    [postId],
  );
  if (!valid) return <NotFound />;
  if (post.loading) return <Loading />;
  if (!post.data) return <LoadError />;
  const found = post.data.found;
  // A post of another organization under this address is treated as missing.
  if (!found || found.slug !== slug) return <NotFound />;
  const draft = found.status === "draft";
  return (
    <>
      <PostCard
        post={found}
        linked={false}
        showActivity={draft}
        actions={<PostActions post={found} />}
      />
      {draft ? (
        <Text className={mutedText}>
          Đây là bản nháp, chỉ bạn nhìn thấy. Đăng bài để mọi người bình luận.
        </Text>
      ) : (
        // The web panel beside the post: its activity, the comments, and
        // the organization's other posts.
        <PostSidePanel
          post={found}
          slug={slug}
          tabs={postSideTabs(found.activity)}
          current={pickPostSideTab(param(params.tab), found.activity)}
          signedIn={Boolean(user)}
          onTab={(tab) => router.setParams({ tab })}
        />
      )}
    </>
  );
}

export default function PostScreen() {
  return <OrgScreen>{(_org, slug) => <PostContent slug={slug} />}</OrgScreen>;
}
