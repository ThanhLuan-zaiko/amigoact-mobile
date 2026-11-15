import { useRef, useState } from "react";
import { View } from "react-native";
import type { FormState } from "@/lib/account";
import { auth } from "@/lib/client";
import { resetState, validateReset } from "@/lib/recoveryForm";
import { PASSWORD_HINT } from "@/lib/validation";
import AuthLink from "./AuthLink";
import { useAuth } from "./AuthProvider";
import {
  type Focusable,
  FormMessage,
  PasswordField,
  SubmitButton,
} from "./FormParts";

// The native counterpart of the web ResetPasswordForm. `token` comes from the
// emailed link and is never shown or logged.
export default function ResetPasswordForm({ token }: { token: string }) {
  const { status, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<FormState>({});
  const [pending, setPending] = useState(false);
  const confirmInput = useRef<Focusable | null>(null);

  async function submit() {
    if (pending) return;
    const errors = validateReset(password, confirm);
    if (Object.keys(errors).length > 0) {
      setState({ fieldErrors: errors });
      return;
    }
    setState({});
    setPending(true);
    const result = await auth.resetPassword(token, password);
    const next = resetState(result);
    setState(next);
    if (result.ok && status === "signedIn") {
      // The server ends every session on a reset, this device's included, so
      // the stored tokens are dead. Clear them instead of waiting for a 401.
      await signOut();
    }
    setPending(false);
  }

  if (state.success) {
    return (
      <View className="gap-4">
        <FormMessage state={state} />
        <AuthLink href="/login">Đăng nhập</AuthLink>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <FormMessage state={state} />
      <PasswordField
        label="Mật khẩu mới"
        value={password}
        onChangeText={setPassword}
        error={state.fieldErrors?.new_password}
        hint={PASSWORD_HINT}
        autoComplete="new-password"
        maxLength={128}
        returnKeyType="next"
        onSubmitEditing={() => confirmInput.current?.focus()}
        visible={visible}
        onToggle={() => setVisible((value) => !value)}
      />
      <PasswordField
        label="Nhập lại mật khẩu mới"
        value={confirm}
        onChangeText={setConfirm}
        error={state.fieldErrors?.confirm_password}
        autoComplete="new-password"
        maxLength={128}
        returnKeyType="done"
        onSubmitEditing={submit}
        inputRef={(input) => {
          confirmInput.current = input;
        }}
        visible={visible}
        onToggle={() => setVisible((value) => !value)}
      />
      <SubmitButton pending={pending} icon="key" onPress={submit}>
        Đặt lại mật khẩu
      </SubmitButton>
    </View>
  );
}
