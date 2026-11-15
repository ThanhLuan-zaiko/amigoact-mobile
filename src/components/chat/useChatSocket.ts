import { type ChatFrame, readFrame } from "@/lib/chatEvents";
import { ME, orgTopic, roomTopic } from "@/lib/realtime";
import {
  useRealtimeOpen,
  useRealtimeStatus,
  useTopics,
} from "../realtime/hooks";

export type SocketStatus = "connecting" | "live" | "offline";

// The messenger's view of the app's one realtime socket, ported from the web
// useChatSocket: every conversation as a topic, plus each organization and
// the viewer's own topic for changes to the list.
export function useChatSocket({
  orgIds,
  roomIds,
  onFrame,
  onOpen,
  onRoomsChanged,
}: {
  orgIds: string[];
  roomIds: string[];
  onFrame: (frame: ChatFrame) => void;
  onOpen: () => void;
  onRoomsChanged: () => void;
}): SocketStatus {
  const status = useRealtimeStatus();
  useTopics(roomIds.map(roomTopic), ({ data }) => {
    if (data.type === "resync") {
      onOpen();
      return;
    }
    const frame = readFrame(data);
    if (frame) onFrame(frame);
  });
  useTopics([...orgIds.map(orgTopic), ME], ({ data }) => {
    if (data.type === "resync" || data.type === "rooms.changed")
      onRoomsChanged();
  });
  useRealtimeOpen(() => onOpen());
  return status === "idle" ? "connecting" : status;
}
