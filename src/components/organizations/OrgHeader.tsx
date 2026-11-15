import { router, usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  initials,
  JOIN_POLICY_LABELS,
  LEGAL_STATUS_LABELS,
  type LegalStatus,
  ORG_TYPE_LABELS,
  type OrganizationDetail,
  ROLE_LABELS,
} from "@/lib/organizations";
import { feedBackHref } from "@/lib/orgBack";
import { hasModule, hasPermission } from "@/lib/roles";
import Picture from "../common/Picture";
import Segments from "../common/Segments";
import { IconStat } from "../common/States";
import BackLink from "../shell/BackLink";
import { badge, badgeText, panel, tagChip, tagChipText } from "../ui";
import MembershipAction from "./MembershipAction";

function Logo({
  url,
  name,
  focus,
  size,
}: {
  url: string | null;
  name: string;
  focus?: OrganizationDetail["logo_focus"];
  size: "large" | "small";
}) {
  const box = size === "large" ? "h-20 w-20 rounded-lg" : "h-9 w-9 rounded-md";
  if (url) {
    return (
      <Picture
        src={url}
        width={320}
        focus={focus}
        className={`${box} border border-slate-300 dark:border-slate-700`}
      />
    );
  }
  return (
    <View
      className={`${box} items-center justify-center border border-slate-300 dark:border-slate-700`}
    >
      <Text
        className={`font-body-semibold text-slate-900 dark:text-slate-100 ${size === "large" ? "text-xl" : "text-sm"}`}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

// Only "verified" carries the semantic green. The other statuses stay neutral.
function LegalBadge({ status }: { status: LegalStatus }) {
  if (status === "verified") {
    return (
      <View className={badge.green}>
        <Text className={badgeText.green}>{LEGAL_STATUS_LABELS[status]}</Text>
      </View>
    );
  }
  return (
    <View className={tagChip}>
      <Text className={tagChipText}>{LEGAL_STATUS_LABELS[status]}</Text>
    </View>
  );
}

// The sections of an organization, the web OrgNav. Only the current one keeps
// its word, as on a phone-width web page.
function OrgNav({ organization }: { organization: OrganizationDetail }) {
  const pathname = usePathname();
  const { viewer } = organization;
  const base = `/org/${organization.slug}`;
  const items = [
    { value: base, label: "Giới thiệu", icon: "info" as const, visible: true },
    {
      value: `${base}/posts`,
      label: "Bảng tin",
      icon: "message-square" as const,
      visible: true,
    },
    {
      value: `${base}/activities`,
      label: "Hoạt động",
      icon: "calendar" as const,
      visible: true,
    },
    {
      value: `${base}/members`,
      label: "Thành viên",
      icon: "users" as const,
      visible: viewer.role !== null,
    },
    {
      value: `${base}/roles`,
      label: "Vai trò",
      icon: "tag" as const,
      visible: viewer.role !== null,
    },
    {
      value: `${base}/applications`,
      label: "Yêu cầu",
      icon: "inbox" as const,
      visible: hasPermission(viewer, "applications.review"),
    },
    {
      value: `${base}/hours`,
      label: "Giờ",
      icon: "clock" as const,
      visible: hasPermission(viewer, "attendance.hours"),
    },
    {
      value: `${base}/certificates`,
      label: "Chứng nhận",
      icon: "award" as const,
      visible: hasModule(viewer, "certificates"),
    },
    {
      value: `${base}/settings`,
      label: "Cài đặt",
      icon: "settings" as const,
      visible: hasPermission(viewer, "organization.update"),
    },
  ].filter((item) => item.visible);
  const current =
    items
      .filter((item) =>
        item.value === base
          ? pathname === base
          : pathname === item.value || pathname.startsWith(`${item.value}/`),
      )
      .at(-1)?.value ?? base;
  return (
    <Segments
      items={items}
      current={current}
      label="Mục của tổ chức"
      compact
      onChange={(href) => {
        if (href !== current) router.navigate(href as never);
      }}
    />
  );
}

// The full organization header: cover, logo, name, badges, counts, the
// viewer's membership action and the section navigation.
export default function OrgHeader({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const { viewer } = organization;
  return (
    <View className={`${panel} gap-4 p-4`}>
      {organization.cover_url ? (
        <Picture
          src={organization.cover_url}
          focus={organization.cover_focus}
          className="aspect-[2] w-full rounded-lg bg-slate-100 dark:bg-slate-900"
        />
      ) : null}
      <View className="flex-row flex-wrap items-start gap-4">
        <Logo
          url={organization.logo_url}
          name={organization.name}
          focus={organization.logo_focus}
          size="large"
        />
        <View className="min-w-0 flex-1 basis-56 gap-2">
          <Text
            accessibilityRole="header"
            className="font-body-semibold text-2xl text-slate-900 dark:text-slate-100"
          >
            {organization.name}
          </Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <View className={tagChip}>
              <Text className={tagChipText}>
                {ORG_TYPE_LABELS[organization.org_type]}
              </Text>
            </View>
            <View className={tagChip}>
              <Text className={tagChipText}>
                {JOIN_POLICY_LABELS[organization.join_policy]}
              </Text>
            </View>
            <LegalBadge status={organization.legal_status} />
            {viewer.role ? (
              <View className="rounded-sm border border-teal-700 px-2 py-1 dark:border-teal-400">
                <Text className="font-body-medium text-xs text-teal-700 dark:text-teal-400">
                  {ROLE_LABELS[viewer.role]}
                </Text>
              </View>
            ) : null}
            <IconStat icon="users" label="Thành viên">
              {organization.member_count}
            </IconStat>
            <IconStat icon="calendar" label="Hoạt động">
              {organization.activity_count}
            </IconStat>
            <IconStat icon="clock" label="Giờ tình nguyện">
              {`${organization.volunteer_hours}h`}
            </IconStat>
          </View>
        </View>
        <MembershipAction key={viewer.status} organization={organization} />
      </View>
      <OrgNav organization={organization} />
    </View>
  );
}

// Reading or writing a post needs the space more than the banner, so feed
// sub-screens get one short row: back, logo, name. Null when the full header
// belongs on this screen.
export function ShortOrgHeader({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const pathname = usePathname();
  const back = feedBackHref(pathname, organization.slug);
  if (back === null) return null;
  return (
    <View className={`${panel} flex-row items-center gap-3 p-2`}>
      <BackLink href={back} />
      <Pressable
        onPress={() => router.navigate(`/org/${organization.slug}` as never)}
        accessibilityRole="link"
        className="min-w-0 flex-1 flex-row items-center gap-3"
      >
        <Logo
          url={organization.logo_url}
          name={organization.name}
          size="small"
        />
        <Text
          numberOfLines={1}
          className="shrink font-body-semibold text-sm text-slate-900 dark:text-slate-100"
        >
          {organization.name}
        </Text>
      </Pressable>
    </View>
  );
}
