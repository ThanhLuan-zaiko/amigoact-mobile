import type {
  ActivityDetail,
  ActivityPage,
  ActivitySummary,
  MyRegistration,
  RegistrationPage,
} from "./activities";
import {
  type ActivityFilter,
  type ActivityTrashPage,
  backendStatus,
} from "./activityList";
import { auth } from "./client";
import { orgPath, read, readResult } from "./http";
import { PAGE_SIZE } from "./pagination";
import { linkableActivities } from "./postActivity";

// Ported from amigoact-fe src/lib/activityApi.ts. Writes are in
// activityActions.ts.

export async function getActivity(id: string): Promise<ActivityDetail | null> {
  const result = await readResult<ActivityDetail>(
    `/activities/${encodeURIComponent(id)}`,
  );
  if (result.ok) return result.data;
  if (result.status === 404 || result.status === 422) return null;
  throw new Error(`Could not load the activity: ${result.code}`);
}

export function listPublicActivities(
  search: string,
  city: string,
  offset: number,
  limit = PAGE_SIZE,
): Promise<ActivityPage | null> {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (search) query.set("q", search);
  if (city) query.set("city", city);
  return read(`/activities?${query}`);
}

// A tab of the list. Drafts are only for managers; others get null.
export function listOrganizationActivities(
  slug: string,
  offset: number,
  filter: ActivityFilter | "draft" = "all",
  tag: string | null = null,
): Promise<ActivityPage | null> {
  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  if (tag) query.set("tag", tag);
  const status = backendStatus(filter);
  if (status) query.set("status", status);
  return read(`${orgPath(slug)}/activities?${query}`);
}

export function getActivityTrash(
  slug: string,
  before: string | null,
): Promise<ActivityTrashPage | null> {
  const query = new URLSearchParams({ limit: "20" });
  if (before) query.set("before", before);
  return read(`${orgPath(slug)}/activity-trash?${query}`);
}

// Activities a post of this organization may point at, newest first.
export async function getLinkableActivities(
  slug: string,
): Promise<ActivitySummary[]> {
  const page = await read<ActivityPage>(
    `${orgPath(slug)}/activities?limit=100`,
  );
  return page ? linkableActivities(page.items) : [];
}

export async function getMyRegistrations(): Promise<MyRegistration[]> {
  if (!auth.accessToken()) return [];
  return (await read<MyRegistration[]>("/registrations/mine")) ?? [];
}

export function getActivityRegistrations(
  id: string,
  status: string,
  offset: number,
): Promise<RegistrationPage | null> {
  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  if (status) query.set("status", status);
  return read(`/activities/${encodeURIComponent(id)}/registrations?${query}`);
}
