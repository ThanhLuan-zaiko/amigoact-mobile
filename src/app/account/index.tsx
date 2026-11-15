import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import AccountShell from "@/components/account/AccountShell";
import ProfileForm from "@/components/account/ProfileForm";
import Button from "@/components/common/Button";
import { FormMessage } from "@/components/FormParts";
import { mutedText, sectionTitle } from "@/components/ui";
import { resendVerification } from "@/lib/accountApi";
import type { ActionResult } from "@/lib/actionResult";

function ResendVerification() {
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  return (
    <View className="items-start gap-3">
      <FormMessage state={state} />
      <Button
        variant="secondary"
        icon="send"
        pending={pending}
        onPress={async () => {
          setPending(true);
          setState(await resendVerification());
          setPending(false);
        }}
      >
        Gửi lại liên kết
      </Button>
    </View>
  );
}

export default function AccountScreen() {
  const { signOut } = useAuth();
  return (
    <AccountShell>
      {(user) => (
        <>
          {user.email_verified_at ? null : (
            <View className="gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-800">
              <Text accessibilityRole="header" className={sectionTitle}>
                Email chưa được xác minh
              </Text>
              <Text className={mutedText}>
                Hãy mở liên kết đã gửi tới {user.email} để xác minh email.
              </Text>
              <ResendVerification />
            </View>
          )}
          <ProfileForm key={user.id} user={user} />
          <View className="items-start border-t border-slate-200 pt-6 dark:border-slate-800">
            <Button
              variant="secondary"
              icon="log-out"
              onPress={async () => {
                await signOut();
                router.replace("/");
              }}
            >
              Đăng xuất
            </Button>
          </View>
        </>
      )}
    </AccountShell>
  );
}
