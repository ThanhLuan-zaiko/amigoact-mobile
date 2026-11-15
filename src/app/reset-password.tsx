import { useLocalSearchParams } from "expo-router";
import AuthLink from "@/components/AuthLink";
import AuthShell from "@/components/AuthShell";
import { FormMessage } from "@/components/FormParts";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { tokenFromParam } from "@/lib/deepLink";
import { LINK_INVALID } from "@/lib/recoveryForm";

// Opened by the link in the reset email: amigoact://reset-password?token=...
// The screen sits outside the signed-in and signed-out groups, so it opens in
// both states, like the web page.
export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const value = tokenFromParam(token);
  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Sau khi đặt lại, mọi thiết bị đang đăng nhập sẽ bị đăng xuất."
    >
      {value ? (
        <ResetPasswordForm token={value} />
      ) : (
        <>
          <FormMessage state={{ error: LINK_INVALID }} />
          <AuthLink href="/forgot-password">Gửi lại liên kết</AuthLink>
        </>
      )}
    </AuthShell>
  );
}
