import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/common/Button";
import { FormMessage } from "@/components/FormParts";
import { verifyEmail } from "@/lib/accountApi";
import type { ActionResult } from "@/lib/actionResult";
import { tokenFromParam } from "@/lib/deepLink";

// Opened by the link in the verification email (amigoact://verify-email?token=...).
// The tap confirms it, so a link preview never verifies an address.
export default function VerifyEmailScreen() {
  const token = tokenFromParam(
    useLocalSearchParams<{ token?: string }>().token,
  );
  const { refreshUser } = useAuth();
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  return (
    <AuthShell
      title="Xác minh email"
      description="Bấm nút bên dưới để xác nhận địa chỉ email của bạn."
    >
      {token ? (
        <View className="gap-4">
          <FormMessage state={state} />
          {state.success ? (
            <View className="self-start">
              <Button
                variant="secondary"
                icon="check"
                onPress={() => router.replace("/account")}
              >
                Tới tài khoản
              </Button>
            </View>
          ) : (
            <Button
              icon="check-circle"
              pending={pending}
              onPress={async () => {
                setPending(true);
                const result = await verifyEmail(token);
                setPending(false);
                setState(result);
                if (result.success) refreshUser();
              }}
            >
              Xác minh email
            </Button>
          )}
        </View>
      ) : (
        <FormMessage
          state={{ error: "Liên kết không hợp lệ hoặc đã hết hạn." }}
        />
      )}
    </AuthShell>
  );
}
