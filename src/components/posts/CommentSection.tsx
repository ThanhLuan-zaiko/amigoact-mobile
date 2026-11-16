import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import { getComments } from "@/lib/postApi";
import { Loading } from "../common/States";
import { mutedText } from "../ui";
import CommentComposer, { type ReplyTarget } from "./CommentComposer";
import CommentReplies from "./CommentReplies";
import CommentRow from "./CommentRow";

// The web CommentSection and CommentThread, the "Bình luận" tab of a post:
// each top-level comment with its replies folded under it, and the box to
// write in at the foot. Answering a reply joins the same thread.
export default function CommentSection({
  slug,
  postId,
  canComment,
  signedIn,
}: {
  slug: string;
  postId: string;
  canComment: boolean;
  signedIn: boolean;
}) {
  const page = useLoad(() => getComments(postId, null), [postId]);
  const items = page.data?.items ?? [];
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [versions, setVersions] = useState<Record<string, number>>({});

  function sent(rootId: string | null) {
    setReplyTo(null);
    if (rootId) {
      setVersions((current) => ({
        ...current,
        [rootId]: (current[rootId] ?? 0) + 1,
      }));
    }
  }

  return (
    <View>
      <View className="gap-5 p-4">
        {page.loading ? (
          <Loading label="Đang tải bình luận…" />
        ) : page.data === null ? (
          <Text className={mutedText}>Không tải được bình luận.</Text>
        ) : items.length === 0 ? (
          <Text className={`py-6 text-center ${mutedText}`}>
            Chưa có bình luận nào. Hãy là người đầu tiên.
          </Text>
        ) : (
          items.map((comment) => {
            const reply = canComment
              ? (name: string) => setReplyTo({ rootId: comment.id, name })
              : undefined;
            return (
              <View key={comment.id} className="gap-3">
                <CommentRow
                  comment={comment}
                  signedIn={signedIn}
                  onReply={reply ? () => reply(comment.author_name) : undefined}
                />
                <CommentReplies
                  root={comment}
                  signedIn={signedIn}
                  onReply={reply}
                  version={versions[comment.id] ?? 0}
                />
              </View>
            );
          })
        )}
      </View>
      {canComment ? (
        <CommentComposer
          postId={postId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSent={sent}
        />
      ) : signedIn ? (
        <Text
          className={`border-t border-slate-200 p-3 text-center dark:border-slate-800 ${mutedText}`}
        >
          Chỉ thành viên của tổ chức mới bình luận được.
        </Text>
      ) : (
        <View className="flex-row flex-wrap items-center justify-center gap-1 border-t border-slate-200 p-3 dark:border-slate-800">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/login",
                params: { next: `/org/${slug}/posts/${postId}` },
              })
            }
            accessibilityRole="link"
            className="min-h-11 justify-center"
          >
            <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
              Đăng nhập
            </Text>
          </Pressable>
          <Text className={mutedText}>để bình luận.</Text>
        </View>
      )}
    </View>
  );
}
