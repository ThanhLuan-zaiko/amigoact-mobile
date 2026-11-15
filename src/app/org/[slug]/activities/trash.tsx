import { Text, View } from "react-native";
import ActionButton, { ConfirmAction } from "@/components/common/ActionButton";
import { MoreButton } from "@/components/common/PageLinks";
import EmptyState, {
  IconStat,
  LoadError,
  Loading,
} from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import RequireUser from "@/components/RequireUser";
import { mutedText, strongText } from "@/components/ui";
import { useCursorList } from "@/hooks/useCursorList";
import { formatDateTime } from "@/lib/activities";
import { purgeActivity, restoreActivity } from "@/lib/activityActions";
import { getActivityTrash } from "@/lib/activityApi";
import type { ActivityTrashItem } from "@/lib/activityList";
import type { OrganizationDetail } from "@/lib/organizations";
import { hasPermission } from "@/lib/roles";

// Restoring is safe, so it runs at once and the activity comes back as a
// draft. Removing for good needs the title typed again; only the owner sees it.
function ActivityTrashList({ items }: { items: ActivityTrashItem[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View
          key={item.id}
          className={`flex-row flex-wrap items-start gap-3 py-3 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
        >
          <View className="min-w-0 flex-1 basis-56 gap-1">
            <Text className={strongText}>{item.title}</Text>
            {item.start_at ? (
              <IconStat icon="calendar" label="Thời gian">
                {formatDateTime(item.start_at)}
              </IconStat>
            ) : null}
            <Text className={mutedText}>
              Xóa lúc {formatDateTime(item.deleted_at)} · Tự xóa vĩnh viễn vào{" "}
              {formatDateTime(item.purge_at)}
            </Text>
          </View>
          <View className="flex-row items-start gap-2">
            <ActionButton
              action={() => restoreActivity(item.id)}
              icon="rotate-ccw"
              label="Khôi phục"
            />
            {item.can_purge ? (
              <ConfirmAction
                action={() => purgeActivity(item.id)}
                label="Xóa vĩnh viễn"
                icon="trash-2"
                title="Xóa vĩnh viễn hoạt động?"
                confirmLabel="Xóa vĩnh viễn"
                typeToConfirm={item.title}
              >
                <Text className={mutedText}>
                  Bản nháp và các ca của nó sẽ bị xóa hẳn. Việc này không hoàn
                  tác được.
                </Text>
              </ConfirmAction>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function TrashContent({ organization }: { organization: OrganizationDetail }) {
  const slug = organization.slug;
  const allowed = hasPermission(organization.viewer, "activities.delete");
  const trash = useCursorList(
    async (before) => {
      if (!allowed) return { items: [], next: null };
      const page = await getActivityTrash(slug, before);
      return page ? { items: page.items, next: page.next_before } : null;
    },
    [slug, allowed],
  );
  if (!allowed) {
    return (
      <Text className={mutedText}>
        Chỉ ban quản trị mới xem được thùng rác.
      </Text>
    );
  }
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="font-body-semibold text-xl text-slate-900 dark:text-slate-100"
        >
          Thùng rác hoạt động
        </Text>
        <Text className={mutedText}>
          Hoạt động nháp đã xóa được giữ 30 ngày. Ban quản trị khôi phục được,
          chỉ chủ sở hữu xóa vĩnh viễn được.
        </Text>
      </View>
      {trash.loading ? (
        <Loading />
      ) : trash.failed ? (
        <LoadError>Không tải được thùng rác. Vui lòng thử lại.</LoadError>
      ) : trash.items.length === 0 ? (
        <EmptyState
          title="Thùng rác trống"
          description="Hoạt động nháp bị xóa sẽ nằm ở đây trong 30 ngày."
        />
      ) : (
        <ActivityTrashList items={trash.items} />
      )}
      <MoreButton
        visible={trash.hasMore && !trash.loadingMore}
        onPress={trash.loadMore}
      />
    </View>
  );
}

export default function ActivityTrashScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <TrashContent organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
