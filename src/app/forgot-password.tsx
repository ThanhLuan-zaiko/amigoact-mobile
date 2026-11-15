import AuthShell from "@/components/AuthShell";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export default function ForgotPasswordScreen() {
  return (
    <AuthShell
      title="Quên mật khẩu"
      description="Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
