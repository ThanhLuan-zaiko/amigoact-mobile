import type { ActionResult } from "./actionResult";
import { changed } from "./actionResult";
import type { ApiResult } from "./api";
import {
  type ActivityCertificates,
  type CertificateTemplate,
  certificateFailure,
  issuedMessage,
  type MyCertificate,
  readLayout,
  type VerifiedCertificate,
} from "./certificates";
import { api } from "./client";
import { orgPath, read, send } from "./http";

// Ported from amigoact-fe src/lib/certificateApi.ts and
// src/app/_actions/certificates.ts.

// Templates and activity lists come back only to managers, so null means
// "not allowed".
export async function getTemplates(
  slug: string,
): Promise<CertificateTemplate[] | null> {
  const data = await read<{ items: CertificateTemplate[] }>(
    `${orgPath(slug)}/certificate-templates`,
  );
  return data?.items ?? null;
}

export function getTemplate(id: string): Promise<CertificateTemplate | null> {
  return read(`/certificate-templates/${encodeURIComponent(id)}`);
}

export function getActivityCertificates(
  id: string,
): Promise<ActivityCertificates | null> {
  return read(`/activities/${encodeURIComponent(id)}/certificates`);
}

export function getMyCertificates(): Promise<MyCertificate[] | null> {
  return read("/certificates/mine");
}

export type VerifyResult =
  | { certificate: VerifiedCertificate }
  | { certificate: null; rateLimited: boolean };

// Public: no token is sent, so the screen shows the same thing to everyone.
export async function verifyCertificate(serial: string): Promise<VerifyResult> {
  const result = await api.request<VerifiedCertificate>(
    `/certificates/verify/${encodeURIComponent(serial)}`,
    { method: "GET" },
  );
  return result.ok
    ? { certificate: result.data }
    : { certificate: null, rateLimited: result.code === "rate_limited" };
}

// --- Actions -------------------------------------------------------------

function finish(result: ApiResult<unknown>, success?: string): ActionResult {
  if (!result.ok) return certificateFailure(result.code, result.issues);
  return changed(success ? { success } : {});
}

// The web helpers read a FormData; the app passes its field values instead.
function layoutFrom(values: Record<string, string>) {
  return readLayout({
    get: (name: string) => values[name] ?? "",
  } as unknown as FormData);
}

function templatesPage(slug: string): string {
  return `/org/${encodeURIComponent(slug)}/certificates`;
}

export async function createTemplate(
  slug: string,
  name: string,
  background: string | null | undefined,
  layout: Record<string, string>,
): Promise<ActionResult> {
  const result = await send(`${orgPath(slug)}/certificate-templates`, "POST", {
    name: name.trim(),
    // A new template has nothing to remove, so only an uploaded picture is sent.
    ...(background ? { background_asset_id: background } : {}),
    layout: layoutFrom(layout),
  });
  if (!result.ok) return certificateFailure(result.code, result.issues);
  return changed({ next: templatesPage(slug) });
}

export async function updateTemplate(
  slug: string,
  id: string,
  name: string,
  background: string | null | undefined,
  layout: Record<string, string>,
): Promise<ActionResult> {
  const result = await send(
    `/certificate-templates/${encodeURIComponent(id)}`,
    "PATCH",
    {
      name: name.trim(),
      ...(background === undefined ? {} : { background_asset_id: background }),
      layout: layoutFrom(layout),
    },
  );
  if (!result.ok) return certificateFailure(result.code, result.issues);
  return changed({ next: templatesPage(slug) });
}

export async function setTemplateActive(id: string, active: boolean) {
  return finish(
    await send(`/certificate-templates/${encodeURIComponent(id)}`, "PATCH", {
      is_active: active,
    }),
  );
}

export async function issueCertificates(
  activityId: string,
  templateId: string,
) {
  const result = await send<{ issued: number }>(
    `/activities/${encodeURIComponent(activityId)}/certificates`,
    "POST",
    templateId ? { template_id: templateId } : {},
  );
  if (!result.ok) return certificateFailure(result.code, result.issues);
  return changed({ success: issuedMessage(result.data.issued) });
}

export async function revokeCertificate(id: string, reason: string) {
  return finish(
    await send(`/certificates/${encodeURIComponent(id)}/revoke`, "POST", {
      reason: reason.trim(),
    }),
    "Đã thu hồi chứng nhận.",
  );
}

export async function reinstateCertificate(id: string) {
  return finish(
    await send(`/certificates/${encodeURIComponent(id)}/reinstate`),
  );
}
