import { useRef, useState } from "react";
import { View } from "react-native";
import type { FormState } from "@/lib/account";
import { auth } from "@/lib/client";
import { failureState } from "@/lib/forms";
import {
  EMPTY_REGISTER,
  registerPayload,
  validateRegister,
} from "@/lib/registerForm";
import { PASSWORD_HINT } from "@/lib/validation";
import AccountTypeField from "./AccountTypeField";
import { useAuth } from "./AuthProvider";
import AuthSwitch from "./AuthSwitch";
import {
  type Focusable,
  FormMessage,
  PasswordField,
  RequiredLegend,
  SubmitButton,
  TextField,
} from "./FormParts";

// The native counterpart of the web RegisterForm. Typed input stays when the
// server rejects it. A successful sign-up signs the person in at once.
export default function RegisterForm() {
  const { signIn } = useAuth();
  const [values, setValues] = useState(EMPTY_REGISTER);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [state, setState] = useState<FormState>({});
  const [pending, setPending] = useState(false);
  const inputs = useRef<Record<string, Focusable | null>>({});
  const errors = state.fieldErrors;
  const business = values.accountType === "business";

  // The keyboard's next key walks through the fields that are on screen.
  const order = [
    "full_name",
    "email",
    "phone",
    ...(business ? ["company_name", "tax_code"] : []),
    "password",
    "confirm_password",
  ];
  const next = (name: string) => () =>
    inputs.current[order[order.indexOf(name) + 1] ?? ""]?.focus();
  const ref = (name: string) => (input: Focusable | null) => {
    inputs.current[name] = input;
  };
  const set = (key: keyof typeof values) => (value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  async function submit() {
    if (pending) return;
    const found = validateRegister(values);
    if (Object.keys(found).length > 0) {
      setState({ fieldErrors: found });
      return;
    }
    setState({});
    setPending(true);
    const result = await auth.register(registerPayload(values));
    if (result.ok) {
      signIn(result.data.user);
      return;
    }
    setState(failureState(result.code, result.issues));
    setPending(false);
  }

  return (
    <View className="gap-4">
      <AccountTypeField
        value={values.accountType}
        onChange={(accountType) =>
          setValues((previous) => ({ ...previous, accountType }))
        }
      />
      <TextField
        label="Họ và tên"
        value={values.fullName}
        onChangeText={set("fullName")}
        error={errors?.full_name}
        autoComplete="name"
        autoCapitalize="words"
        maxLength={120}
        required
        returnKeyType="next"
        onSubmitEditing={next("full_name")}
        inputRef={ref("full_name")}
      />
      <TextField
        label="Email"
        value={values.email}
        onChangeText={set("email")}
        error={errors?.email}
        autoComplete="email"
        keyboardType="email-address"
        required
        returnKeyType="next"
        onSubmitEditing={next("email")}
        inputRef={ref("email")}
      />
      <TextField
        label="Số điện thoại (không bắt buộc)"
        value={values.phone}
        onChangeText={set("phone")}
        error={errors?.phone}
        autoComplete="tel"
        keyboardType="phone-pad"
        returnKeyType="next"
        onSubmitEditing={next("phone")}
        inputRef={ref("phone")}
      />
      {business ? (
        <>
          <TextField
            label="Tên đơn vị"
            value={values.companyName}
            onChangeText={set("companyName")}
            error={errors?.company_name}
            autoComplete="organization"
            autoCapitalize="words"
            required
            returnKeyType="next"
            onSubmitEditing={next("company_name")}
            inputRef={ref("company_name")}
          />
          <TextField
            label="Mã số thuế"
            value={values.taxCode}
            onChangeText={set("taxCode")}
            error={errors?.tax_code}
            keyboardType="number-pad"
            required
            returnKeyType="next"
            onSubmitEditing={next("tax_code")}
            inputRef={ref("tax_code")}
          />
        </>
      ) : null}
      <PasswordField
        label="Mật khẩu"
        value={values.password}
        onChangeText={set("password")}
        error={errors?.password}
        hint={PASSWORD_HINT}
        autoComplete="new-password"
        maxLength={128}
        returnKeyType="next"
        onSubmitEditing={next("password")}
        inputRef={ref("password")}
        visible={passwordVisible}
        onToggle={() => setPasswordVisible((visible) => !visible)}
      />
      <PasswordField
        label="Nhập lại mật khẩu"
        value={values.confirmPassword}
        onChangeText={set("confirmPassword")}
        error={errors?.confirm_password}
        autoComplete="new-password"
        maxLength={128}
        returnKeyType="done"
        onSubmitEditing={submit}
        inputRef={ref("confirm_password")}
        visible={passwordVisible}
        onToggle={() => setPasswordVisible((visible) => !visible)}
      />
      <FormMessage state={state} />
      <RequiredLegend />
      <SubmitButton pending={pending} icon="user-plus" onPress={submit}>
        Tạo tài khoản
      </SubmitButton>
      <AuthSwitch
        question="Đã có tài khoản?"
        action="Đăng nhập"
        href="/login"
      />
    </View>
  );
}
