import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import type { ActionResult } from "@/lib/actionResult";
import { formatDateTime } from "@/lib/activities";
import {
  addComment,
  deleteComment,
  editComment,
  restoreComment,
} from "@/lib/commentApi";
import { getComments } from "@/lib/postApi";
import { COMMENT_MAX, type CommentApi } from "@/lib/posts";
import ActionButton from "../common/ActionButton";
import Button, { IconButton } from "../common/Button";
import Icon from "../common/Icon";
import { Loading } from "../common/States";
import { FormMessage } from "../FormParts";
import { TextAreaField } from "../forms/Fields";
import { errorText, mutedText, panel, sectionTitle, strongText } from "../ui";

// Writes a new comment, or edits one in place, ported from the web CommentForm.
function CommentForm({
  submit,
  defaultValue,
  onDone,
}: {
  submit: (text: string) => Promise<ActionResult>;
  defaultValue?: string;
  onDone?: () => void;
}) {
  const editing = defaultValue !== undefined;
  const [text, setText] = useState(defaultValue ?? "");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);

  async function send() {
    setPending(true);
    try {
      const next = await submit(text);
      setState(next);
      if (next.success) {
        if (!editing) setText("");
        onDone?.();
      }
    } catch {
      setState({ error: "Mất kết nối. Vui lòng thử lại." });
    } finally {
      setPending(false);
    }
  }

  return (
    <View className="gap-2">
      {editing ? null : <FormMessage state={{ success: state.success }} />}
      <TextAreaField
        label={editing ? "Sửa bình luận" : "Viết bình luận"}
        value={text}
        onChangeText={setText}
        rows={editing ? 2 : 3}
        maxLength={COMMENT_MAX}
        error={state.fieldErrors?.comment_body}
        required
      />
      {state.error ? (
        <Text accessibilityRole="alert" className={errorText}>
          {state.error}
        </Text>
      ) : null}
      <View className="flex-row justify-end">
        <Button
          icon={editing ? "save" : "send"}
          pending={pending}
          onPress={send}
        >
          {pending ? "Đang gửi…" : editing ? "Lưu" : "Gửi"}
        </Button>
      </View>
    </View>
  );
}

// One comment. A deleted comment keeps its place and shows no text. Only a
// manager sees the button that brings it back.
function CommentItem({ comment }: { comment: CommentApi }) {
  const [editing, setEditing] = useState(false);
  return (
    <View className="gap-2 py-3">
      <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
        <Text className={strongText}>{comment.author_name}</Text>
        <Text className={mutedText}>{formatDateTime(comment.created_at)}</Text>
        {comment.edited_at && !comment.deleted ? (
          <Text className={mutedText}>· đã sửa</Text>
        ) : null}
        <View className="ml-auto flex-row items-center gap-2">
          {comment.can_edit ? (
            <IconButton
              icon={editing ? "x" : "edit-2"}
              label={editing ? "Hủy sửa" : "Sửa bình luận"}
              onPress={() => setEditing((value) => !value)}
            />
          ) : null}
          {comment.can_delete ? (
            <ActionButton
              action={() => deleteComment(comment.id)}
              icon="trash-2"
              label="Xóa bình luận"
              confirmLabel="Xóa"
            />
          ) : null}
          {comment.can_restore ? (
            <ActionButton
              action={() => restoreComment(comment.id)}
              icon="rotate-ccw"
              label="Khôi phục bình luận"
            />
          ) : null}
        </View>
      </View>
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
          className="font-body text-[15px] leading-relaxed text-slate-700 dark:text-slate-300"
        >
          {comment.body}
        </Text>
      )}
    </View>
  );
}

// Comments are flat and oldest first, ported from the web CommentSection.
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
  return (
    <View className={`${panel} gap-3 p-4`}>
      <View className="flex-row items-center gap-2">
        <Icon name="message-circle" />
        <Text accessibilityRole="header" className={sectionTitle}>
          Bình luận
        </Text>
      </View>
      {page.loading ? (
        <Loading label="Đang tải bình luận…" />
      ) : page.data === null ? (
        <Text className={mutedText}>Không tải được bình luận.</Text>
      ) : items.length === 0 ? (
        <Text className={mutedText}>Chưa có bình luận nào.</Text>
      ) : (
        <View>
          {items.map((comment, index) => (
            <View
              key={comment.id}
              className={
                index > 0
                  ? "border-t border-slate-200 dark:border-slate-800"
                  : ""
              }
            >
              <CommentItem comment={comment} />
            </View>
          ))}
        </View>
      )}
      {canComment ? (
        <View className="border-t border-slate-200 pt-3 dark:border-slate-800">
          <CommentForm submit={(text) => addComment(postId, text)} />
        </View>
      ) : signedIn ? (
        <Text className={mutedText}>
          Chỉ thành viên của tổ chức mới bình luận được.
        </Text>
      ) : (
        <View className="flex-row flex-wrap items-center gap-1">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/login",
                params: { next: `/org/${slug}/posts/${postId}` },
              })
            }
            accessibilityRole="link"
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
