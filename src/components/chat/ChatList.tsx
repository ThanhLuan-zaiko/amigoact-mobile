import { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { badgeText, type ChatResult, type ChatRoom } from "@/lib/chat";
import {
  filterRooms,
  INBOX_FILTERS,
  type InboxFilter,
  listTime,
  previewLine,
  totalUnread,
} from "@/lib/messenger";
import { type TypingMap, typingText } from "@/lib/typing";
import { IconButton } from "../common/Button";
import Icon from "../common/Icon";
import Segments from "../common/Segments";
import { inputField, mutedText } from "../ui";
import ChatAvatar from "./ChatAvatar";
import NewChatDialog from "./NewChatDialog";

function ChatListRow({
  room,
  typing,
  active,
  viewerId,
  onSelect,
}: {
  room: ChatRoom;
  typing: string | null;
  active: boolean;
  viewerId: string;
  onSelect: (roomId: string) => void;
}) {
  const unread = room.unread > 0;
  const channel =
    room.kind === "channel" ? (room.restricted ? "restricted" : "open") : null;
  return (
    <Pressable
      onPress={() => onSelect(room.room_id)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${room.name}${unread ? `, ${room.unread} chưa đọc` : ""}`}
      className={`flex-row items-center gap-3 rounded-lg border px-3 py-2.5 ${
        active
          ? "border-teal-700 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/40"
          : "border-transparent active:bg-slate-50 dark:active:bg-slate-900/60"
      }`}
    >
      <ChatAvatar name={room.name} url={room.avatar_url} channel={channel} />
      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row items-baseline gap-2">
          <Text
            numberOfLines={1}
            className={`min-w-0 flex-1 text-sm text-slate-900 dark:text-slate-100 ${unread ? "font-body-semibold" : "font-body-medium"}`}
          >
            {room.name}
            {room.kind !== "org" ? (
              <Text className="font-body text-slate-500 dark:text-slate-400">
                {" "}
                · {room.org.name}
              </Text>
            ) : null}
          </Text>
          {room.last_message ? (
            <Text
              className={`text-xs ${unread ? "font-body-semibold text-teal-700 dark:text-teal-400" : "font-body text-slate-500 dark:text-slate-400"}`}
            >
              {listTime(room.last_message.created_at)}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className={`min-w-0 flex-1 font-body text-sm ${
              typing
                ? "text-teal-700 dark:text-teal-400"
                : unread
                  ? "text-slate-800 dark:text-slate-200"
                  : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {typing ?? previewLine(room, viewerId)}
          </Text>
          {unread ? (
            <View className="min-w-5 items-center justify-center rounded-full bg-teal-700 px-1.5 py-0.5 dark:bg-teal-400">
              <Text className="font-body-semibold text-xs text-white dark:text-teal-950">
                {badgeText(room.unread)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// Search, filters, and every conversation, newest activity first.
export default function ChatList({
  rooms,
  typing,
  activeId,
  viewerId,
  onSelect,
  onOpenDm,
}: {
  rooms: ChatRoom[];
  typing: TypingMap;
  activeId: string | null;
  viewerId: string;
  onSelect: (roomId: string) => void;
  onOpenDm: (slug: string, userId: string) => Promise<ChatResult>;
}) {
  const theme = useThemeColors();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [composing, setComposing] = useState(false);
  const shown = filterRooms(rooms, filter, query);
  const unread = totalUnread(rooms);

  return (
    <View className="flex-1">
      <View className="gap-3 border-b border-slate-200 p-3 dark:border-slate-800">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <Icon name="message-circle" />
            <Text
              accessibilityRole="header"
              className="font-body-semibold text-lg text-slate-900 dark:text-slate-100"
            >
              Tin nhắn
            </Text>
          </View>
          <IconButton
            icon="edit"
            label="Tin nhắn mới"
            onPress={() => setComposing(true)}
          />
        </View>
        <View className="justify-center">
          <View className="absolute left-3 z-10">
            <Icon name="search" tone="subtle" />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Tìm cuộc trò chuyện"
            placeholder="Tìm kiếm"
            placeholderTextColor={theme.subtle}
            className={`${inputField} pl-9 pr-11`}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Xóa tìm kiếm"
              className="absolute right-0 h-11 w-11 items-center justify-center"
            >
              <Icon name="x" tone="subtle" />
            </Pressable>
          ) : null}
        </View>
        <Segments
          items={INBOX_FILTERS.map((item) => ({
            value: item.value,
            label:
              item.value === "unread" && unread > 0
                ? `${item.label} (${unread})`
                : item.label,
          }))}
          current={filter}
          onChange={setFilter}
          label="Lọc cuộc trò chuyện"
        />
      </View>
      {shown.length === 0 ? (
        <Text className={`p-6 text-center ${mutedText}`}>
          {rooms.length === 0
            ? "Tham gia một tổ chức để bắt đầu trò chuyện."
            : "Không có cuộc trò chuyện phù hợp."}
        </Text>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(room) => room.room_id}
          contentContainerClassName="gap-0.5 p-2"
          renderItem={({ item }) => (
            <ChatListRow
              room={item}
              typing={typingText(typing[item.room_id], item.kind)}
              active={item.room_id === activeId}
              viewerId={viewerId}
              onSelect={onSelect}
            />
          )}
        />
      )}
      <NewChatDialog
        open={composing}
        onClose={() => setComposing(false)}
        onPick={async (slug, userId) => {
          const result = await onOpenDm(slug, userId);
          if (result.ok) setComposing(false);
          return result;
        }}
      />
    </View>
  );
}
