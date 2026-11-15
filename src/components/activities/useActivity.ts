import { useLocalSearchParams } from "expo-router";
import { useLoad } from "@/hooks/useLoad";
import type { ActivityDetail } from "@/lib/activities";
import { getActivity } from "@/lib/activityApi";
import { param } from "@/lib/appPath";

// The activity of an /activities/[id]/... screen. `found` is null when the
// activity is missing and undefined when it could not be loaded.
export function useActivity() {
  const id = param(useLocalSearchParams<{ id?: string }>().id);
  const loaded = useLoad(async (): Promise<{
    found: ActivityDetail | null | undefined;
  }> => {
    try {
      return { found: await getActivity(id) };
    } catch {
      return { found: undefined };
    }
  }, [id]);
  return { id, ...loaded, found: loaded.data?.found };
}
