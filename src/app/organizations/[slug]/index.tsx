import { Redirect, useLocalSearchParams } from "expo-router";
import { param } from "@/lib/appPath";

// /organizations/<slug> is the owner's web address of an organization; the
// app shows it at /org/<slug> for everyone.
export default function OwnerOrganizationRedirect() {
  const slug = param(useLocalSearchParams<{ slug?: string }>().slug);
  return <Redirect href={`/org/${encodeURIComponent(slug)}` as never} />;
}
