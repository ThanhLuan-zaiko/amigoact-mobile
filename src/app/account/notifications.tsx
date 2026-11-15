import { useState } from "react";
import { Text, View } from "react-native";
import AccountShell from "@/components/account/AccountShell";
import Button from "@/components/common/Button";
import { LoadError, Loading } from "@/components/common/States";
import { FormMessage } from "@/components/FormParts";
import { CheckRow } from "@/components/forms/Fields";
import { panel, sectionTitle } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import type { ActionResult } from "@/lib/actionResult";
import { failed } from "@/lib/actionResult";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/notificationApi";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
  type NotificationPreferences,
} from "@/lib/notificationTypes";

// Each notification type is received unless it is unticked here.
function PreferencesForm({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  const [inapp, setInapp] = useState(preferences.inapp);
  const [email, setEmail] = useState(preferences.email);
  const [receive, setReceive] = useState(
    () =>
      new Set(
        NOTIFICATION_TYPES.filter(
          (type) => !preferences.muted_types.includes(type),
        ),
      ),
  );
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  async function save() {
    setPending(true);
    const result = await saveNotificationPreferences(inapp, email, [
      ...receive,
    ]);
    setPending(false);
    setState(
      result.ok ? { success: "Đã lưu cài đặt thông báo." } : failed(result),
    );
  }
  return (
    <View className={`${panel} gap-6 p-4`}>
      <FormMessage state={state} />
      <View className="gap-3">
        <Text accessibilityRole="header" className={sectionTitle}>
          Kênh nhận
        </Text>
        <CheckRow
          label="Hiện trong chuông thông báo"
          checked={inapp}
          onChange={setInapp}
        />
        <CheckRow
          label="Gửi email"
          hint="Chỉ gửi tới địa chỉ email đã xác minh."
          checked={email}
          onChange={setEmail}
        />
      </View>
      <View className="gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <Text accessibilityRole="header" className={sectionTitle}>
          Loại thông báo
        </Text>
        {NOTIFICATION_TYPES.map((type) => (
          <CheckRow
            key={type}
            label={NOTIFICATION_TYPE_LABELS[type]}
            checked={receive.has(type)}
            onChange={(on) => {
              const next = new Set(receive);
              if (on) next.add(type);
              else next.delete(type);
              setReceive(next);
            }}
          />
        ))}
      </View>
      <View className="self-start">
        <Button icon="save" pending={pending} onPress={save}>
          Lưu cài đặt
        </Button>
      </View>
    </View>
  );
}

function PreferencesContent() {
  const preferences = useLoad(() => getNotificationPreferences(), []);
  if (preferences.loading) return <Loading />;
  if (!preferences.data) {
    return <LoadError>Không tải được cài đặt. Vui lòng thử lại.</LoadError>;
  }
  return <PreferencesForm preferences={preferences.data} />;
}

export default function NotificationPreferencesScreen() {
  return <AccountShell>{() => <PreferencesContent />}</AccountShell>;
}
