import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import CommentSection from "@/components/posts/CommentSection";
import PostActions from "@/components/posts/PostActions";
import PostCard from "@/components/posts/PostCard";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { param } from "@/lib/appPath";
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
  const postId = param(useLocalSearchParams<{ postId?: string }>().postId);
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
  return (
    <>
      <PostCard
        post={found}
        linked={false}
        actions={<PostActions post={found} />}
      />
      {found.status === "draft" ? (
        <Text className={mutedText}>
          Đây là bản nháp, chỉ bạn nhìn thấy. Đăng bài để mọi người bình luận.
        </Text>
      ) : (
        <CommentSection
          slug={slug}
          postId={postId}
          canComment={found.viewer.can_comment}
          signedIn={Boolean(user)}
        />
      )}
    </>
  );
}

export default function PostScreen() {
  return <OrgScreen>{(_org, slug) => <PostContent slug={slug} />}</OrgScreen>;
}
