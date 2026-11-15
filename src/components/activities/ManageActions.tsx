import { router } from "expo-router";
import { View } from "react-native";
import type { ActivityDetail } from "@/lib/activities";
import {
  cancelActivity,
  completeActivity,
  deleteActivity,
  publishActivity,
} from "@/lib/activityActions";
import ActionButton from "../common/ActionButton";
import ActionTextButton from "../common/ActionTextButton";
import { IconButton } from "../common/Button";

// The manager's controls on an activity, ported from the web ManageActions.
export default function ManageActions({
  activity,
}: {
  activity: ActivityDetail;
}) {
  const { id, status } = activity;
  const editable = status === "draft" || status === "published";
  const go = (path: string) => () =>
    router.push(`/activities/${id}${path}` as never);
  return (
    <View className="flex-row flex-wrap items-start gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
      {status === "draft" ? (
        <ActionTextButton
          action={() => publishActivity(id)}
          icon="send"
          label="Đăng hoạt động"
        >
          Đăng
        </ActionTextButton>
      ) : null}
      {editable ? (
        <IconButton icon="edit-2" label="Sửa" onPress={go("/edit")} />
      ) : null}
      {status !== "draft" ? (
        <IconButton
          icon="users"
          label="Người đăng ký"
          onPress={go("/registrations")}
        />
      ) : null}
      {status === "published" || status === "completed" ? (
        <>
          <IconButton
            icon="grid"
            extra="qrcode"
            label="Điểm danh"
            onPress={go("/attendance")}
          />
          <IconButton icon="flag" label="Khiếu nại" onPress={go("/appeals")} />
        </>
      ) : null}
      {status === "completed" ? (
        <IconButton
          icon="clock"
          label="Giờ tình nguyện"
          onPress={go("/hours")}
        />
      ) : null}
      {status === "published" ? (
        <>
          <ActionButton
            action={() => completeActivity(id)}
            icon="check-square"
            label="Kết thúc hoạt động"
            confirmLabel="Kết thúc và ghi giờ?"
          />
          <ActionButton
            action={() => cancelActivity(id)}
            icon="slash"
            label="Hủy hoạt động"
            confirmLabel="Hủy hoạt động và mọi đăng ký?"
          />
        </>
      ) : null}
      {status === "draft" ? (
        <ActionButton
          action={() => deleteActivity(id, activity.organization_slug)}
          icon="trash-2"
          label="Xóa bản nháp"
          confirmLabel="Xóa bản nháp?"
        />
      ) : null}
    </View>
  );
}
