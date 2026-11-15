import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  type ChatMessage,
  type ChatResult,
  MESSAGE_MAX,
  textLength,
  validateMessage,
} from "@/lib/chat";
import { IconButton } from "../common/Button";
import Icon from "../common/Icon";
import Picture from "../common/Picture";
import { primaryButton } from "../ui";
import type { Attachments, Draft } from "./useAttachments";

// The files waiting to be sent. A failed one is marked and must be removed.
function AttachmentTray({
  drafts,
  onRemove,
}: {
  drafts: Draft[];
  onRemove: (key: string) => void;
}) {
  if (drafts.length === 0) return null;
  return (
    <ScrollView
      horizontal
      accessibilityLabel="Tệp đính kèm"
      contentContainerClassName="gap-2 pb-1"
    >
      {drafts.map((draft) => {
        const busy = draft.assetId === null && draft.error === null;
        return (
          <View
            key={draft.key}
            className={`relative h-20 w-20 overflow-hidden rounded-lg border ${draft.error ? "border-red-700 dark:border-red-400" : "border-slate-200 dark:border-slate-800"}`}
          >
            {draft.kind === "video" ? (
              <View className="h-full w-full items-center justify-center bg-slate-900">
                <Icon name="play" tone="onDanger" />
              </View>
            ) : (
              <Picture src={draft.preview} className="h-full w-full" />
            )}
            {busy ? (
              <View
                accessibilityLabel={`Đang tải ${draft.name}`}
                className="absolute inset-0 items-center justify-center bg-slate-950/50"
              >
                <ActivityIndicator color="#ffffff" />
              </View>
            ) : null}
            {draft.error ? (
              <View
                accessibilityLabel={draft.error}
                className="absolute inset-0 items-center justify-center bg-white/70 dark:bg-slate-950/70"
              >
                <Icon name="alert-circle" size={20} tone="error" />
              </View>
            ) : null}
            <Pressable
              onPress={() => onRemove(draft.key)}
              accessibilityRole="button"
              accessibilityLabel={`Bỏ ${draft.name}`}
              hitSlop={8}
              className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-slate-950/70"
            >
              <Icon name="x" size={12} tone="onDanger" />
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

// The message box, ported from the web ChatComposer. The text and files stay
// when the server refuses them.
export default function ChatComposer({
  roomName,
  replyTo,
  attachments,
  onCancelReply,
  onTyping,
  onSend,
}: {
  roomName: string;
  replyTo: ChatMessage | null;
  attachments: Attachments;
  onCancelReply: () => void;
  onTyping: () => void;
  onSend: (body: string, attachmentIds: string[]) => Promise<ChatResult>;
}) {
  const theme = useThemeColors();
  const [body, setBody] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const length = textLength(body.trim());
  const { drafts, uploading, failed, ids } = attachments;

  async function send() {
    let issue = validateMessage(body, drafts.length);
    if (!issue && uploading) issue = "Đợi tải xong ảnh, video rồi gửi.";
    if (!issue && failed) issue = "Bỏ các tệp tải lên lỗi rồi gửi lại.";
    setProblem(issue);
    if (issue || pending) return;
    setPending(true);
    const result = await onSend(body, ids);
    setPending(false);
    if (result.ok) {
      setBody("");
      setProblem(null);
      attachments.clear();
    } else {
      setProblem(result.error);
    }
  }

  const notice = problem ?? attachments.notice;
  return (
    <View className="gap-2 border-t border-slate-200 p-2 dark:border-slate-800">
      {replyTo ? (
        <View className="flex-row items-center gap-2 border-l-2 border-teal-700 pl-2 dark:border-teal-400">
          <Icon name="corner-up-left" size={14} tone="accent" />
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-body text-sm text-slate-600 dark:text-slate-400"
          >
            <Text className="font-body-semibold text-slate-900 dark:text-slate-100">
              {replyTo.author_name}
            </Text>
            : {replyTo.body || "Ảnh hoặc video"}
          </Text>
          <IconButton
            icon="x"
            label="Bỏ trả lời"
            onPress={onCancelReply}
            className="border-transparent"
          />
        </View>
      ) : null}
      <AttachmentTray drafts={drafts} onRemove={attachments.remove} />
      <View className="flex-row items-end gap-2">
        <IconButton
          icon="paperclip"
          label="Đính kèm ảnh hoặc video"
          onPress={attachments.pick}
          className="border-transparent"
        />
        <TextInput
          value={body}
          onChangeText={(text) => {
            setBody(text);
            if (text.trim()) onTyping();
          }}
          multiline
          placeholder="Viết tin nhắn…"
          placeholderTextColor={theme.subtle}
          accessibilityLabel={`Nhắn vào ${roomName}`}
          aria-invalid={problem ? true : undefined}
          className="max-h-40 min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2.5 font-body text-[15px] text-slate-900 dark:border-slate-700 dark:text-slate-100"
        />
        <Pressable
          onPress={send}
          disabled={pending}
          accessibilityRole="button"
          accessibilityLabel="Gửi"
          className={`${primaryButton} w-11 px-0 ${pending ? "opacity-50" : ""}`}
        >
          <Icon name="send" tone="onAccent" />
        </Pressable>
      </View>
      {notice || length > MESSAGE_MAX - 200 ? (
        <View className="flex-row items-center justify-between gap-2 px-1">
          <Text
            accessibilityRole="alert"
            className="flex-1 font-body text-xs text-red-700 dark:text-red-400"
          >
            {notice}
          </Text>
          {length > MESSAGE_MAX - 200 ? (
            <Text
              className={`font-body text-xs ${length > MESSAGE_MAX ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
            >
              {length}/{MESSAGE_MAX}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
