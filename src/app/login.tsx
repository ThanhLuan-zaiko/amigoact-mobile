import { Redirect, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/components/AuthProvider";
import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";
import { safeNextPath } from "@/lib/forms";

// A signed-in viewer goes straight to where the login was meant to lead.
export default function LoginScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { user } = useAuth();
  const nextPath = safeNextPath(next);
  if (user) return <Redirect href={nextPath as never} />;
  return (
    <AuthShell title="Đăng nhập" description="Chào mừng bạn quay lại AmigoACT.">
      <LoginForm next={nextPath} />
    </AuthShell>
  );
}
