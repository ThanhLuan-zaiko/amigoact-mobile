import type { ActionResult } from "./actionResult";
import { changed, failed } from "./actionResult";
import type { Focus } from "./focus";
import { orgPath, send } from "./http";
import type { OrganizationDetail } from "./organizations";

// Ported from amigoact-fe src/app/_actions/organizations.ts. Every change
// reloads the mounted screens, as the web revalidates the whole layout.

function memberPath(slug: string, userId: string): string {
  return `${orgPath(slug)}/members/${encodeURIComponent(userId)}`;
}

function applicationPath(slug: string, userId: string): string {
  return `${orgPath(slug)}/applications/${encodeURIComponent(userId)}`;
}

function finish(result: Parameters<typeof failed>[0]): ActionResult {
  return result.ok ? changed({}) : failed(result);
}

export type OrganizationValues = {
  name: string;
  description: string;
  org_type: string;
  join_policy: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  legal_name: string;
  tax_code: string;
  license_number: string;
  legal_rep_name: string;
  legal_rep_position: string;
};

const orNull = (value: string) => value.trim() || null;

// Text fields of the create and update forms. Empty optional fields are null.
function organizationFields(values: OrganizationValues) {
  return {
    name: values.name.trim(),
    description: orNull(values.description),
    org_type: values.org_type,
    join_policy: values.join_policy,
    email: orNull(values.email),
    phone: orNull(values.phone),
    website: orNull(values.website),
    address: orNull(values.address),
    city: orNull(values.city),
    legal_name: orNull(values.legal_name),
    tax_code: orNull(values.tax_code),
    license_number: orNull(values.license_number),
    legal_rep_name: orNull(values.legal_rep_name),
    legal_rep_position: orNull(values.legal_rep_position),
  };
}

// A picture field: an asset id sets it, null clears it, undefined keeps it.
export type PictureChoice = string | null | undefined;

export async function createOrganization(
  values: OrganizationValues,
  logo: PictureChoice,
  cover: PictureChoice,
  gallery: string[],
): Promise<ActionResult> {
  const result = await send<OrganizationDetail>("/organizations", "POST", {
    ...organizationFields(values),
    logo_asset_id: logo,
    cover_asset_id: cover,
    gallery_asset_ids: gallery,
  });
  if (!result.ok) return failed(result);
  return changed({ next: `/org/${encodeURIComponent(result.data.slug)}` });
}

export async function updateOrganization(
  slug: string,
  values: OrganizationValues,
  logo: PictureChoice,
  cover: PictureChoice,
  listedPublicly: boolean,
  gallery: string[],
): Promise<ActionResult> {
  const result = await send(orgPath(slug), "PATCH", {
    ...organizationFields(values),
    logo_asset_id: logo,
    cover_asset_id: cover,
    listed_publicly: listedPublicly,
  });
  if (!result.ok) return failed(result);
  // Pictures not marked as logo or cover join the gallery. Adding is idempotent.
  for (const assetId of gallery) {
    const added = await send(`${orgPath(slug)}/gallery`, "POST", {
      asset_id: assetId,
    });
    if (!added.ok) return failed(added);
  }
  return changed({ success: "Đã lưu thông tin tổ chức." });
}

export async function addGalleryItem(slug: string, assetId: string) {
  return finish(
    await send(`${orgPath(slug)}/gallery`, "POST", { asset_id: assetId }),
  );
}

// Sets the logo, the cover, or both in one request. A role left out stays.
export async function chooseOrgPictures(
  slug: string,
  choice: { logo?: string | null; cover?: string | null },
): Promise<ActionResult> {
  const body: Record<string, string | null> = {};
  if (choice.logo !== undefined) body.logo_asset_id = choice.logo;
  if (choice.cover !== undefined) body.cover_asset_id = choice.cover;
  return finish(await send(`${orgPath(slug)}/pictures`, "PUT", body));
}

export async function removeGalleryItem(slug: string, assetId: string) {
  return finish(
    await send(
      `${orgPath(slug)}/gallery/${encodeURIComponent(assetId)}`,
      "DELETE",
    ),
  );
}

export async function joinOrganization(slug: string, message: string) {
  return finish(
    await send(`${orgPath(slug)}/join`, "POST", { message: orNull(message) }),
  );
}

export async function deleteOrganization(slug: string): Promise<ActionResult> {
  const result = await send(orgPath(slug), "DELETE");
  if (!result.ok) return failed(result);
  return changed({ next: "/organizations" });
}

export async function restoreOrganization(organizationId: string) {
  return finish(
    await send(
      `/organizations/mine/deleted/${encodeURIComponent(organizationId)}/restore`,
      "POST",
    ),
  );
}

// Permanent delete. The backend refuses while certificates or pending hours exist.
export async function purgeOrganization(organizationId: string) {
  return finish(
    await send(
      `/organizations/mine/deleted/${encodeURIComponent(organizationId)}`,
      "DELETE",
    ),
  );
}

export async function leaveOrganization(slug: string) {
  return finish(await send(`${orgPath(slug)}/membership`, "DELETE"));
}

export async function approveApplication(slug: string, userId: string) {
  return finish(await send(`${applicationPath(slug, userId)}/approve`));
}

export async function rejectApplication(slug: string, userId: string) {
  return finish(await send(`${applicationPath(slug, userId)}/reject`));
}

export async function removeMember(slug: string, userId: string) {
  return finish(await send(memberPath(slug, userId), "DELETE"));
}

// Moves the spot crops of an uploaded picture keep in view. Only the uploader
// may do this; the backend answers 404 for anyone else.
export async function setMediaFocus(
  assetId: string,
  point: Focus,
): Promise<{ ok: true; focus: Focus } | { ok: false; message: string }> {
  const result = await send<{ focus?: Focus }>(
    `/media/${encodeURIComponent(assetId)}/focus`,
    "PUT",
    point,
  );
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.status === 404
          ? "Chỉ người tải ảnh này lên mới đổi được điểm lấy nét."
          : "Không lưu được điểm lấy nét. Vui lòng thử lại.",
    };
  }
  changed({});
  return { ok: true, focus: result.data.focus ?? point };
}
