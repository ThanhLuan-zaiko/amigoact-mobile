import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { firstError } from "@/lib/actionResult";
import { deleteComment, editComment, restoreComment } from "@/lib/commentApi";
import type { CommentApi } from "@/lib/posts";
import ConfirmDialog from "../common/ConfirmDialog";
import { errorText, mutedText } from "../ui";
import { CommentAvatar, CommentLike, CommentTime } from "./CommentBits";
import CommentForm from "./CommentForm";

function MetaButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={10}
      className="min-h-6 justify-center"
    >
      <Text className="font-body-semibold text-xs text-slate-500 dark:text-slate-400">
        {label}
      </Text>
    </Pressable>
  );
}

// The web CommentRow: avatar, name, text, then the age and the small actions,
// with the heart on the right. A deleted comment keeps its place without text.
export default function CommentRow({
  comment,
  signedIn,
  onReply,
  small = false,
}: {
  comment: CommentApi;
  signedIn: boolean;
  onReply?: () => void;
  small?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function run(action: () => ReturnType<typeof deleteComment>) {
    setPending(true);
    setError(undefined);
    try {
      setError(firstError(await action()));
      setConfirming(false);
    } catch {
      setError("Mất kết nối. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <View className="flex-row gap-3">
      <CommentAvatar
        name={comment.author_name}
        url={comment.author_avatar_url}
        small={small}
      />
      <View className="min-w-0 flex-1 gap-1">
        <Text
          numberOfLines={1}
          className="font-body-semibold text-sm text-slate-500 dark:text-slate-400"
        >
          {comment.author_name}
        </Text>
        {comment.deleted ? (
          <Text className={`italic ${mutedText}`}>Bình luận đã bị xóa.</Text>
        ) : editing ? (
          <CommentForm
            submit={(text) => editComment(comment.id, text)}
            defaultValue={comment.body}
            onDone={() => setEditing(false)}
          />
        ) : (
          <Text
            selectable
            className="font-body text-[15px] leading-relaxed text-slate-900 dark:text-slate-100"
          >
            {comment.body}
          </Text>
        )}
        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
          <CommentTime iso={comment.created_at} />
          {comment.edited_at && !comment.deleted ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              Đã sửa
            </Text>
          ) : null}
          {onReply && !comment.deleted ? (
            <MetaButton label="Trả lời" onPress={onReply} />
          ) : null}
          {comment.can_edit ? (
            <MetaButton
              label={editing ? "Hủy sửa" : "Sửa"}
              onPress={() => setEditing((value) => !value)}
            />
          ) : null}
          {comment.can_delete ? (
            <MetaButton label="Xóa" onPress={() => setConfirming(true)} />
          ) : null}
          {comment.can_restore ? (
            <MetaButton
              label="Khôi phục"
              onPress={() => run(() => restoreComment(comment.id))}
            />
          ) : null}
        </View>
        {error && !confirming ? (
          <Text className={errorText}>{error}</Text>
        ) : null}
      </View>
      {comment.deleted ? null : (
        <CommentLike
          commentId={comment.id}
          liked={comment.liked ?? false}
          count={comment.like_count ?? 0}
          canLike={signedIn}
        />
      )}
      <ConfirmDialog
        open={confirming}
        title="Xóa bình luận"
        confirmLabel="Xóa"
        confirmIcon="trash-2"
        pending={pending}
        error={error}
        onConfirm={() => run(() => deleteComment(comment.id))}
        onClose={() => setConfirming(false)}
      />
    </View>
  );
}
