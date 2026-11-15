import type { FieldErrors } from "./account";
import { FIELD_MESSAGES } from "./validation";

// Close to what a browser accepts for type="email", which is the web check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The message for a bad email, or undefined when it is fine. An empty email is
// "required", anything else must look like an email. The text is trimmed first,
// as the web form trims it before sending.
export function emailError(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return FIELD_MESSAGES.required;
  return EMAIL.test(trimmed) ? undefined : FIELD_MESSAGES.email;
}

// The same checks as the web login form: both fields are required and the
// email must look like an email. The password is never trimmed or judged for
// strength here, because the backend decides who may sign in.
export function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const emailProblem = emailError(email);
  if (emailProblem) errors.email = emailProblem;
  if (!password) errors.password = FIELD_MESSAGES.required;
  return errors;
}
