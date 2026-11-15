import { Redirect, useLocalSearchParams } from "expo-router";
import { param } from "@/lib/appPath";

// The web gives an owner the address /organizations/<slug>/...; the app has
// one address for everyone, /org/<slug>/..., so a link to the owner address
// (from an email or a web page) lands on the same screen.
export default function OwnerAddressRedirect() {
  const { slug, rest } = useLocalSearchParams<{
    slug?: string;
    rest?: string | string[];
  }>();
  const tail = Array.isArray(rest) ? rest.join("/") : (rest ?? "");
  const path = `/org/${encodeURIComponent(param(slug))}${tail ? `/${tail}` : ""}`;
  return <Redirect href={path as never} />;
}
