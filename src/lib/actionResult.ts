import type { FormState } from "./account";
import type { ApiResult } from "./api";
import { failureState } from "./forms";
import { invalidate } from "./refreshBus";

// What a mobile action returns: the web FormState, plus the screen to open
// next where the web Server Action calls redirect().
export type ActionResult = FormState & { next?: string };

export function failed(result: ApiResult<unknown>): ActionResult {
  return result.ok ? {} : failureState(result.code, result.issues);
}

// Reloads mounted screens after a change, then returns the given state.
export function changed(state: ActionResult): ActionResult {
  invalidate();
  return state;
}

// The first message of a failed action, for a button that shows one line.
export function firstError(state: FormState): string | undefined {
  return state.error ?? Object.values(state.fieldErrors ?? {})[0];
}
