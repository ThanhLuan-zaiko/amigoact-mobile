import { router } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";
import type { ActivityDetail } from "@/lib/activities";
import { invalidate } from "@/lib/refreshBus";
import Button from "../common/Button";
import EmptyState, { LoadError, Loading } from "../common/States";
import RequireUser from "../RequireUser";
import Page from "../shell/Page";
import { useActivity } from "./useActivity";

export function ActivityNotFound() {
  return (
    <View className="items-start gap-4">
      <View className="w-full">
        <EmptyState
          title="Không tìm thấy hoạt động"
          description="Hoạt động này không tồn tại hoặc chưa được đăng."
        />
      </View>
      <Button
        variant="secondary"
        icon="compass"
        onPress={() => router.navigate("/explore")}
      >
        Khám phá
      </Button>
    </View>
  );
}

// The frame of every manager sub-screen of an activity (edit, registrations,
// attendance, hours, appeals): signed in, loaded, found.
export default function ActivityScreen({
  children,
}: {
  children: (activity: ActivityDetail, id: string) => ReactNode;
}) {
  return (
    <RequireUser>{() => <ActivityFrame>{children}</ActivityFrame>}</RequireUser>
  );
}

function ActivityFrame({
  children,
}: {
  children: (activity: ActivityDetail, id: string) => ReactNode;
}) {
  const activity = useActivity();
  return (
    <Page
      refreshing={activity.refreshing}
      onRefresh={() => {
        invalidate();
        activity.reload(true);
      }}
    >
      {activity.loading ? (
        <Loading />
      ) : activity.found === undefined ? (
        <LoadError>Không tải được hoạt động. Vui lòng thử lại.</LoadError>
      ) : activity.found === null ? (
        <ActivityNotFound />
      ) : (
        children(activity.found, activity.id)
      )}
    </Page>
  );
}
