import { type ActionResult, changed } from "./actionResult";
import type { ApiResult } from "./api";
import { failureState } from "./forms";
import { orgPath, send } from "./http";

// Ported from amigoact-fe src/app/_actions/roles.ts.

// The form inputs have their own names, so a backend error lands on the right input.
const FORM_FIELDS: Record<string, string> = {
  name: "role_name",
  color: "role_color",
  permissions: "role_permissions",
};

function rolesPath(slug: string): string {
  return `${orgPath(slug)}/roles`;
}

function finish(result: ApiResult<unknown>): ActionResult {
  if (!result.ok) {
    return failureState(
      result.code,
      result.issues.map((issue) => ({
        ...issue,
        field: FORM_FIELDS[issue.field] ?? issue.field,
      })),
    );
  }
  return changed({ success: "Đã lưu." });
}

export type RoleFields = { name: string; color: string; permissions: string[] };

export async function createRole(slug: string, fields: RoleFields) {
  return finish(
    await send(rolesPath(slug), "POST", {
      ...fields,
      name: fields.name.trim(),
    }),
  );
}

export async function updateRole(
  slug: string,
  roleId: string,
  fields: RoleFields,
) {
  return finish(
    await send(`${rolesPath(slug)}/${encodeURIComponent(roleId)}`, "PATCH", {
      ...fields,
      name: fields.name.trim(),
    }),
  );
}

export async function deleteRole(slug: string, roleId: string) {
  return finish(
    await send(`${rolesPath(slug)}/${encodeURIComponent(roleId)}`, "DELETE"),
  );
}

// The ids go from the highest role to the lowest.
export async function reorderRoles(slug: string, roleIds: string[]) {
  return finish(
    await send(`${rolesPath(slug)}/order`, "PUT", { role_ids: roleIds }),
  );
}

export async function setMemberRoles(
  slug: string,
  userId: string,
  roleIds: string[],
) {
  return finish(
    await send(
      `${orgPath(slug)}/members/${encodeURIComponent(userId)}/roles`,
      "PUT",
      { role_ids: roleIds },
    ),
  );
}
