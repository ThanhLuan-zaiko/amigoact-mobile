import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { addComment } from "@/lib/commentApi";
import { COMMENT_MAX } from "@/lib/posts";
import { IconButton } from "../common/Button";
import Icon from "../common/Icon";
import { errorText, inputField } from "../ui";

export type ReplyTarget = { rootId: string; name: string };

// The web CommentComposer: one line that grows, and a send button. Answering
// someone shows who above it, with a cross to stop.
export default function CommentComposer({
  postId,
  replyTo,
  onCancelReply,
  onSent,
}: {
  postId: string;
  replyTo: ReplyTarget | null;
  onCancelReply: () => void;
  onSent: (rootId: string | null) => void;
}) {
  const theme = useThemeColors();
  const box = useRef<{ focus: () => void } | null>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  // Choosing someone to answer opens the keyboard on the box.
  useEffect(() => {
    if (replyTo) box.current?.focus();
  }, [replyTo]);

  async function send() {
    setPending(true);
    setError(undefined);
    try {
      const next = await addComment(postId, text, replyTo?.rootId ?? null);
      if (next.success) {
        setText("");
        onSent(replyTo?.rootId ?? null);
      } else {
        setError(next.fieldErrors?.comment_body ?? next.error);
      }
    } catch {
      setError("Mất kết nối. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <View className="gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
      {replyTo ? (
        <View className="flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className="shrink text-xs text-slate-500 dark:text-slate-400"
          >
            {"Đang trả lời "}
            <Text className="font-body-semibold text-slate-900 dark:text-slate-100">
              {replyTo.name}
            </Text>
          </Text>
          <Pressable
            onPress={onCancelReply}
            accessibilityRole="button"
            accessibilityLabel="Thôi trả lời"
            className="h-11 w-11 items-center justify-center"
          >
            <Icon name="x" tone="subtle" />
          </Pressable>
        </View>
      ) : null}
      <View className="flex-row items-end gap-2">
        <TextInput
          ref={(node) => {
            box.current = node;
          }}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={COMMENT_MAX}
          placeholder={replyTo ? "Viết câu trả lời…" : "Thêm bình luận…"}
          placeholderTextColor={theme.subtle}
          accessibilityLabel={
            replyTo ? `Trả lời ${replyTo.name}` : "Thêm bình luận"
          }
          className={`max-h-32 min-w-0 flex-1 ${inputField}`}
        />
        <IconButton icon="send" label="Gửi" onPress={send} disabled={pending} />
      </View>
      {error ? (
        <Text accessibilityRole="alert" className={errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
