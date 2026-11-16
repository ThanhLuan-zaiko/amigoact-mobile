import { useState } from "react";
import { Text, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import { COMMENT_MAX } from "@/lib/posts";
import Button from "../common/Button";
import { FormMessage } from "../FormParts";
import { TextAreaField } from "../forms/Fields";
import { errorText } from "../ui";

// Writes a new comment, or edits one in place, ported from the web CommentForm.
export default function CommentForm({
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
