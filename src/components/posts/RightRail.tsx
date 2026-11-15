import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import { formatDateTime, seatsText } from "@/lib/activities";
import { listPublicActivities } from "@/lib/activityApi";
import { appPath } from "@/lib/appPath";
import { getMyOrganizations, listOrganizations } from "@/lib/organizationApi";
import { JOIN_POLICY_LABELS } from "@/lib/organizations";
import { getPopularTags } from "@/lib/postApi";
import { feedTagHref } from "@/lib/tagLinks";
import { IconButton } from "../common/Button";
import { IconStat, Loading } from "../common/States";
import {
  mutedText,
  panel,
  sectionTitle,
  strongText,
  tagChip,
  tagChipText,
} from "../ui";

const SUGGESTION_COUNT = 5;
// Fetch more than are shown, because the viewer's own organizations are left out.
const FETCH_COUNT = 20;
const UPCOMING_COUNT = 4;

function Section({
  title,
  link,
  children,
}: {
  title: string;
  link?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <View className={`${panel} gap-3 p-4`}>
      <View className="flex-row items-center justify-between gap-2">
        <Text accessibilityRole="header" className={sectionTitle}>
          {title}
        </Text>
        {link ? (
          <IconButton
            icon="chevron-right"
            label={link.label}
            onPress={() => router.push(link.href as never)}
            className="border-transparent"
          />
        ) : null}
      </View>
      {children}
    </View>
  );
}

// The web RightRail of the home feed. Like the web, it shows only on wide
// screens (lg, 1024 points), so on a phone the feed has the screen to itself.
export default function RightRail() {
  const { width } = useWindowDimensions();
  return width >= 1024 ? <RailBody /> : null;
}

function RailBody() {
  const data = useLoad(async () => {
    const [upcoming, page, mine, tags] = await Promise.all([
      listPublicActivities("", "", 0, UPCOMING_COUNT),
      listOrganizations("", 0, FETCH_COUNT),
      getMyOrganizations(),
      getPopularTags(),
    ]);
    const joined = new Set(mine.map((org) => org.id));
    return {
      upcoming: upcoming?.items ?? [],
      suggestions: (page?.items ?? [])
        .filter((org) => !joined.has(org.id))
        .slice(0, SUGGESTION_COUNT),
      tags,
    };
  }, []);
  return (
    <View className="gap-4">
      <Section
        title="Sắp diễn ra"
        link={{ href: "/explore", label: "Xem tất cả hoạt động" }}
      >
        {!data.data ? (
          <Loading />
        ) : data.data.upcoming.length === 0 ? (
          <Text className={mutedText}>Chưa có hoạt động sắp diễn ra.</Text>
        ) : (
          data.data.upcoming.map((activity) => (
            <View key={activity.id} className="min-w-0 gap-1">
              <Pressable
                onPress={() =>
                  router.push(`/activities/${activity.id}` as never)
                }
                accessibilityRole="link"
              >
                <Text className={strongText}>{activity.title}</Text>
              </Pressable>
              <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                <IconStat icon="calendar" label="Thời gian">
                  {formatDateTime(activity.start_at)}
                </IconStat>
                <IconStat icon="users" label="Số chỗ">
                  {seatsText(activity.seats_taken, activity.capacity)}
                </IconStat>
              </View>
            </View>
          ))
        )}
      </Section>
      <Section
        title="Tổ chức gợi ý"
        link={{ href: "/?tab=orgs", label: "Xem tất cả tổ chức" }}
      >
        {!data.data ? (
          <Loading />
        ) : data.data.suggestions.length === 0 ? (
          <Text className={mutedText}>Chưa có gợi ý.</Text>
        ) : (
          data.data.suggestions.map((org) => (
            <View key={org.id} className="min-w-0 gap-1">
              <Pressable
                onPress={() => router.push(`/org/${org.slug}` as never)}
                accessibilityRole="link"
              >
                <Text numberOfLines={1} className={strongText}>
                  {org.name}
                </Text>
              </Pressable>
              <View className="flex-row flex-wrap items-center gap-2">
                <View className={tagChip}>
                  <Text className={tagChipText}>
                    {JOIN_POLICY_LABELS[org.join_policy]}
                  </Text>
                </View>
                <IconStat icon="users" label="Thành viên">
                  {org.member_count}
                </IconStat>
              </View>
            </View>
          ))
        )}
      </Section>
      <Section title="Thẻ phổ biến">
        {!data.data ? (
          <Loading />
        ) : data.data.tags.length === 0 ? (
          <Text className={mutedText}>Chưa có thẻ nào.</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {data.data.tags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => router.push(appPath(feedTagHref(tag)) as never)}
                accessibilityRole="link"
                className={tagChip}
              >
                <Text className={tagChipText}>#{tag}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Section>
    </View>
  );
}
