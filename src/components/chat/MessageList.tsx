import { useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import {
  type ChatResult,
  type ChatRoom,
  continuesGroup,
  messageDay,
  messageRights,
} from "@/lib/chat";
import type { RoomCache } from "@/lib/chatEvents";
import { Chip, IconButton } from "../common/Button";
import { mutedText } from "../ui";
import MessageBubble, { type BubbleHandlers } from "./MessageBubble";

// Oldest at the top, newest at the bottom, with a chip for each new day,
// ported from the web MessageList. The list is inverted, so it opens at the
// newest message and stays there as messages arrive; reaching the top loads
// the next older page by itself.
export default function MessageList({
  room,
  cache,
  viewerId,
  onLoadOlder,
  ...handlers
}: BubbleHandlers & {
  room: ChatRoom;
  cache: RoomCache;
  viewerId: string;
  onLoadOlder: () => Promise<ChatResult> | null;
}) {
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [away, setAway] = useState(false);
  const { items } = cache;
  const group = room.kind !== "dm";
  // Newest first for the inverted list.
  const reversed = [...items].reverse();
  const listRef = useRef<FlatList>(null);

  async function loadOlder() {
    if (loadingOlder || !cache.nextBefore) return;
    const run = onLoadOlder();
    if (!run) return;
    setLoadingOlder(true);
    await run;
    setLoadingOlder(false);
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className={`text-center ${mutedText}`}>
          Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
        </Text>
      </View>
    );
  }

  return (
    <View className="relative flex-1">
      <FlatList
        ref={listRef}
        inverted
        data={reversed}
        keyExtractor={(message) => message.id}
        accessibilityLabel="Tin nhắn"
        contentContainerClassName="px-2 py-3"
        onEndReached={loadOlder}
        onEndReachedThreshold={0.2}
        onScroll={(event) => setAway(event.nativeEvent.contentOffset.y > 600)}
        scrollEventThrottle={100}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          cache.nextBefore ? (
            <View className="mb-3 items-center">
              <Chip icon="chevrons-up" onPress={loadOlder}>
                {loadingOlder ? "Đang tải…" : "Tin cũ hơn"}
              </Chip>
            </View>
          ) : undefined
        }
        renderItem={({ item: message, index }) => {
          // The previous message in time is the next one in the inverted list.
          const previous = reversed[index + 1];
          const day = messageDay(message.created_at);
          const newDay = !previous || messageDay(previous.created_at) !== day;
          return (
            <View>
              {newDay ? (
                <View className="my-3 items-center">
                  <View className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-800">
                    <Text className="font-body-medium text-xs text-slate-500 dark:text-slate-400">
                      {day}
                    </Text>
                  </View>
                </View>
              ) : null}
              <MessageBubble
                message={message}
                compact={!newDay && continuesGroup(previous, message)}
                mine={message.author_id === viewerId}
                group={group}
                rights={messageRights(message, room, viewerId)}
                {...handlers}
              />
            </View>
          );
        }}
      />
      {away ? (
        <IconButton
          icon="chevron-down"
          label="Xuống tin mới nhất"
          onPress={() =>
            listRef.current?.scrollToOffset({ offset: 0, animated: true })
          }
          className="absolute bottom-4 right-4 rounded-full bg-white dark:bg-slate-950"
        />
      ) : null}
    </View>
  );
}
