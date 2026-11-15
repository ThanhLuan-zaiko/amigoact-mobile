import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import ActivityScreen from "@/components/activities/ActivityScreen";
import SessionQr from "@/components/attendance/SessionQr";
import ActionButton from "@/components/common/ActionButton";
import Button, { IconButton } from "@/components/common/Button";
import SelectMenu from "@/components/common/SelectMenu";
import EmptyState, { IconStat, Loading } from "@/components/common/States";
import { FormMessage } from "@/components/FormParts";
import BackTitle from "@/components/shell/BackTitle";
import { mutedText, panel, strongText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import type { ActionResult } from "@/lib/actionResult";
import { formatDateTime, type Shift } from "@/lib/activities";
import { type AttendanceSession, SESSION_MINUTES } from "@/lib/attendance";
import { closeSession, getSessions, openSession } from "@/lib/attendanceApi";
import { sessionQrUrl } from "@/lib/checkInLink";

const APP_URL = process.env.EXPO_PUBLIC_APP_URL;

function OpenSessionForm({
  activityId,
  shifts,
}: {
  activityId: string;
  shifts: Shift[];
}) {
  const [shiftId, setShiftId] = useState(shifts[0]?.id ?? "");
  const [minutes, setMinutes] = useState("120");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  return (
    <View className={`${panel} gap-3 p-4`}>
      <FormMessage state={state} />
      {shifts.length > 0 ? (
        <SelectMenu
          label="Ca"
          value={shiftId}
          onChange={setShiftId}
          options={shifts.map((shift) => ({
            value: shift.id,
            label: shift.title ?? "",
          }))}
        />
      ) : null}
      <SelectMenu
        label="Thời lượng"
        value={minutes}
        onChange={setMinutes}
        options={SESSION_MINUTES.map((value) => ({
          value: String(value),
          label: `${value} phút`,
        }))}
      />
      <View className="self-start">
        <Button
          extra="qrcode"
          pending={pending}
          onPress={async () => {
            setPending(true);
            setState(await openSession(activityId, shiftId, minutes));
            setPending(false);
          }}
        >
          Mở điểm danh
        </Button>
      </View>
    </View>
  );
}

function SessionCard({
  activityId,
  session,
}: {
  activityId: string;
  session: AttendanceSession;
}) {
  return (
    <View className={`${panel} flex-row flex-wrap items-start gap-4 p-4`}>
      {session.is_open && session.qr_token ? (
        <SessionQr url={sessionQrUrl(APP_URL, session.qr_token)} />
      ) : null}
      <View className="min-w-0 flex-1 basis-48 gap-2">
        {session.shift_title ? (
          <Text className={strongText}>{session.shift_title}</Text>
        ) : null}
        {session.manual_code ? (
          <Text
            selectable
            accessibilityLabel={`Mã nhập tay: ${session.manual_code}`}
            className="font-mono text-3xl tracking-widest text-slate-900 dark:text-slate-100"
          >
            {session.manual_code}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
          <IconStat icon="clock" label="Đóng lúc">
            {formatDateTime(session.closes_at)}
          </IconStat>
          <IconStat icon="check-circle" label="Đã điểm danh">
            {session.checked_in_count}
          </IconStat>
          {session.pending_count > 0 ? (
            <IconStat icon="list" label="Mã nhập tay chờ xác nhận">
              {session.pending_count}
            </IconStat>
          ) : null}
        </View>
        <View className="flex-row flex-wrap items-start gap-2">
          <IconButton
            icon="list"
            label="Danh sách điểm danh"
            onPress={() =>
              router.push(
                `/activities/${activityId}/attendance/${session.id}` as never,
              )
            }
          />
          {session.is_open ? (
            <ActionButton
              action={() => closeSession(session.id)}
              icon="lock"
              label="Đóng phiên"
              confirmLabel="Đóng phiên này?"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Sessions({ id }: { id: string }) {
  const sessions = useLoad(() => getSessions(id), [id]);
  if (sessions.loading) return <Loading />;
  if (!sessions.data)
    return <Text className={mutedText}>Chỉ ban quản trị mới xem được.</Text>;
  if (sessions.data.length === 0) {
    return (
      <EmptyState
        title="Chưa có phiên điểm danh"
        description="Mở phiên để có mã QR và mã nhập tay."
      />
    );
  }
  return (
    <View className="gap-3">
      {sessions.data.map((session) => (
        <SessionCard key={session.id} activityId={id} session={session} />
      ))}
    </View>
  );
}

export default function AttendanceScreen() {
  return (
    <ActivityScreen>
      {(activity, id) => (
        <>
          <BackTitle href={`/activities/${id}`}>{activity.title}</BackTitle>
          {activity.status === "published" ? (
            <OpenSessionForm activityId={id} shifts={activity.shifts} />
          ) : null}
          <Sessions id={id} />
        </>
      )}
    </ActivityScreen>
  );
}
