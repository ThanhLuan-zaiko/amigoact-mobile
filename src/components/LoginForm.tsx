import { useRef, useState } from "react";
import { View } from "react-native";
import type { FormState } from "@/lib/account";
import { auth } from "@/lib/client";
import { failureState } from "@/lib/forms";
import { validateLogin } from "@/lib/loginForm";
import AuthLink from "./AuthLink";
import { useAuth } from "./AuthProvider";
import AuthSwitch from "./AuthSwitch";
import {
  type Focusable,
  FormMessage,
  PasswordField,
  SubmitButton,
  TextField,
} from "./FormParts";

// The native counterpart of the web LoginForm. The typed input stays when the
// server rejects it, and a field error is shown under the field.
export default function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // One switch for the form, so every password field shows or hides together.
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [state, setState] = useState<FormState>({});
  const [pending, setPending] = useState(false);
  const passwordInput = useRef<Focusable | null>(null);

  async function submit() {
    if (pending) return;
    const errors = validateLogin(email, password);
    if (Object.keys(errors).length > 0) {
      setState({ fieldErrors: errors });
      return;
    }
    setState({});
    setPending(true);
    const result = await auth.login(email.trim(), password);
    if (result.ok) {
      signIn(result.data.user);
      return;
    }
    setState(failureState(result.code, result.issues));
    setPending(false);
  }

  return (
    <View className="gap-4">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={state.fieldErrors?.email}
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <PasswordField
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        error={state.fieldErrors?.password}
        autoComplete="current-password"
        returnKeyType="done"
        onSubmitEditing={submit}
        inputRef={(input) => {
          passwordInput.current = input;
        }}
        visible={passwordVisible}
        onToggle={() => setPasswordVisible((visible) => !visible)}
      />
      <AuthLink href="/forgot-password">Quên mật khẩu?</AuthLink>
      <FormMessage state={state} />
      <SubmitButton pending={pending} icon="log-in" onPress={submit}>
        Đăng nhập
      </SubmitButton>
      <AuthSwitch
        question="Chưa có tài khoản?"
        action="Đăng ký"
        href="/register"
      />
    </View>
  );
}
