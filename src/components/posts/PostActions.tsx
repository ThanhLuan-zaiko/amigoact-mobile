import { router } from "expo-router";
import { Text, View } from "react-native";
import { deletePost, setHidden, setPinned } from "@/lib/postApi";
import { postPath } from "@/lib/posts";
import ActionButton, { ConfirmAction } from "../common/ActionButton";
import { IconButton } from "../common/Button";
import type { Post } from "../types";
import { mutedText } from "../ui";

// The controls of a post, ported from the web PostActions. Each one shows only
// when the backend says this viewer may use it.
export default function PostActions({
  post,
  inline = false,
}: {
  post: Post;
  inline?: boolean;
}) {
  const { viewer } = post;
  const isDraft = post.status === "draft";
  if (
    !viewer.can_edit &&
    !viewer.can_delete &&
    !viewer.can_pin &&
    !viewer.can_hide
  ) {
    return null;
  }
  const back = isDraft ? `${postPath(post.slug)}/drafts` : postPath(post.slug);

  return (
    <View
      className={
        inline
          ? "flex-row items-center gap-1"
          : "flex-row flex-wrap items-start gap-2 border-t border-slate-200 pt-3 dark:border-slate-800"
      }
    >
      {viewer.can_edit ? (
        <IconButton
          icon="edit-2"
          label="Sửa bài"
          onPress={() =>
            router.push(`${postPath(post.slug, post.id)}/edit` as never)
          }
        />
      ) : null}
      {viewer.can_pin ? (
        <ActionButton
          action={() => setPinned(post.id, !post.pinned)}
          icon="bookmark"
          label={post.pinned ? "Bỏ ghim" : "Ghim bài"}
          extra={post.pinned ? "pin-off" : "pin"}
        />
      ) : null}
      {viewer.can_hide ? (
        <ActionButton
          action={() => setHidden(post.id, !post.hidden)}
          icon={post.hidden ? "eye" : "eye-off"}
          label={post.hidden ? "Hiện lại bài" : "Ẩn khỏi bảng tin"}
        />
      ) : null}
      {viewer.can_delete ? (
        <ConfirmAction
          action={() => deletePost(post.id, back)}
          label="Xóa bài"
          icon="trash-2"
          title={isDraft ? "Xóa bản nháp?" : "Chuyển bài vào thùng rác?"}
          confirmLabel={isDraft ? "Xóa vĩnh viễn" : "Chuyển vào thùng rác"}
        >
          <Text className={mutedText}>
            {isDraft
              ? "Bản nháp sẽ bị xóa vĩnh viễn và không khôi phục được."
              : "Bài sẽ ẩn khỏi bảng tin. Ban quản trị có thể khôi phục trong 30 ngày, sau đó bài bị xóa vĩnh viễn."}
          </Text>
        </ConfirmAction>
      ) : null}
    </View>
  );
}
