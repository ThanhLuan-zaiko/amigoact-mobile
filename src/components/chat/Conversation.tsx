import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import type {
  ChatAttachment,
  ChatMessage,
  ChatResult,
  ChatRoom,
} from "@/lib/chat";
import { typingText } from "@/lib/typing";
import { IconButton } from "../common/Button";
import { errorText, mutedText } from "../ui";
import ChatAvatar from "./ChatAvatar";
import ChatComposer from "./ChatComposer";
import { MediaViewer } from "./MediaAlbum";
import MessageList from "./MessageList";
import PinsPanel from "./PinsPanel";
import { useAttachments } from "./useAttachments";
import type { SocketStatus } from "./useChatSocket";
import type { MessengerState } from "./useMessenger";

const STATUS_TEXT: Record<SocketStatus, string> = {
  live: "Trực tiếp",
  connecting: "Đang kết nối…",
  offline: "Mất kết nối, tự cập nhật mỗi 10 giây",
};

// Green means live. Amber means the screen is falling back to polling.
const STATUS_DOT: Record<SocketStatus, string> = {
  live: "bg-green-700 dark:bg-green-400",
  connecting: "bg-slate-400 dark:bg-slate-500",
  offline: "bg-amber-700 dark:bg-amber-400",
};

function subtitle(room: ChatRoom): string {
  if (room.kind === "dm") return `Nhắn riêng · ${room.org.name}`;
  if (room.kind === "channel")
    return room.topic ? `${room.org.name} · ${room.topic}` : room.org.name;
  return "Phòng chung của tổ chức";
}

function ConversationHeader({
  room,
  typing,
  status,
  showPins,
  onBack,
  onTogglePins,
}: {
  room: ChatRoom;
  typing: string | null;
  status: SocketStatus;
  showPins: boolean;
  onBack: () => void;
  onTogglePins: () => void;
}) {
  const channel =
    room.kind === "channel" ? (room.restricted ? "restricted" : "open") : null;
  return (
    <View className="flex-row items-center gap-2 border-b border-slate-200 px-2 py-2 dark:border-slate-800">
      <IconButton
        icon="arrow-left"
        label="Về danh sách"
        onPress={onBack}
        className="border-transparent"
      />
      <ChatAvatar name={room.name} url={room.avatar_url} channel={channel} />
      <View className="min-w-0 flex-1">
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="font-body-semibold text-base text-slate-900 dark:text-slate-100"
        >
          {room.name}
        </Text>
        <View
          accessible
          accessibilityLabel={STATUS_TEXT[status]}
          className="flex-row items-center gap-1.5"
        >
          <View className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          <Text
            numberOfLines={1}
            className={`flex-1 font-body text-xs ${typing ? "text-teal-700 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"}`}
          >
            {typing ??
              (status === "offline" ? STATUS_TEXT.offline : subtitle(room))}
          </Text>
        </View>
      </View>
      <IconButton
        icon="external-link"
        label={`Trang ${room.org.name}`}
        onPress={() =>
          router.push(`/org/${encodeURIComponent(room.org.slug)}` as never)
        }
        className="border-transparent"
      />
      <IconButton
        icon="bookmark"
        label={showPins ? "Ẩn tin đã ghim" : "Xem tin đã ghim"}
        active={showPins}
        onPress={onTogglePins}
        className={showPins ? "" : "border-transparent"}
      />
    </View>
  );
}

type Viewing = { files: ChatAttachment[]; index: number; caption: string };

// The open conversation: header, pinned messages, messages and the composer.
export default function Conversation({
  chat,
  viewerId,
  status,
}: {
  chat: MessengerState;
  viewerId: string;
  status: SocketStatus;
}) {
  const { room, cache } = chat;
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const attachments = useAttachments();
  if (!room) return null;

  async function run(action: Promise<ChatResult>): Promise<boolean> {
    const result = await action;
    setError(result.ok ? null : result.error);
    return result.ok;
  }

  const pinnedKey = (cache?.items ?? [])
    .filter((m) => m.pinned)
    .map((m) => m.id)
    .join(",");

  return (
    <View accessibilityLabel={`Trò chuyện với ${room.name}`} className="flex-1">
      <ConversationHeader
        room={room}
        typing={typingText(chat.typing[room.room_id], room.kind)}
        status={status}
        showPins={showPins}
        onBack={() => chat.selectRoom(null)}
        onTogglePins={() => setShowPins((value) => !value)}
      />
      {showPins ? <PinsPanel key={pinnedKey} roomId={room.room_id} /> : null}
      {error ? (
        <Text
          accessibilityRole="alert"
          className={`border-b border-slate-200 px-4 py-2 dark:border-slate-800 ${errorText}`}
        >
          {error}
        </Text>
      ) : null}
      {cache ? (
        <MessageList
          room={room}
          cache={cache}
          viewerId={viewerId}
          onLoadOlder={chat.loadOlder}
          onReply={setReplyTo}
          onEdit={(message, body) => run(chat.edit(message, body))}
          onDelete={(message) => chat.remove(message)}
          onReact={(message, emoji) => run(chat.react(message, emoji))}
          onPin={(message) => run(chat.pin(message))}
          onOpenMedia={(files, index, caption) =>
            setViewing({ files, index, caption })
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className={mutedText}>
            {chat.loadError ?? "Đang tải tin nhắn…"}
          </Text>
          {chat.loadError ? (
            <IconButton
              icon="refresh-cw"
              label="Tải lại"
              onPress={() => chat.retry()}
            />
          ) : null}
        </View>
      )}
      <ChatComposer
        roomName={room.name}
        replyTo={replyTo}
        attachments={attachments}
        onCancelReply={() => setReplyTo(null)}
        onTyping={() => chat.typed()}
        onSend={async (body, ids) => {
          const result = await chat.send(body, replyTo?.id ?? null, ids);
          if (result.ok) setReplyTo(null);
          return result;
        }}
      />
      {viewing ? (
        <MediaViewer
          files={viewing.files}
          start={viewing.index}
          caption={viewing.caption}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </View>
  );
}
