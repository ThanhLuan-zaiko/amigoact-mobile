import type { FieldErrors } from "./account";
import { FIELD_MESSAGES } from "./validation";

// Close to what a browser accepts for type="email", which is the web check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The same checks as the web login form: both fields are required and the
// email must look like an email. The password is never trimmed or judged for
// strength here, because the backend decides who may sign in.
export function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmed = email.trim();
  if (!trimmed) errors.email = FIELD_MESSAGES.required;
  else if (!EMAIL.test(trimmed)) errors.email = FIELD_MESSAGES.email;
  if (!password) errors.password = FIELD_MESSAGES.required;
  return errors;
}
