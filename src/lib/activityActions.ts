import { type ActionResult, changed, failed } from "./actionResult";
import {
  type ActivityDetail,
  fromLocalInput,
  numberOrNull,
} from "./activities";
import type { ApiResult } from "./api";
import { failureState } from "./forms";
import { orgPath, send } from "./http";
import { parseTags } from "./posts";

// Ported from amigoact-fe src/app/_actions/activities.ts.

function activityPath(id: string): string {
  return `/activities/${encodeURIComponent(id)}`;
}

function registrationPath(id: string): string {
  return `/registrations/${encodeURIComponent(id)}`;
}

function finish(result: ApiResult<unknown>): ActionResult {
  return result.ok ? changed({}) : failed(result);
}

// The form values as the web inputs hold them: text, plus the two boxes.
export type ActivityValues = {
  title: string;
  description: string;
  location: string;
  address: string;
  city: string;
  is_remote: boolean;
  start_at: string;
  end_at: string;
  registration_deadline: string;
  max_participants: string;
  hours_awarded: string;
  requires_approval: boolean;
  tags: string;
};

const orNull = (value: string) => value.trim() || null;

// Picked times are wall-clock times in the device zone (fromLocalInput with no
// zone), the zone the form's ZoneNote names. The web reads them in the zone the
// form carried in `time_zone`.
function activityBody(values: ActivityValues) {
  return {
    title: values.title.trim(),
    description: orNull(values.description),
    location: orNull(values.location),
    address: orNull(values.address),
    city: orNull(values.city),
    is_remote: values.is_remote,
    start_at: fromLocalInput(values.start_at),
    end_at: fromLocalInput(values.end_at),
    registration_deadline: fromLocalInput(values.registration_deadline),
    max_participants: numberOrNull(values.max_participants.trim()),
    hours_awarded: orNull(values.hours_awarded),
    requires_approval: values.requires_approval,
    tags: parseTags(values.tags.trim()),
  };
}

export async function createActivity(
  slug: string,
  values: ActivityValues,
  publishNow: boolean,
): Promise<ActionResult> {
  const body = activityBody(values);
  // Checked before creating, so a refused publish leaves no stray draft.
  if (publishNow && body.start_at && new Date(body.start_at) <= new Date()) {
    return failureState("validation_error", [
      { field: "start_at", type: "start_in_past" },
    ]);
  }
  const result = await send<ActivityDetail>(
    `${orgPath(slug)}/activities`,
    "POST",
    body,
  );
  if (!result.ok) return failed(result);
  if (publishNow) {
    // If this fails, the activity stays a draft and its screen offers publish.
    await send(`${activityPath(result.data.id)}/publish`);
  }
  return changed({ next: activityPath(result.data.id) });
}

export async function updateActivity(id: string, values: ActivityValues) {
  const result = await send(activityPath(id), "PATCH", activityBody(values));
  return result.ok ? changed({ success: "Đã lưu." }) : failed(result);
}

export async function publishActivity(id: string): Promise<ActionResult> {
  const result = await send(`${activityPath(id)}/publish`);
  if (!result.ok && result.issues.some((issue) => issue.type === "required")) {
    return { error: "Hãy nhập đủ thời gian và địa điểm trước khi đăng." };
  }
  return finish(result);
}

export async function completeActivity(id: string) {
  return finish(await send(`${activityPath(id)}/complete`));
}

export async function cancelActivity(id: string) {
  return finish(await send(`${activityPath(id)}/cancel`));
}

// Only drafts can be deleted, so the drafts list is where the manager was.
export async function deleteActivity(id: string, slug: string) {
  const result = await send(activityPath(id), "DELETE");
  if (!result.ok) return failed(result);
  return changed({
    next: `/org/${encodeURIComponent(slug)}/activities/drafts`,
  });
}

// A deleted draft comes back as a draft. Owners and admins may do it.
export async function restoreActivity(id: string) {
  const result = await send(`${activityPath(id)}/restore`);
  if (!result.ok) return failed(result);
  return changed({ success: "Đã khôi phục hoạt động về bản nháp." });
}

export async function purgeActivity(id: string) {
  const result = await send(`${activityPath(id)}/purge`, "DELETE");
  if (!result.ok) return failed(result);
  return changed({ success: "Đã xóa vĩnh viễn hoạt động." });
}

export type ShiftValues = {
  title: string;
  start_at: string;
  end_at: string;
  capacity: string;
};

function shiftBody(values: ShiftValues) {
  return {
    title: values.title.trim(),
    start_at: fromLocalInput(values.start_at),
    end_at: fromLocalInput(values.end_at),
    capacity: numberOrNull(values.capacity.trim()),
  };
}

export async function createShift(id: string, values: ShiftValues) {
  const result = await send(
    `${activityPath(id)}/shifts`,
    "POST",
    shiftBody(values),
  );
  return result.ok ? changed({ success: "Đã thêm ca." }) : failed(result);
}

export async function updateShift(
  id: string,
  shiftId: string,
  values: ShiftValues,
) {
  const result = await send(
    `${activityPath(id)}/shifts/${encodeURIComponent(shiftId)}`,
    "PUT",
    shiftBody(values),
  );
  return result.ok ? changed({ success: "Đã lưu ca." }) : failed(result);
}

export async function deleteShift(id: string, shiftId: string) {
  return finish(
    await send(
      `${activityPath(id)}/shifts/${encodeURIComponent(shiftId)}`,
      "DELETE",
    ),
  );
}

export async function registerForActivity(id: string, shiftId: string | null) {
  return finish(
    await send(`${activityPath(id)}/registrations`, "POST", {
      shift_id: shiftId,
    }),
  );
}

export async function cancelRegistration(id: string) {
  return finish(await send(registrationPath(id), "DELETE"));
}

export async function approveRegistration(id: string) {
  return finish(await send(`${registrationPath(id)}/approve`, "POST", {}));
}

export async function rejectRegistration(id: string) {
  return finish(await send(`${registrationPath(id)}/reject`, "POST", {}));
}
