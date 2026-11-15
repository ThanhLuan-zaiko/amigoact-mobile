import { type ActionResult, changed, failed } from "./actionResult";
import { numberOrNull } from "./activities";
import type { ApiResult } from "./api";
import type {
  ActivityHours,
  Appeal,
  AttendanceSession,
  CheckInResult,
  HourRule,
  MyHours,
  RosterEntry,
} from "./attendance";
import {
  type Bucket,
  type MyHourStats,
  type OrgHourStats,
  orgStatsPath,
  type RangeKey,
  statsPath,
} from "./hoursStats";
import { orgPath, read, send } from "./http";

// Ported from amigoact-fe src/lib/attendanceApi.ts and
// src/app/_actions/attendance.ts.

function activityPath(id: string): string {
  return `/activities/${encodeURIComponent(id)}`;
}

function sessionPath(id: string): string {
  return `/attendance-sessions/${encodeURIComponent(id)}`;
}

function recordPath(id: string): string {
  return `/attendance-records/${encodeURIComponent(id)}`;
}

export function getSessions(id: string): Promise<AttendanceSession[] | null> {
  return read(`${activityPath(id)}/attendance-sessions`);
}

export function getRoster(sessionId: string): Promise<RosterEntry[] | null> {
  return read(`${sessionPath(sessionId)}/roster`);
}

export function getAppeals(id: string): Promise<Appeal[] | null> {
  return read(`${activityPath(id)}/appeals`);
}

export function getActivityHours(id: string): Promise<ActivityHours[] | null> {
  return read(`${activityPath(id)}/hours`);
}

export function getMyHours(): Promise<MyHours | null> {
  return read("/hours/mine");
}

export function getMyHourStats(
  range: RangeKey,
  bucket: Bucket,
): Promise<MyHourStats | null> {
  return read(statsPath(range, bucket, new Date()));
}

export function getHourRule(slug: string): Promise<HourRule | null> {
  return read(`${orgPath(slug)}/hour-rule`);
}

export function getOrgHourStats(
  slug: string,
  range: RangeKey,
  bucket: Bucket,
): Promise<OrgHourStats | null> {
  return read(orgStatsPath(slug, range, bucket, new Date()));
}

// --- Actions -------------------------------------------------------------

function finish(result: ApiResult<unknown>, success?: string): ActionResult {
  if (!result.ok) return failed(result);
  return changed(success ? { success } : {});
}

export async function openSession(
  id: string,
  shiftId: string,
  minutes: string,
) {
  return finish(
    await send(`${activityPath(id)}/attendance-sessions`, "POST", {
      shift_id: shiftId || null,
      minutes: numberOrNull(minutes.trim()),
    }),
  );
}

export async function closeSession(id: string) {
  return finish(await send(`${sessionPath(id)}/close`));
}

export async function markAttended(sessionId: string, registrationId: string) {
  return finish(
    await send(`${sessionPath(sessionId)}/records`, "POST", {
      registration_id: registrationId,
    }),
  );
}

export async function verifyRecord(id: string) {
  return finish(await send(`${recordPath(id)}/verify`));
}

export async function deleteRecord(id: string) {
  return finish(await send(recordPath(id), "DELETE"));
}

// A scanned QR sends its token. The form sends what the volunteer typed.
export async function checkIn(
  input: { token: string } | { code: string },
): Promise<ActionResult> {
  const result = await send<CheckInResult>(
    "/attendance/check-in",
    "POST",
    input,
  );
  if (!result.ok) return failed(result);
  return changed({
    success:
      result.data.status === "accepted"
        ? `Đã điểm danh: ${result.data.activity_title}.`
        : `Đã gửi mã, chờ ban tổ chức xác nhận: ${result.data.activity_title}.`,
  });
}

export async function createAppeal(registrationId: string, reason: string) {
  return finish(
    await send(
      `/registrations/${encodeURIComponent(registrationId)}/appeals`,
      "POST",
      { reason: reason.trim() },
    ),
  );
}

export async function approveAppeal(id: string, registrationId: string) {
  return finish(
    await send(`/appeals/${encodeURIComponent(id)}/approve`, "POST", {
      registration_id: registrationId,
    }),
  );
}

export async function rejectAppeal(id: string) {
  return finish(await send(`/appeals/${encodeURIComponent(id)}/reject`));
}

export async function adjustHours(
  id: string,
  userId: string,
  deltaHours: string,
  reason: string,
) {
  return finish(
    await send(`${activityPath(id)}/hour-adjustments`, "POST", {
      user_id: userId,
      delta_hours: deltaHours.trim(),
      reason: reason.trim(),
    }),
  );
}

export async function setHourRule(
  slug: string,
  multiplier: string,
  capHours: string,
) {
  return finish(
    await send(`${orgPath(slug)}/hour-rule`, "PUT", {
      multiplier: multiplier.trim() || "1",
      cap_hours: capHours.trim() || null,
    }),
    "Đã lưu quy tắc tính giờ.",
  );
}
