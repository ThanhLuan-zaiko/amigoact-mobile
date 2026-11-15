import { describe, expect, test } from "bun:test";
import { validateLogin } from "./loginForm";
import { FIELD_MESSAGES } from "./validation";

describe("validateLogin", () => {
  test("accepts an email and a password", () => {
    expect(validateLogin("a@b.vn", "x")).toEqual({});
    expect(validateLogin("  a@b.vn  ", "x")).toEqual({});
  });

  test("both fields are required", () => {
    expect(validateLogin("", "")).toEqual({
      email: FIELD_MESSAGES.required,
      password: FIELD_MESSAGES.required,
    });
    expect(validateLogin("   ", "x")).toEqual({
      email: FIELD_MESSAGES.required,
    });
  });

  test("refuses text that is not an email", () => {
    for (const email of ["abc", "a@b", "a b@c.vn", "@b.vn"]) {
      expect(validateLogin(email, "x")).toEqual({
        email: FIELD_MESSAGES.email,
      });
    }
  });

  test("a password of spaces still counts as typed", () => {
    expect(validateLogin("a@b.vn", "   ")).toEqual({});
  });
});
