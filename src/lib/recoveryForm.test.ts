import { describe, expect, test } from "bun:test";
import {
  FORGOT_SUCCESS,
  forgotState,
  RESET_SUCCESS,
  resetState,
  validateForgot,
  validateReset,
} from "./recoveryForm";
import { FIELD_MESSAGES } from "./validation";

describe("validateForgot", () => {
  test("accepts an email, trimmed", () => {
    expect(validateForgot("a@b.vn")).toEqual({});
    expect(validateForgot("  a@b.vn ")).toEqual({});
  });

  test("an empty or malformed email is refused", () => {
    expect(validateForgot("")).toEqual({ email: FIELD_MESSAGES.required });
    expect(validateForgot("abc")).toEqual({ email: FIELD_MESSAGES.email });
  });
});

describe("forgotState", () => {
  test("success gives the neutral message", () => {
    expect(forgotState({ ok: true, data: null })).toEqual({
      success: FORGOT_SUCCESS,
    });
  });

  test("regression: the text never confirms or denies an account", () => {
    expect(FORGOT_SUCCESS.startsWith("Nếu email này đã đăng ký")).toBe(true);
  });

  test("a rate limit becomes a translated error", () => {
    const state = forgotState({
      ok: false,
      status: 429,
      code: "rate_limited",
      issues: [],
    });
    expect(state.error).toContain("quá nhiều lần");
    expect(state.success).toBeUndefined();
  });

  test("a network failure is translated", () => {
    const state = forgotState({
      ok: false,
      status: 0,
      code: "network_error",
      issues: [],
    });
    expect(state.error).toBe("Không kết nối được máy chủ. Vui lòng thử lại.");
  });

  test("a field problem from the server lands on the field", () => {
    const state = forgotState({
      ok: false,
      status: 422,
      code: "validation_error",
      issues: [{ field: "email", type: "missing" }],
    });
    expect(state.fieldErrors?.email).toBe(FIELD_MESSAGES.required);
  });
});

describe("validateReset", () => {
  test("accepts a strong matching password", () => {
    expect(validateReset("Str0ng!pass", "Str0ng!pass")).toEqual({});
  });

  test("both fields are required", () => {
    expect(validateReset("", "")).toEqual({
      new_password: FIELD_MESSAGES.required,
      confirm_password: FIELD_MESSAGES.required,
    });
  });

  test("a weak password names what is missing", () => {
    const result = validateReset("abc", "abc");
    expect(result.new_password).toContain("ít nhất 8 ký tự");
    expect(result.confirm_password).toBeUndefined();
  });

  test("the confirmation must match exactly", () => {
    expect(validateReset("Str0ng!pass", "Str0ng!pass ")).toEqual({
      confirm_password: FIELD_MESSAGES.mismatch,
    });
  });
});

describe("resetState", () => {
  test("success says the password was reset", () => {
    expect(resetState({ ok: true, data: null })).toEqual({
      success: RESET_SUCCESS,
    });
  });

  test("an expired link becomes the translated error", () => {
    const state = resetState({
      ok: false,
      status: 400,
      code: "invalid_or_expired_token",
      issues: [],
    });
    expect(state.error).toBe("Liên kết không hợp lệ hoặc đã hết hạn.");
  });

  test("a weak password from the server lands on the field", () => {
    const state = resetState({
      ok: false,
      status: 422,
      code: "validation_error",
      issues: [{ field: "new_password", type: "password_common" }],
    });
    expect(state.fieldErrors?.new_password).toContain("quá phổ biến");
  });
});
