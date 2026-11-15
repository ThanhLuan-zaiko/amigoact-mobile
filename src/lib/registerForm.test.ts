import { describe, expect, test } from "bun:test";
import {
  EMPTY_REGISTER,
  type RegisterValues,
  registerPayload,
  validateRegister,
} from "./registerForm";
import { FIELD_MESSAGES, passwordProblem } from "./validation";

const valid: RegisterValues = {
  ...EMPTY_REGISTER,
  fullName: "Nguyen Van A",
  email: "a@b.vn",
  password: "Str0ng!pass",
  confirmPassword: "Str0ng!pass",
};

describe("validateRegister", () => {
  test("accepts a complete individual account", () => {
    expect(validateRegister(valid)).toEqual({});
  });

  test("empty form asks for the required fields only", () => {
    expect(validateRegister(EMPTY_REGISTER)).toEqual({
      full_name: FIELD_MESSAGES.required,
      email: FIELD_MESSAGES.required,
      password: FIELD_MESSAGES.required,
      confirm_password: FIELD_MESSAGES.required,
    });
  });

  test("phone is optional but must be valid when typed", () => {
    expect(validateRegister({ ...valid, phone: "" })).toEqual({});
    expect(validateRegister({ ...valid, phone: "0912345678" })).toEqual({});
    expect(validateRegister({ ...valid, phone: "12" })).toEqual({
      phone: FIELD_MESSAGES.phone,
    });
  });

  test("a weak password names what is missing", () => {
    const result = validateRegister({
      ...valid,
      password: "abc",
      confirmPassword: "abc",
    });
    expect(result.password).toBe(passwordProblem("abc") ?? "");
    expect(result.password).toContain("ít nhất 8 ký tự");
  });

  test("the confirmation must match, and is not trimmed", () => {
    expect(
      validateRegister({ ...valid, confirmPassword: "Str0ng!pass " }),
    ).toEqual({ confirm_password: FIELD_MESSAGES.mismatch });
  });

  test("business accounts need a company name and a valid tax code", () => {
    const business = { ...valid, accountType: "business" as const };
    expect(validateRegister(business)).toEqual({
      company_name: FIELD_MESSAGES.required,
      tax_code: FIELD_MESSAGES.required,
    });
    expect(
      validateRegister({ ...business, companyName: "ACME", taxCode: "123" }),
    ).toEqual({ tax_code: FIELD_MESSAGES.taxCode });
    expect(
      validateRegister({
        ...business,
        companyName: "ACME",
        taxCode: "0123456789",
      }),
    ).toEqual({});
  });

  test("business fields are ignored for an individual", () => {
    expect(validateRegister({ ...valid, taxCode: "bad" })).toEqual({});
  });
});

describe("registerPayload", () => {
  test("trims text, keeps the password exact, nulls empty optionals", () => {
    expect(
      registerPayload({
        ...valid,
        fullName: "  Nguyen Van A ",
        email: " a@b.vn ",
        password: " Str0ng!pass ",
      }),
    ).toEqual({
      email: "a@b.vn",
      password: " Str0ng!pass ",
      full_name: "Nguyen Van A",
      phone: null,
      account_type: "individual",
      company_name: null,
      tax_code: null,
    });
  });

  test("regression: business fields are not sent for an individual", () => {
    const body = registerPayload({
      ...valid,
      companyName: "ACME",
      taxCode: "0123456789",
    });
    expect(body.company_name).toBeNull();
    expect(body.tax_code).toBeNull();
  });

  test("business fields are sent for a business", () => {
    const body = registerPayload({
      ...valid,
      accountType: "business",
      phone: " 0912345678 ",
      companyName: " ACME ",
      taxCode: " 0123456789 ",
    });
    expect(body).toMatchObject({
      account_type: "business",
      phone: "0912345678",
      company_name: "ACME",
      tax_code: "0123456789",
    });
  });
});
