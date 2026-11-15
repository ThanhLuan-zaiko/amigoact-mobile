import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { ActivityCard } from "@/components/activities/ActivityParts";
import Button, { IconButton } from "@/components/common/Button";
import PageLinks from "@/components/common/PageLinks";
import Segments from "@/components/common/Segments";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import { TagFilterBar } from "@/components/posts/FeedParts";
import { useLoad } from "@/hooks/useLoad";
import { listOrganizationActivities } from "@/lib/activityApi";
import {
  type ActivityFilter,
  activityFilter,
  EMPTY_MESSAGES,
  orgActivitiesPath,
} from "@/lib/activityList";
import { param } from "@/lib/appPath";
import { type OrganizationDetail, pageOffset } from "@/lib/organizations";
import { hasModule, hasPermission } from "@/lib/roles";
import { readTag, tagLabel } from "@/lib/tagLinks";

const FILTERS: {
  value: ActivityFilter;
  label: string;
  icon: "list" | "clock" | "check-circle" | "x-circle";
}[] = [
  { value: "all", label: "Tất cả", icon: "list" },
  { value: "upcoming", label: "Sắp tới", icon: "clock" },
  { value: "completed", label: "Đã kết thúc", icon: "check-circle" },
  { value: "cancelled", label: "Đã hủy", icon: "x-circle" },
];

function OrganizationActivities({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const slug = organization.slug;
  const params = useLocalSearchParams<{
    filter?: string;
    tag?: string;
    page?: string;
  }>();
  const filter = activityFilter(param(params.filter) || undefined);
  const offset = pageOffset(param(params.page) || undefined);
  const tag = readTag(param(params.tag) || undefined);
  const page = useLoad(
    () => listOrganizationActivities(slug, offset, filter, tag),
    [slug, offset, filter, tag],
  );
  const base = orgActivitiesPath(slug);
  const { viewer } = organization;
  const canManage = hasModule(viewer, "activities");
  const empty = tag
    ? {
        title: "Chưa có hoạt động với thẻ này",
        description: "Bỏ lọc thẻ để xem mọi hoạt động của tổ chức.",
      }
    : EMPTY_MESSAGES[filter];

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <View className="min-w-0 flex-1">
          <Segments
            items={FILTERS}
            current={filter}
            label="Lọc hoạt động"
            compact
            onChange={(value) =>
              router.setParams({
                filter: value === "all" ? undefined : value,
                page: undefined,
              })
            }
          />
        </View>
        {canManage ? (
          <>
            <IconButton
              icon="file-text"
              label="Hoạt động nháp"
              onPress={() => router.push(`${base}/drafts` as never)}
            />
            {hasPermission(viewer, "activities.delete") ? (
              <IconButton
                icon="trash-2"
                label="Thùng rác hoạt động"
                onPress={() => router.push(`${base}/trash` as never)}
              />
            ) : null}
            {hasPermission(viewer, "activities.create") ? (
              <Button
                icon="plus"
                onPress={() => router.push(`${base}/new` as never)}
              >
                Tạo hoạt động
              </Button>
            ) : null}
          </>
        ) : null}
      </View>
      {tag ? (
        <TagFilterBar
          label={tagLabel(
            tag,
            page.data?.items.map((item) => ({ tags: item.tags ?? [] })) ?? [],
          )}
          onClear={() => router.setParams({ tag: undefined, page: undefined })}
        />
      ) : null}
      {page.loading ? (
        <Loading />
      ) : page.data === null ? (
        <LoadError>Không tải được danh sách. Vui lòng thử lại.</LoadError>
      ) : (page.data?.items.length ?? 0) === 0 ? (
        <EmptyState title={empty.title} description={empty.description} />
      ) : (
        <View className="gap-3">
          {page.data?.items.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      )}
      <PageLinks
        offset={offset}
        total={page.data?.total ?? 0}
        onPage={(next) =>
          router.setParams({ page: next > 1 ? String(next) : undefined })
        }
      />
    </View>
  );
}

export default function OrganizationActivitiesScreen() {
  return (
    <OrgScreen>
      {(organization) => <OrganizationActivities organization={organization} />}
    </OrgScreen>
  );
}
