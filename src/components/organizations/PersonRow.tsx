import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { initials } from "@/lib/organizations";
import { strongText } from "../ui";

// One person in a member or application list: initials, name, details, and
// what can be done with them. Rows after the first get a border above.
export default function PersonRow({
  name,
  first,
  details,
  trailing,
}: {
  name: string;
  first: boolean;
  details: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <View
      className={`flex-row flex-wrap items-start gap-3 py-3 ${first ? "" : "border-t border-slate-200 dark:border-slate-800"}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800">
        <Text className="font-body-semibold text-sm text-slate-700 dark:text-slate-300">
          {initials(name)}
        </Text>
      </View>
      <View className="min-w-0 flex-1 basis-40 gap-1">
        <Text numberOfLines={1} className={strongText}>
          {name}
        </Text>
        {details}
      </View>
      {trailing}
    </View>
  );
}
