import { router } from "expo-router";
import { type ReactNode, useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import AccountShell from "@/components/account/AccountShell";
import ActionButton from "@/components/common/ActionButton";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { Loading } from "@/components/common/States";
import { FormMessage, PasswordField } from "@/components/FormParts";
import { mutedText, panel, sectionTitle, strongText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { changePassword, getSessions, revokeSession } from "@/lib/accountApi";
import type { ActionResult } from "@/lib/actionResult";
import { describeDevice } from "@/lib/forms";
import { PASSWORD_HINT, passwordProblem } from "@/lib/validation";

const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className={`${panel} gap-4 p-4`}>
      <Text accessibilityRole="header" className={sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function ChangePasswordForm() {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  async function send() {
    const problem = passwordProblem(values.next);
    if (problem) {
      setState({ fieldErrors: { new_password: problem } });
      return;
    }
    setPending(true);
    const result = await changePassword(
      values.current,
      values.next,
      values.confirm,
    );
    setPending(false);
    setState(result);
    if (result.success) setValues({ current: "", next: "", confirm: "" });
  }
  const toggle = () => setVisible((shown) => !shown);
  return (
    <View className="gap-4">
      <FormMessage state={state} />
      <PasswordField
        label="Mật khẩu hiện tại"
        value={values.current}
        onChangeText={(current) => setValues((v) => ({ ...v, current }))}
        error={state.fieldErrors?.current_password}
        autoComplete="current-password"
        visible={visible}
        onToggle={toggle}
      />
      <PasswordField
        label="Mật khẩu mới"
        value={values.next}
        onChangeText={(next) => setValues((v) => ({ ...v, next }))}
        error={state.fieldErrors?.new_password}
        hint={PASSWORD_HINT}
        maxLength={128}
        autoComplete="new-password"
        visible={visible}
        onToggle={toggle}
      />
      <PasswordField
        label="Nhập lại mật khẩu mới"
        value={values.confirm}
        onChangeText={(confirm) => setValues((v) => ({ ...v, confirm }))}
        error={state.fieldErrors?.confirm_password}
        autoComplete="new-password"
        visible={visible}
        onToggle={toggle}
      />
      <View className="self-start">
        <Button icon="key" pending={pending} onPress={send}>
          Đổi mật khẩu
        </Button>
      </View>
    </View>
  );
}

function SessionList() {
  const { signOutEverywhere } = useAuth();
  const sessions = useLoad(() => getSessions(), []);
  if (sessions.loading) return <Loading />;
  return (
    <View className="gap-4">
      {(sessions.data ?? []).map((session, index) => (
        <View
          key={session.session_id}
          className={`flex-row items-center justify-between gap-3 py-3 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
        >
          <View className="min-w-0 flex-1 flex-row items-start gap-3">
            <View className="mt-1">
              <Icon name="monitor" />
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className={strongText}>
                  {describeDevice(session.user_agent)}
                </Text>
                {session.is_current ? (
                  <View className="rounded-sm border border-slate-200 px-1.5 py-0.5 dark:border-slate-800">
                    <Text className="font-body-semibold text-xs text-slate-700 dark:text-slate-300">
                      Thiết bị này
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className={mutedText}>
                {session.ip ?? "Không rõ IP"} ·{" "}
                {dateFormat.format(
                  new Date(session.last_seen_at ?? session.created_at),
                )}
              </Text>
            </View>
          </View>
          {session.is_current ? null : (
            <ActionButton
              action={() => revokeSession(session.session_id)}
              icon="x-circle"
              label="Đăng xuất thiết bị này"
            />
          )}
        </View>
      ))}
      <View className="self-start">
        <Button
          variant="secondary"
          icon="log-out"
          onPress={async () => {
            await signOutEverywhere();
            router.replace("/login");
          }}
        >
          Đăng xuất mọi thiết bị
        </Button>
      </View>
    </View>
  );
}

export default function SecurityScreen() {
  return (
    <AccountShell>
      {() => (
        <>
          <Section title="Đổi mật khẩu">
            <ChangePasswordForm />
          </Section>
          <Section title="Thiết bị đang đăng nhập">
            <SessionList />
          </Section>
        </>
      )}
    </AccountShell>
  );
}
