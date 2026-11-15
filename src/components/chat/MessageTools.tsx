import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  type ChatMessage,
  type MessageRights,
  QUICK_EMOJI,
  validateMessage,
} from "@/lib/chat";
import { IconButton } from "../common/Button";
import { errorText, inputField } from "../ui";

function chipClass(mine: boolean): string {
  return `min-h-8 flex-row items-center gap-1 rounded-md border px-2 py-0.5 ${
    mine
      ? "border-teal-700 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/40"
      : "border-slate-200 dark:border-slate-800"
  }`;
}

// Reactions under a message, and its tools, ported from the web MessageTools.
// Red only on delete, the one action here that cannot be undone.
export function MessageTools({
  message,
  open,
  rights,
  onReply,
  onReact,
  onEdit,
  onPin,
  onDelete,
}: {
  message: ChatMessage;
  open: boolean;
  rights: MessageRights;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <View className="gap-1.5">
      {message.reactions.length > 0 ? (
        <View className="flex-row flex-wrap items-center gap-1.5">
          {message.reactions.map((reaction) => (
            <Pressable
              key={reaction.emoji}
              disabled={!rights.react}
              onPress={() => onReact(reaction.emoji)}
              accessibilityRole="button"
              accessibilityState={{ selected: reaction.mine }}
              accessibilityLabel={`${reaction.emoji} ${reaction.count} người${reaction.mine ? ", có bạn" : ""}`}
              className={chipClass(reaction.mine)}
            >
              <Text className="text-sm">{reaction.emoji}</Text>
              <Text
                className={`font-body-semibold text-xs ${reaction.mine ? "text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-300"}`}
              >
                {reaction.count}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {open ? (
        <View className="flex-row flex-wrap items-center gap-1.5">
          {rights.reply ? (
            <IconButton
              icon="corner-up-left"
              label="Trả lời"
              size={16}
              onPress={onReply}
            />
          ) : null}
          {rights.react ? (
            <IconButton
              icon="smile"
              label="Chọn cảm xúc"
              size={16}
              active={picking}
              onPress={() => setPicking((value) => !value)}
            />
          ) : null}
          {rights.edit ? (
            <IconButton
              icon="edit-2"
              label="Sửa tin nhắn"
              size={16}
              onPress={onEdit}
            />
          ) : null}
          {rights.pin ? (
            <IconButton
              icon="bookmark"
              label={message.pinned ? "Bỏ ghim" : "Ghim tin nhắn"}
              size={16}
              active={message.pinned}
              onPress={onPin}
            />
          ) : null}
          {rights.delete ? (
            <IconButton
              icon="trash-2"
              label="Xóa tin nhắn"
              size={16}
              tone="error"
              onPress={onDelete}
            />
          ) : null}
        </View>
      ) : null}
      {picking && rights.react ? (
        <View className="flex-row flex-wrap gap-1.5">
          {QUICK_EMOJI.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => {
                onReact(emoji);
                setPicking(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Thả ${emoji}`}
              className={`${chipClass(message.reactions.some((r) => r.emoji === emoji && r.mine))} min-h-11 px-3`}
            >
              <Text className="text-lg">{emoji}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// Edits a message in place, ported from the web MessageEditor.
export function MessageEditor({
  initial,
  files = 0,
  onSave,
  onCancel,
}: {
  initial: string;
  files?: number;
  onSave: (body: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [body, setBody] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function save() {
    const issue = validateMessage(body, files);
    setProblem(issue);
    if (issue) return;
    if (body.trim() === initial.trim()) {
      onCancel();
      return;
    }
    setPending(true);
    await onSave(body);
    setPending(false);
  }
  return (
    <View className="gap-2">
      <TextInput
        value={body}
        onChangeText={setBody}
        multiline
        autoFocus
        accessibilityLabel="Sửa tin nhắn"
        aria-invalid={problem ? true : undefined}
        className={`${inputField} min-h-16`}
      />
      <View className="flex-row flex-wrap items-center gap-2">
        <IconButton
          icon="check"
          label="Lưu"
          disabled={pending}
          onPress={save}
        />
        <IconButton icon="x" label="Hủy sửa" onPress={onCancel} />
        {problem ? (
          <Text accessibilityRole="alert" className={errorText}>
            {problem}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
