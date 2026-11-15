import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import ChatList from "@/components/chat/ChatList";
import Conversation from "@/components/chat/Conversation";
import { useChatSocket } from "@/components/chat/useChatSocket";
import { useInterval } from "@/components/chat/useInterval";
import {
  type MessengerOptions,
  useMessenger,
} from "@/components/chat/useMessenger";
import { LoadError, Loading } from "@/components/common/States";
import RequireUser from "@/components/RequireUser";
import Page from "@/components/shell/Page";
import { useLoad } from "@/hooks/useLoad";
import { param } from "@/lib/appPath";
import { isRoomId, POLL_INTERVAL_MS } from "@/lib/chat";
import { loadInbox, loadMessages } from "@/lib/chatApi";

// The messenger at phone width, as on the web: the list, or the open
// conversation. Polling covers the time the socket is down.
function Messenger(options: MessengerOptions) {
  const chat = useMessenger(options);
  const orgIds = [...new Set(chat.rooms.map((room) => room.org.id))];
  const status = useChatSocket({
    orgIds,
    roomIds: chat.rooms.map((room) => room.room_id),
    onFrame: chat.handleFrame,
    onOpen: chat.handleOpen,
    onRoomsChanged: chat.refreshInbox,
  });
  useInterval(chat.poll, status === "live" ? null : POLL_INTERVAL_MS);
  return (
    <View className="flex-1 gap-2 p-2">
      {chat.notice ? (
        <Text className="rounded-md bg-sky-50 px-3 py-2 font-body text-sm text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
          {chat.notice}
        </Text>
      ) : null}
      <View className="flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        {chat.room ? (
          <Conversation
            key={chat.room.room_id}
            chat={chat}
            viewerId={options.viewerId}
            status={status}
          />
        ) : (
          <ChatList
            rooms={chat.rooms}
            typing={chat.typing}
            activeId={null}
            viewerId={options.viewerId}
            onSelect={chat.selectRoom}
            onOpenDm={chat.openDm}
          />
        )}
      </View>
    </View>
  );
}

// Every conversation of the viewer in one messenger. "?room=<id>" opens one.
function MessengerScreen({ viewerId }: { viewerId: string }) {
  const room = param(useLocalSearchParams<{ room?: string }>().room);
  // Loaded once; afterwards the messenger keeps itself current over the socket.
  const start = useLoad(async () => {
    const inbox = await loadInbox();
    if (!inbox.ok) return null;
    const wanted = isRoomId(room)
      ? (inbox.data.find((item) => item.room_id === room) ?? null)
      : null;
    const page = wanted ? await loadMessages(wanted.room_id, null) : null;
    return {
      rooms: inbox.data,
      initialRoomId: wanted?.room_id ?? null,
      initialPage: page?.ok ? page.data : null,
    };
  }, []);
  return (
    <Page scroll={false}>
      {start.loading ? (
        <View className="p-4">
          <Loading />
        </View>
      ) : !start.data ? (
        <View className="p-4">
          <LoadError>Không tải được tin nhắn. Vui lòng thử lại.</LoadError>
        </View>
      ) : (
        <Messenger viewerId={viewerId} {...start.data} />
      )}
    </Page>
  );
}

export default function MessagesScreen() {
  return (
    <RequireUser>
      {(user) => <MessengerScreen viewerId={user.id} />}
    </RequireUser>
  );
}
