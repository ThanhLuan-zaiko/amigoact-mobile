import AuthShell from "@/components/AuthShell";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterScreen() {
  return (
    <AuthShell
      title="Tạo tài khoản"
      description="Tham gia cùng các tổ chức và tình nguyện viên trên AmigoACT."
    >
      <RegisterForm />
    </AuthShell>
  );
}
