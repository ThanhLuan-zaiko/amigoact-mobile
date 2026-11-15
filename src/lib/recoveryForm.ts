import type { FieldErrors, FormState } from "./account";
import type { ApiResult } from "./api";
import { failureState } from "./forms";
import { emailError } from "./loginForm";

// The same text as the web action. It says nothing about whether the email
// has an account, so the screen cannot be used to find out who is registered.
export const FORGOT_SUCCESS =
  "Nếu email này đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu trong ít phút.";

export function validateForgot(email: string): FieldErrors {
  const problem = emailError(email);
  return problem ? { email: problem } : {};
}

// What the form shows after the request: the neutral success text, or the
// translated error. A success also clears the field (see ForgotPasswordForm).
export function forgotState(result: ApiResult<unknown>): FormState {
  if (result.ok) return { success: FORGOT_SUCCESS };
  return failureState(result.code, result.issues);
}
