import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";

export default function LoginScreen() {
  return (
    <AuthShell title="Đăng nhập" description="Chào mừng bạn quay lại AmigoACT.">
      <LoginForm />
    </AuthShell>
  );
}
