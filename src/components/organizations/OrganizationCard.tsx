import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  initials,
  JOIN_POLICY_LABELS,
  ORG_TYPE_LABELS,
  type OrganizationSummary,
} from "@/lib/organizations";
import Picture from "../common/Picture";
import { IconStat } from "../common/States";
import { mutedText, panel, tagChip, tagChipText } from "../ui";

// The strip has four places, like the web grid of four columns.
const SLOTS = ["first", "second", "third", "fourth"];

// Ported from the web OrganizationCard. The cover is a banner above the text;
// without one, the logo or the initials lead. On the public directory a strip
// of pictures from the newest public posts follows.
export default function OrganizationCard({
  organization,
  badge,
}: {
  organization: OrganizationSummary;
  // Replaces the join policy, for example with the viewer's role.
  badge?: string;
}) {
  const postPictures = (organization.post_pictures ?? []).slice(0, 4);
  return (
    <Pressable
      onPress={() => router.push(`/org/${organization.slug}` as never)}
      accessibilityRole="link"
      accessibilityLabel={organization.name}
      className={`${panel} min-w-0 overflow-hidden active:border-teal-700 dark:active:border-teal-400`}
    >
      {organization.cover_url ? (
        <Picture
          src={organization.cover_url}
          width={640}
          focus={organization.cover_focus}
          className="h-24 w-full"
        />
      ) : null}
      <View className="min-w-0 flex-row gap-3 p-4">
        {organization.logo_url ? (
          <Picture
            src={organization.logo_url}
            width={320}
            focus={organization.logo_focus}
            className="h-11 w-11 rounded-md border border-slate-300 dark:border-slate-700"
          />
        ) : (
          <View className="h-11 w-11 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800">
            <Text className="font-body-semibold text-sm text-slate-700 dark:text-slate-300">
              {initials(organization.name)}
            </Text>
          </View>
        )}
        <View className="min-w-0 flex-1 gap-1">
          <Text
            numberOfLines={1}
            className="font-body-semibold text-sm text-slate-900 dark:text-slate-100"
          >
            {organization.name}
          </Text>
          {organization.description ? (
            <Text numberOfLines={2} className={mutedText}>
              {organization.description}
            </Text>
          ) : null}
          <View className="flex-row flex-wrap items-center gap-2">
            <View className={tagChip}>
              <Text className={tagChipText}>
                {ORG_TYPE_LABELS[organization.org_type]}
              </Text>
            </View>
            <View className={tagChip}>
              <Text className={tagChipText}>
                {badge ?? JOIN_POLICY_LABELS[organization.join_policy]}
              </Text>
            </View>
            <IconStat icon="users" label="Thành viên">
              {organization.member_count}
            </IconStat>
          </View>
        </View>
      </View>
      {postPictures.length > 0 ? (
        <View
          accessibilityLabel="Ảnh từ bài viết"
          className="flex-row gap-1 px-4 pb-4"
        >
          {postPictures.map((picture) => (
            <Picture
              key={picture.url}
              src={picture.url}
              width={320}
              focus={picture.focus}
              className="aspect-square flex-1 rounded-md"
            />
          ))}
          {/* Empty slots keep each picture a quarter wide, as the web grid does. */}
          {SLOTS.slice(postPictures.length).map((slot) => (
            <View key={slot} className="flex-1" />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}
