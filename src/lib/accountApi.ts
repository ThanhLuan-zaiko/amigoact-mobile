import type { SessionInfo, User } from "./account";
import { type ActionResult, changed, failed } from "./actionResult";
import { api } from "./client";
import { failureState } from "./forms";
import { read, send } from "./http";
import { FIELD_MESSAGES } from "./validation";

// Ported from amigoact-fe src/app/_actions/account.ts and the account reads in
// src/lib/auth.ts.

export async function getSessions(): Promise<SessionInfo[]> {
  return (await read<SessionInfo[]>("/auth/sessions")) ?? [];
}

export type ProfileValues = {
  full_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  company_name: string;
  tax_code: string;
  legal_rep_name: string;
  legal_rep_id: string;
  legal_rep_position: string;
};

const orNull = (value: string) => value.trim() || null;

export async function updateProfile(
  user: User,
  values: ProfileValues,
): Promise<ActionResult> {
  const business =
    user.account_type === "business"
      ? {
          company_name: orNull(values.company_name),
          tax_code: orNull(values.tax_code),
          legal_rep_name: orNull(values.legal_rep_name),
          legal_rep_id: orNull(values.legal_rep_id),
          legal_rep_position: orNull(values.legal_rep_position),
        }
      : {};
  const result = await send("/account/me", "PATCH", {
    full_name: values.full_name.trim(),
    phone: orNull(values.phone),
    date_of_birth: orNull(values.date_of_birth),
    gender: orNull(values.gender),
    address: orNull(values.address),
    ...business,
  });
  if (!result.ok) return failed(result);
  return changed({ success: "Đã lưu thông tin tài khoản." });
}

export async function changePassword(
  current: string,
  next: string,
  confirm: string,
): Promise<ActionResult> {
  if (next !== confirm) {
    return { fieldErrors: { confirm_password: FIELD_MESSAGES.mismatch } };
  }
  const result = await send("/auth/password/change", "POST", {
    current_password: current,
    new_password: next,
  });
  if (!result.ok) return failed(result);
  return changed({
    success: "Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.",
  });
}

export async function resendVerification(): Promise<ActionResult> {
  const result = await send("/auth/email/resend");
  if (!result.ok) return failed(result);
  return { success: "Đã gửi lại liên kết xác minh tới email của bạn." };
}

export async function revokeSession(sessionId: string): Promise<ActionResult> {
  const result = await send(
    `/auth/sessions/${encodeURIComponent(sessionId)}`,
    "DELETE",
  );
  return result.ok ? changed({}) : failed(result);
}

// Opened from the emailed link; works signed in or not.
export async function verifyEmail(token: string): Promise<ActionResult> {
  const result = await api.request("/auth/email/verify", { body: { token } });
  if (!result.ok) return failureState(result.code, result.issues);
  return changed({ success: "Email của bạn đã được xác minh." });
}
