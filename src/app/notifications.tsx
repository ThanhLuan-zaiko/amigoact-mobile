import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import Button, { IconButton } from "@/components/common/Button";
import { MoreButton } from "@/components/common/PageLinks";
import Segments from "@/components/common/Segments";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import NotificationRow from "@/components/notifications/NotificationRow";
import RequireUser from "@/components/RequireUser";
import { useLiveRefresh } from "@/components/realtime/hooks";
import Page, { PageTitle } from "@/components/shell/Page";
import { panel } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { appPath, param } from "@/lib/appPath";
import {
  getNotificationPage,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationApi";
import {
  describeNotification,
  type NotificationItem,
} from "@/lib/notifications";
import { NOTIFICATION_EVENTS } from "@/lib/notificationTypes";
import { ME } from "@/lib/realtime";

function NotificationsContent() {
  const unreadOnly =
    param(useLocalSearchParams<{ unread?: string }>().unread) === "1";
  const [pages, setPages] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(() => new Set());
  const [marking, setMarking] = useState(false);
  const first = useLoad(async () => {
    setPages([]);
    return getNotificationPage(0, unreadOnly);
  }, [unreadOnly]);
  const [next, setNext] = useState<number | null>(null);
  useLiveRefresh(ME, NOTIFICATION_EVENTS, () => first.reload());
  const offset = pages.length > 0 ? next : (first.data?.next_offset ?? null);
  const items = [...(first.data?.items ?? []), ...pages];

  async function loadMore() {
    if (offset == null) return;
    const page = await getNotificationPage(offset, unreadOnly);
    if (page) {
      setPages((current) => [...current, ...page.items]);
      setNext(page.next_offset ?? null);
    }
  }

  function choose(item: NotificationItem) {
    const href = describeNotification(item).href;
    if (!item.read && !readIds.has(item.id)) {
      setReadIds((current) => new Set(current).add(item.id));
      markNotificationRead(item.id).catch(() => {});
    }
    if (href) router.push(appPath(href) as never);
  }

  return (
    <Page refreshing={first.refreshing} onRefresh={() => first.reload(true)}>
      <PageTitle
        icon="bell"
        action={
          <IconButton
            icon="settings"
            label="Cài đặt thông báo"
            onPress={() => router.push("/account/notifications")}
          />
        }
      >
        Thông báo
      </PageTitle>
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <Segments
          items={[
            { value: "all", label: "Tất cả" },
            { value: "unread", label: "Chưa đọc" },
          ]}
          current={unreadOnly ? "unread" : "all"}
          onChange={(value) =>
            router.setParams({ unread: value === "unread" ? "1" : undefined })
          }
          label="Lọc thông báo"
        />
        <Button
          variant="secondary"
          icon="check-circle"
          pending={marking}
          disabled={!first.data || first.data.unread_count === 0}
          onPress={async () => {
            setMarking(true);
            await markAllNotificationsRead();
            setMarking(false);
            first.reload();
          }}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </View>
      {first.loading ? (
        <Loading />
      ) : first.data === null ? (
        <LoadError>Không tải được thông báo. Vui lòng thử lại.</LoadError>
      ) : items.length === 0 ? (
        <EmptyState
          title={unreadOnly ? "Bạn đã đọc hết thông báo" : "Chưa có thông báo"}
          description="Thông báo về đăng ký, tổ chức, giờ tình nguyện và chứng nhận sẽ hiện ở đây."
        />
      ) : (
        <View className={`${panel} overflow-hidden`}>
          {items.map((item, index) => (
            <View
              key={item.id}
              className={
                index > 0
                  ? "border-t border-slate-200 dark:border-slate-800"
                  : ""
              }
            >
              <NotificationRow
                item={readIds.has(item.id) ? { ...item, read: true } : item}
                onChoose={choose}
              />
            </View>
          ))}
        </View>
      )}
      <MoreButton visible={offset != null} onPress={loadMore}>
        Xem thông báo cũ hơn
      </MoreButton>
    </Page>
  );
}

export default function NotificationsScreen() {
  return <RequireUser>{() => <NotificationsContent />}</RequireUser>;
}
