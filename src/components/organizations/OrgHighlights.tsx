import { router } from "expo-router";
import type { ReactNode } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import { formatDateTime } from "@/lib/activities";
import { listOrganizationActivities } from "@/lib/activityApi";
import { getGallery } from "@/lib/organizationApi";
import { formatDate, type OrganizationDetail } from "@/lib/organizations";
import { isVideo } from "@/lib/pictureRules";
import { getOrgPosts } from "@/lib/postApi";
import { postPath } from "@/lib/posts";
import { IconButton } from "../common/Button";
import Icon, { type IconName } from "../common/Icon";
import Picture from "../common/Picture";
import { IconStat, Loading } from "../common/States";
import VideoPlayer from "../posts/VideoPlayer";
import { mutedText, panel, sectionTitle, strongText } from "../ui";

const HIGHLIGHT_COUNT = 3;

function Heading({
  icon,
  title,
  href,
  linkLabel,
}: {
  icon: IconName;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="flex-row items-center gap-2">
        <Icon name={icon} />
        <Text accessibilityRole="header" className={sectionTitle}>
          {title}
        </Text>
      </View>
      <IconButton
        icon="chevron-right"
        label={linkLabel}
        onPress={() => router.push(href as never)}
        className="border-transparent"
      />
    </View>
  );
}

function Rows({ children }: { children: ReactNode[] }) {
  return (
    <View>
      {children.map((child, index) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are rendered in a fixed order.
          key={index}
          className={`gap-1 py-2 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

function LinkText({ href, children }: { href: string; children: string }) {
  return (
    <Pressable
      onPress={() => router.push(href as never)}
      accessibilityRole="link"
    >
      <Text className={strongText}>{children}</Text>
    </Pressable>
  );
}

// The web OrganizationAbout section of the overview.
export function OrganizationAbout({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const location = [organization.address, organization.city]
    .filter(Boolean)
    .join(", ");
  const link = (label: string, url: string, value: string, icon: IconName) => (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}
      className="min-w-0 flex-row items-center gap-1.5"
    >
      <Icon name={icon} size={14} tone="subtle" />
      <Text className="shrink font-body-semibold text-sm text-teal-700 dark:text-teal-400">
        {value}
      </Text>
    </Pressable>
  );
  return (
    <View className={`${panel} gap-4 p-4`}>
      {organization.description ? (
        <Text
          selectable
          className="font-body text-[15px] leading-relaxed text-slate-700 dark:text-slate-300"
        >
          {organization.description}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap gap-x-5 gap-y-2">
        <IconStat icon="user" label="Chủ sở hữu">
          {organization.owner_name}
        </IconStat>
        <IconStat icon="calendar" label="Ngày tạo">
          {formatDate(organization.created_at)}
        </IconStat>
        {organization.email
          ? link(
              "Email",
              `mailto:${organization.email}`,
              organization.email,
              "mail",
            )
          : null}
        {organization.phone
          ? link(
              "Điện thoại",
              `tel:${organization.phone}`,
              organization.phone,
              "phone",
            )
          : null}
        {/* The backend accepts only http and https here, so this link is safe. */}
        {organization.website
          ? link("Website", organization.website, organization.website, "globe")
          : null}
        {location ? (
          <IconStat icon="map-pin" label="Địa chỉ">
            {location}
          </IconStat>
        ) : null}
      </View>
    </View>
  );
}

// Pinned posts first. Without any, the newest posts stand in.
export function PinnedPosts({ slug }: { slug: string }) {
  const data = useLoad(async () => {
    const pinned = await getOrgPosts(slug, "pinned", null, HIGHLIGHT_COUNT);
    if (pinned && pinned.posts.length > 0) {
      return { title: "Bài ghim", posts: pinned.posts };
    }
    const latest = await getOrgPosts(slug, "all", null, HIGHLIGHT_COUNT);
    return { title: "Bài mới", posts: latest?.posts ?? [] };
  }, [slug]);
  if (!data.data) return <Loading />;
  return (
    <View className={`${panel} gap-3 p-4`}>
      <Heading
        icon="bookmark"
        title={data.data.title}
        href={postPath(slug)}
        linkLabel="Xem bảng tin"
      />
      {data.data.posts.length === 0 ? (
        <Text className={mutedText}>Chưa có bài viết.</Text>
      ) : (
        <Rows>
          {data.data.posts.map((post) => (
            <View key={post.id} className="gap-1">
              <LinkText href={postPath(slug, post.id)}>{post.title}</LinkText>
              <Text className={mutedText}>{post.publishedAt}</Text>
            </View>
          ))}
        </Rows>
      )}
    </View>
  );
}

export function RecentActivities({ slug }: { slug: string }) {
  const page = useLoad(() => listOrganizationActivities(slug, 0), [slug]);
  if (page.loading) return <Loading />;
  const activities = (page.data?.items ?? []).slice(0, HIGHLIGHT_COUNT);
  return (
    <View className={`${panel} gap-3 p-4`}>
      <Heading
        icon="calendar"
        title="Hoạt động"
        href={`/org/${slug}/activities`}
        linkLabel="Xem tất cả hoạt động"
      />
      {activities.length === 0 ? (
        <Text className={mutedText}>Chưa có hoạt động.</Text>
      ) : (
        <Rows>
          {activities.map((activity) => (
            <View key={activity.id} className="gap-1">
              <LinkText href={`/activities/${activity.id}`}>
                {activity.title}
              </LinkText>
              <IconStat icon="calendar" label="Thời gian">
                {formatDateTime(activity.start_at)}
              </IconStat>
            </View>
          ))}
        </Rows>
      )}
    </View>
  );
}

// The gallery: the first item spans the row, the others are squares.
export function OrganizationGallery({ slug }: { slug: string }) {
  const items = useLoad(() => getGallery(slug), [slug]);
  const list = items.data ?? [];
  if (list.length === 0) return null;
  return (
    <View className={`${panel} gap-3 p-4`}>
      <Text accessibilityRole="header" className={sectionTitle}>
        Bộ sưu tập
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {list.map((item, index) => {
          const box =
            index === 0 ? "aspect-video w-full" : "aspect-square w-[48.5%]";
          const frame = `${box} overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900`;
          return isVideo(item.mime) ? (
            <View key={item.id} className={`${frame} bg-slate-950`}>
              <VideoPlayer
                id={item.id}
                info={item.video}
                className="h-full w-full"
              />
            </View>
          ) : (
            <View key={item.id} className={frame}>
              <Picture
                src={item.url}
                width={640}
                focus={item.focus}
                className="h-full w-full"
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
