import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import ActivityScreen from "@/components/activities/ActivityScreen";
import ActionButton from "@/components/common/ActionButton";
import ActionTextButton from "@/components/common/ActionTextButton";
import Icon, { ExtraIcon } from "@/components/common/Icon";
import EmptyState, { IconStat, Loading } from "@/components/common/States";
import PersonRow from "@/components/organizations/PersonRow";
import BackTitle from "@/components/shell/BackTitle";
import {
  mutedText,
  panel,
  sectionTitle,
  smallMuted,
  tagChip,
  tagChipText,
} from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { formatDateTime } from "@/lib/activities";
import { param } from "@/lib/appPath";
import type { RosterEntry } from "@/lib/attendance";
import {
  deleteRecord,
  getRoster,
  markAttended,
  verifyRecord,
} from "@/lib/attendanceApi";

function RosterActions({
  sessionId,
  entry,
}: {
  sessionId: string;
  entry: RosterEntry;
}) {
  if (!entry.record_id) {
    return (
      <ActionButton
        action={() => markAttended(sessionId, entry.registration_id)}
        icon="user-check"
        label="Điểm danh hộ"
      />
    );
  }
  const recordId = entry.record_id;
  return (
    <View className="flex-row flex-wrap items-start gap-2">
      {entry.verified ? null : (
        <ActionTextButton
          action={() => verifyRecord(recordId)}
          icon="check"
          label="Xác nhận"
        >
          Xác nhận
        </ActionTextButton>
      )}
      <ActionButton
        action={() => deleteRecord(recordId)}
        icon="x"
        label={entry.verified ? "Bỏ điểm danh" : "Từ chối mã"}
        confirmLabel={entry.verified ? "Bỏ điểm danh?" : "Từ chối mã?"}
      />
    </View>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: "clock" | "check";
  children: string;
}) {
  return (
    <View className={`${tagChip} flex-row items-center gap-1`}>
      <Icon name={icon} size={12} tone="muted" />
      <Text className={tagChipText}>{children}</Text>
    </View>
  );
}

function Roster({
  sessionId,
  editable,
}: {
  sessionId: string;
  editable: boolean;
}) {
  const roster = useLoad(() => getRoster(sessionId), [sessionId]);
  if (roster.loading) return <Loading />;
  if (!roster.data)
    return <Text className={mutedText}>Chỉ ban quản trị mới xem được.</Text>;
  const list = roster.data;
  const present = list.filter((entry) => entry.verified).length;
  const pending = list.filter(
    (entry) => entry.record_id && !entry.verified,
  ).length;
  return (
    <>
      <View className={`${panel} gap-3 p-4`}>
        <Text accessibilityRole="header" className={sectionTitle}>
          Tổng quan
        </Text>
        <IconStat icon="users" label="Đã duyệt">
          {list.length}
        </IconStat>
        <IconStat icon="user-check" label="Có mặt">
          {present}
        </IconStat>
        <IconStat icon="clock" label="Chờ xác nhận">
          {pending}
        </IconStat>
      </View>
      {list.length === 0 ? (
        <EmptyState
          title="Chưa có người đăng ký được duyệt"
          description="Người đăng ký được duyệt sẽ hiện ở đây."
        />
      ) : (
        <View className={`${panel} px-4`}>
          {list.map((entry, index) => (
            <PersonRow
              key={entry.registration_id}
              name={entry.full_name}
              first={index === 0}
              details={
                entry.scanned_at ? (
                  <View
                    accessible
                    accessibilityLabel={`${entry.method === "qr" ? "Quét QR" : "Nhập tay"}: ${formatDateTime(entry.scanned_at)}`}
                    className="flex-row items-center gap-1.5"
                  >
                    {entry.method === "qr" ? (
                      <ExtraIcon name="qrcode" size={14} tone="subtle" />
                    ) : (
                      <Icon name="edit-3" size={14} tone="subtle" />
                    )}
                    <Text className={smallMuted}>
                      {formatDateTime(entry.scanned_at)}
                    </Text>
                  </View>
                ) : null
              }
              trailing={
                <View className="flex-row flex-wrap items-center gap-2">
                  {entry.record_id && !entry.verified ? (
                    <Chip icon="clock">Chờ xác nhận</Chip>
                  ) : null}
                  {entry.verified ? <Chip icon="check">Có mặt</Chip> : null}
                  {editable ? (
                    <RosterActions sessionId={sessionId} entry={entry} />
                  ) : null}
                </View>
              }
            />
          ))}
        </View>
      )}
    </>
  );
}

export default function RosterScreen() {
  const sessionId = param(
    useLocalSearchParams<{ sessionId?: string }>().sessionId,
  );
  return (
    <ActivityScreen>
      {(activity, id) => (
        <>
          <BackTitle href={`/activities/${id}/attendance`}>
            {activity.title}
          </BackTitle>
          <Roster
            sessionId={sessionId}
            editable={activity.status === "published"}
          />
        </>
      )}
    </ActivityScreen>
  );
}
