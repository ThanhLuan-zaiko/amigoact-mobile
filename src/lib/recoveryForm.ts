import type { FieldErrors, FormState } from "./account";
import type { ApiResult } from "./api";
import { failureState } from "./forms";
import { emailError } from "./loginForm";
import { FIELD_MESSAGES, passwordProblem } from "./validation";

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

export const RESET_SUCCESS = "Đã đặt lại mật khẩu. Bạn có thể đăng nhập ngay.";

export const LINK_INVALID = "Liên kết không hợp lệ hoặc đã hết hạn.";

// The same checks as the web reset form: the new password follows the password
// rules and the confirmation must match. Nothing is trimmed.
export function validateReset(
  newPassword: string,
  confirmPassword: string,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!newPassword) errors.new_password = FIELD_MESSAGES.required;
  else {
    const problem = passwordProblem(newPassword);
    if (problem) errors.new_password = problem;
  }
  if (!confirmPassword) errors.confirm_password = FIELD_MESSAGES.required;
  else if (confirmPassword !== newPassword) {
    errors.confirm_password = FIELD_MESSAGES.mismatch;
  }
  return errors;
}

export function resetState(result: ApiResult<unknown>): FormState {
  if (result.ok) return { success: RESET_SUCCESS };
  return failureState(result.code, result.issues);
}
