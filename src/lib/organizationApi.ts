import { auth } from "./client";
import { orgPath, read, readResult } from "./http";
import type {
  ApplicationPage,
  DeletedOrganization,
  GalleryItem,
  MemberPage,
  MyOrganization,
  OrganizationDetail,
  OrganizationPage,
} from "./organizations";
import { PAGE_SIZE } from "./pagination";
import type { RoleList } from "./roles";

// Ported from amigoact-fe src/lib/organizationApi.ts. Writes are in
// organizationActions.ts.

// Null when the organization is missing. Throws on other failures, so the
// screen shows its error state instead of "not found".
export async function getOrganization(
  slug: string,
): Promise<OrganizationDetail | null> {
  const result = await readResult<OrganizationDetail>(orgPath(slug));
  if (result.ok) return result.data;
  if (result.status === 404 || result.status === 422) return null;
  throw new Error(`Could not load the organization: ${result.code}`);
}

export function listOrganizations(
  search: string,
  offset: number,
  limit = PAGE_SIZE,
): Promise<OrganizationPage | null> {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (search) query.set("q", search);
  return read(`/organizations?${query}`);
}

// The directory without the viewer's own organizations.
export function listOtherOrganizations(
  search: string,
  offset: number,
): Promise<OrganizationPage | null> {
  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
    exclude_owned: "true",
  });
  if (search) query.set("q", search);
  return read(`/organizations?${query}`);
}

export async function getGallery(slug: string): Promise<GalleryItem[]> {
  return (await read<GalleryItem[]>(`${orgPath(slug)}/gallery`)) ?? [];
}

export async function getMyOrganizations(): Promise<MyOrganization[]> {
  if (!auth.accessToken()) return [];
  return (await read<MyOrganization[]>("/organizations/mine")) ?? [];
}

export async function getDeletedOrganizations(): Promise<
  DeletedOrganization[]
> {
  if (!auth.accessToken()) return [];
  return (
    (await read<DeletedOrganization[]>("/organizations/mine/deleted")) ?? []
  );
}

export function getMembers(
  slug: string,
  offset: number,
): Promise<MemberPage | null> {
  return read(`${orgPath(slug)}/members?limit=${PAGE_SIZE}&offset=${offset}`);
}

export function getApplications(
  slug: string,
  offset: number,
): Promise<ApplicationPage | null> {
  return read(
    `${orgPath(slug)}/applications?limit=${PAGE_SIZE}&offset=${offset}`,
  );
}

export function getRoles(slug: string): Promise<RoleList | null> {
  return read(`${orgPath(slug)}/roles`);
}
