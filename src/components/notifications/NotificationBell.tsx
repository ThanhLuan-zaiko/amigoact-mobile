import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { appPath } from "@/lib/appPath";
import { badgeText } from "@/lib/chat";
import {
  getUnreadCount,
  loadNotificationList,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationApi";
import {
  applyNotificationFrame,
  type BellState,
  describeNotification,
  type NotificationItem,
  readNotificationFrame,
} from "@/lib/notifications";
import { ME } from "@/lib/realtime";
import { IconButton } from "../common/Button";
import Sheet from "../common/Sheet";
import { Loading } from "../common/States";
import { useRealtimeOpen, useTopics } from "../realtime/hooks";
import { mutedText } from "../ui";
import NotificationRow from "./NotificationRow";

// The bell in the header, ported from the web NotificationBell. New
// notifications arrive on the viewer's own realtime topic at once.
export default function NotificationBell() {
  const [state, setState] = useState<BellState>({ items: null, unread: 0 });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const page = await loadNotificationList();
    if (!mounted.current) return;
    if (page) setState({ items: page.items, unread: page.unread_count });
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    getUnreadCount().then((count) => {
      if (count && mounted.current) {
        setState((current) => ({ ...current, unread: count.count }));
      }
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  useTopics([ME], ({ data }) => {
    const frame = readNotificationFrame(data);
    if (!frame) {
      // A resync means an event was too large to forward; fetch again.
      if ((data as { type?: unknown }).type === "resync") refresh();
      return;
    }
    setState((current) => applyNotificationFrame(current, frame));
    if (frame.kind === "created" && !frame.item.read) {
      AccessibilityInfo.announceForAccessibility(
        `Thông báo mới: ${describeNotification(frame.item).text}`,
      );
    }
  });
  // After a reconnect, catch up on what arrived while offline.
  useRealtimeOpen((first) => {
    if (!first) refresh();
  });

  function toggle() {
    setOpen(true);
    refresh();
  }

  function choose(item: NotificationItem) {
    const href = describeNotification(item).href;
    if (!item.read) {
      setState((current) =>
        applyNotificationFrame(current, { kind: "read", id: item.id }),
      );
      markNotificationRead(item.id).catch(() => {});
    }
    setOpen(false);
    if (href) router.push(appPath(href) as never);
  }

  function readAll() {
    setState((current) =>
      applyNotificationFrame(current, { kind: "read_all" }),
    );
    markAllNotificationsRead().catch(() => {});
  }

  const label =
    state.unread > 0 ? `Thông báo, ${state.unread} chưa đọc` : "Thông báo";

  return (
    <>
      <IconButton
        icon="bell"
        label={label}
        onPress={toggle}
        active={state.unread > 0}
      >
        {state.unread > 0 ? (
          <View className="absolute -right-1.5 -top-1.5 h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-teal-700 px-1 dark:border-slate-950 dark:bg-teal-400">
            <Text className="font-body-semibold text-[10px] text-white dark:text-teal-950">
              {badgeText(state.unread)}
            </Text>
          </View>
        ) : null}
      </IconButton>
      <Sheet
        open={open}
        title="Thông báo"
        onClose={() => setOpen(false)}
        scroll={false}
        footer={
          <View className="flex-row items-center justify-between gap-2">
            <Pressable
              onPress={() => {
                setOpen(false);
                router.push("/notifications");
              }}
              accessibilityRole="link"
              className="min-h-11 justify-center"
            >
              <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
                Xem tất cả
              </Text>
            </Pressable>
            <IconButton
              icon="check-circle"
              label="Đánh dấu tất cả đã đọc"
              onPress={readAll}
              disabled={state.unread === 0}
            />
          </View>
        }
      >
        <BellList items={state.items} loading={loading} onChoose={choose} />
      </Sheet>
    </>
  );
}

function BellList({
  items,
  loading,
  onChoose,
}: {
  items: NotificationItem[] | null;
  loading: boolean;
  onChoose: (item: NotificationItem) => void;
}) {
  if (items === null) {
    return (
      <View className="items-center px-4 py-6">
        <Loading />
      </View>
    );
  }
  if (items.length === 0) {
    return (
      <Text className={`px-4 py-6 text-center ${mutedText}`}>
        {loading ? "Đang tải…" : "Chưa có thông báo nào"}
      </Text>
    );
  }
  return (
    <View className="shrink">
      <NotificationScroll items={items} onChoose={onChoose} />
    </View>
  );
}

function NotificationScroll({
  items,
  onChoose,
}: {
  items: NotificationItem[];
  onChoose: (item: NotificationItem) => void;
}) {
  // A FlatList inside the sheet, so a long list scrolls without lag.
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <NotificationRow item={item} onChoose={onChoose} />
      )}
      ItemSeparatorComponent={() => (
        <View className="h-px bg-slate-200 dark:bg-slate-800" />
      )}
    />
  );
}
