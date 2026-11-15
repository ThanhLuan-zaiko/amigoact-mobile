import { useState } from "react";
import { View } from "react-native";
import type { FormState } from "@/lib/account";
import { auth } from "@/lib/client";
import { forgotState, validateForgot } from "@/lib/recoveryForm";
import AuthLink from "./AuthLink";
import { FormMessage, SubmitButton, TextField } from "./FormParts";

// The native counterpart of the web ForgotPasswordForm. The reset link is
// emailed and opens the web page, so this screen only asks for the email.
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({});
  const [pending, setPending] = useState(false);

  async function submit() {
    if (pending) return;
    const errors = validateForgot(email);
    if (Object.keys(errors).length > 0) {
      setState({ fieldErrors: errors });
      return;
    }
    setState({});
    setPending(true);
    const result = await auth.forgotPassword(email.trim());
    const next = forgotState(result);
    setState(next);
    // Like the web form, a sent request clears the field.
    if (next.success) setEmail("");
    setPending(false);
  }

  return (
    <View className="gap-4">
      <FormMessage state={state} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={state.fieldErrors?.email}
        autoComplete="email"
        keyboardType="email-address"
        required
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <SubmitButton pending={pending} icon="mail" onPress={submit}>
        Gửi liên kết
      </SubmitButton>
      <AuthLink href="/login">Quay lại đăng nhập</AuthLink>
    </View>
  );
}
