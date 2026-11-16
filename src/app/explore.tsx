import { Redirect, useLocalSearchParams } from "expo-router";
import { param } from "@/lib/appPath";

// /explore became the home screen's "Hoạt động" tab, as on the web, where the
// address redirects. Old deep links keep working and carry their search along.
export default function ExploreRedirect() {
  const params = useLocalSearchParams<{
    q?: string;
    city?: string;
    page?: string;
    focus?: string;
  }>();
  const kept: Record<string, string> = { tab: "activities" };
  // The one search box matches the city too, so a city alone becomes the search.
  const search = param(params.q) || param(params.city);
  if (search) kept.q = search;
  for (const key of ["page", "focus"] as const) {
    const value = param(params[key]);
    if (value) kept[key] = value;
  }
  return <Redirect href={{ pathname: "/", params: kept }} />;
}
