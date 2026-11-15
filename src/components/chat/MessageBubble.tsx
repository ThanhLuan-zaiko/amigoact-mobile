import { useState } from "react";
import { Text, View } from "react-native";
import {
  type ChatAttachment,
  type ChatMessage,
  type ChatResult,
  type MessageRights,
  messageTime,
} from "@/lib/chat";
import { IconButton } from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";
import Icon from "../common/Icon";
import ChatAvatar from "./ChatAvatar";
import { MediaAlbum } from "./MediaAlbum";
import { MessageEditor, MessageTools } from "./MessageTools";

export type BubbleHandlers = {
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage, body: string) => Promise<boolean>;
  onDelete: (message: ChatMessage) => Promise<ChatResult>;
  onReact: (message: ChatMessage, emoji: string) => Promise<boolean>;
  onPin: (message: ChatMessage) => Promise<boolean>;
  onOpenMedia: (
    files: ChatAttachment[],
    index: number,
    caption: string,
  ) => void;
};

// One message as a bubble, ported from the web MessageBubble: own messages on
// the right with a teal tint, others on the left. The tools sit behind the
// "more" button, as on a phone-width web page.
export default function MessageBubble({
  message,
  compact,
  mine,
  group,
  rights,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onOpenMedia,
}: BubbleHandlers & {
  message: ChatMessage;
  compact: boolean;
  mine: boolean;
  group: boolean;
  rights: MessageRights;
}) {
  const [editing, setEditing] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [pending, setPending] = useState(false);
  const showAuthor = group && !mine && !compact;
  const files = message.attachments;
  const withFiles = files.length > 0;

  async function confirmDelete() {
    setPending(true);
    const result = await onDelete(message);
    setPending(false);
    if (result.ok) setConfirming(false);
    else setDeleteError(result.error);
  }

  return (
    <View
      className={`flex-row items-start gap-2 ${mine ? "flex-row-reverse" : ""} ${compact ? "mt-0.5" : "mt-3"}`}
    >
      {group && !mine ? (
        <View className="w-9">
          {compact ? null : (
            <ChatAvatar name={message.author_name} url={null} size="sm" />
          )}
        </View>
      ) : null}
      <View
        className={`min-w-0 max-w-[80%] gap-1 ${mine ? "items-end" : "items-start"}`}
      >
        <View
          className={`min-w-0 gap-1.5 rounded-xl ${withFiles ? "w-72 p-1" : "px-3 py-2"} ${
            mine
              ? "bg-teal-50 dark:bg-teal-950/40"
              : "bg-slate-100 dark:bg-slate-800/60"
          } ${message.pinned ? "border border-teal-700 dark:border-teal-400" : ""}`}
        >
          {showAuthor ? (
            <Text
              className={`font-body-semibold text-sm text-teal-700 dark:text-teal-400 ${withFiles ? "px-2 pt-1" : ""}`}
            >
              {message.author_name || "Thành viên"}
            </Text>
          ) : null}
          {message.reply_to ? (
            <View
              className={`min-w-0 flex-row items-start gap-1.5 rounded-md border-l-2 border-teal-700 bg-white/60 px-2 py-1 dark:border-teal-400 dark:bg-slate-950/40 ${withFiles ? "mx-1" : ""}`}
            >
              <View className="mt-0.5">
                <Icon name="corner-up-left" size={12} tone="muted" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-body-semibold text-xs text-slate-800 dark:text-slate-200">
                  {message.reply_to.author_name}
                </Text>
                <Text
                  numberOfLines={2}
                  className="font-body text-xs text-slate-600 dark:text-slate-400"
                >
                  {message.reply_to.body || "Ảnh hoặc video"}
                </Text>
              </View>
            </View>
          ) : null}
          <MediaAlbum
            files={files}
            onOpen={(index) => onOpenMedia(files, index, message.body)}
          />
          {editing ? (
            <View className={withFiles ? "px-2 pb-1" : ""}>
              <MessageEditor
                initial={message.body}
                files={files.length}
                onCancel={() => setEditing(false)}
                onSave={async (body) => {
                  const ok = await onEdit(message, body);
                  if (ok) setEditing(false);
                  return ok;
                }}
              />
            </View>
          ) : (
            <View className={withFiles ? "px-2 pb-1" : ""}>
              {message.body ? (
                <Text
                  selectable
                  className="font-body text-[15px] leading-relaxed text-slate-900 dark:text-slate-100"
                >
                  {message.body}
                </Text>
              ) : null}
              <View className="flex-row items-center justify-end gap-1 pt-0.5">
                {message.pinned ? (
                  <View accessible accessibilityLabel="Đã ghim">
                    <Icon name="bookmark" size={11} tone="accent" />
                  </View>
                ) : null}
                {message.edited_at ? (
                  <Text className="font-body text-[11px] text-slate-500 dark:text-slate-400">
                    đã sửa
                  </Text>
                ) : null}
                <Text className="font-body text-[11px] text-slate-500 dark:text-slate-400">
                  {messageTime(message.created_at)}
                </Text>
              </View>
            </View>
          )}
        </View>
        <MessageTools
          message={message}
          open={toolsOpen}
          rights={rights}
          onReply={() => {
            setToolsOpen(false);
            onReply(message);
          }}
          onReact={(emoji) => onReact(message, emoji)}
          onEdit={() => {
            setToolsOpen(false);
            setEditing(true);
          }}
          onPin={() => onPin(message)}
          onDelete={() => setConfirming(true)}
        />
      </View>
      <IconButton
        icon="more-horizontal"
        label={toolsOpen ? "Ẩn thao tác" : "Thao tác với tin nhắn"}
        size={16}
        active={toolsOpen}
        onPress={() => setToolsOpen((value) => !value)}
        className={`self-center ${toolsOpen ? "" : "border-transparent"}`}
      />
      {confirming ? (
        <ConfirmDialog
          open
          title="Xóa tin nhắn?"
          confirmLabel="Xóa hẳn"
          confirmIcon="trash-2"
          pending={pending}
          error={deleteError}
          onConfirm={confirmDelete}
          onClose={() => {
            setConfirming(false);
            setDeleteError(undefined);
          }}
        >
          Tin nhắn bị xóa hẳn cho mọi người, kèm ảnh, video, ghim và cảm xúc.
          Không hoàn tác được.
        </ConfirmDialog>
      ) : null}
    </View>
  );
}
