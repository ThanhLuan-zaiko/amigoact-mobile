import type { FieldErrors } from "./account";
import { FIELD_MESSAGES, validateField } from "./validation";

// The checks the web useAccountForm runs on every named input before a form
// is sent: an empty required field gets the "required" message, and every
// filled field gets the shared rule for its name. The backend checks again.
export function checkFields(
  values: Record<string, string>,
  required: readonly string[] = [],
): FieldErrors {
  const errors: FieldErrors = {};
  for (const [name, value] of Object.entries(values)) {
    if (required.includes(name) && !value.trim()) {
      errors[name] = FIELD_MESSAGES.required;
      continue;
    }
    const problem = validateField(name, value, { isNewPassword: false });
    if (problem) errors[name] = problem;
  }
  return errors;
}
