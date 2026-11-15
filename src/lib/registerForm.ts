import type { FieldErrors } from "./account";
import { emailError } from "./loginForm";
import { FIELD_MESSAGES, passwordProblem, validateField } from "./validation";

export type AccountType = "individual" | "business";

export type RegisterValues = {
  accountType: AccountType;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  taxCode: string;
  password: string;
  confirmPassword: string;
};

export const EMPTY_REGISTER: RegisterValues = {
  accountType: "individual",
  fullName: "",
  email: "",
  phone: "",
  companyName: "",
  taxCode: "",
  password: "",
  confirmPassword: "",
};

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "individual", label: "Cá nhân" },
  { value: "business", label: "Tổ chức, doanh nghiệp" },
];

// Field names are the backend names, so a server error lands on the right field.
// The checks match the web form: required first, then the shape of the value.
// The backend repeats them and stays the authority.
export function validateRegister(values: RegisterValues): FieldErrors {
  const errors: FieldErrors = {};
  const required = FIELD_MESSAGES.required;
  const noContext = { isNewPassword: false };

  if (!values.fullName.trim()) errors.full_name = required;

  const email = emailError(values.email);
  if (email) errors.email = email;

  const phone = validateField("phone", values.phone, noContext);
  if (phone) errors.phone = phone;

  if (values.accountType === "business") {
    if (!values.companyName.trim()) errors.company_name = required;
    if (!values.taxCode.trim()) errors.tax_code = required;
    else {
      const taxCode = validateField("tax_code", values.taxCode, noContext);
      if (taxCode) errors.tax_code = taxCode;
    }
  }

  if (!values.password) errors.password = required;
  else {
    const problem = passwordProblem(values.password);
    if (problem) errors.password = problem;
  }

  if (!values.confirmPassword) errors.confirm_password = required;
  else if (values.confirmPassword !== values.password) {
    errors.confirm_password = FIELD_MESSAGES.mismatch;
  }
  return errors;
}

// The body of POST /auth/register, as the web action builds it: text is
// trimmed, the password is not, and the business fields are sent only for a
// business account.
export function registerPayload(values: RegisterValues) {
  const business = values.accountType === "business";
  return {
    email: values.email.trim(),
    password: values.password,
    full_name: values.fullName.trim(),
    phone: values.phone.trim() || null,
    account_type: values.accountType,
    company_name: business ? values.companyName.trim() || null : null,
    tax_code: business ? values.taxCode.trim() || null : null,
  };
}
