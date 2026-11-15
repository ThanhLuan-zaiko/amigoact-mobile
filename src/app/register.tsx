import { Redirect } from "expo-router";
import { useAuth } from "@/components/AuthProvider";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterScreen() {
  const { user } = useAuth();
  if (user) return <Redirect href="/" />;
  return (
    <AuthShell
      title="Tạo tài khoản"
      description="Tham gia cùng các tổ chức và tình nguyện viên trên AmigoACT."
    >
      <RegisterForm />
    </AuthShell>
  );
}
