import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/components/AuthProvider";
import { MoreButton } from "@/components/common/PageLinks";
import Segments from "@/components/common/Segments";
import { LoadError, Loading } from "@/components/common/States";
import OrganizationDirectory from "@/components/organizations/OrganizationDirectory";
import {
  Composer,
  FeedList,
  ScopeToggle,
  TagFilterBar,
} from "@/components/posts/FeedParts";
import RightRail from "@/components/posts/RightRail";
import Page from "@/components/shell/Page";
import { useCursorList } from "@/hooks/useCursorList";
import { param } from "@/lib/appPath";
import { getFeed } from "@/lib/postApi";
import { readTag, tagLabel } from "@/lib/tagLinks";

type Tab = "all" | "orgs";

const TABS = [
  { value: "all" as const, label: "Tất cả", icon: "globe" as const },
  { value: "orgs" as const, label: "Tổ chức", icon: "users" as const },
];

// The home feed shows public posts of every organization, plus member posts of
// the organizations the viewer belongs to. "Tổ chức của tôi" narrows it to
// those organizations. The filters live in the route params, as the web keeps
// them in the address.
export default function HomeScreen() {
  const params = useLocalSearchParams<{
    tab?: string;
    scope?: string;
    tag?: string;
    q?: string;
    page?: string;
    focus?: string;
  }>();
  const { user } = useAuth();
  const tab: Tab = param(params.tab) === "orgs" ? "orgs" : "all";
  // "tab=mine" is the address of the former tab, so old links keep working.
  const mine =
    Boolean(user) &&
    (param(params.scope) === "mine" || param(params.tab) === "mine");
  const tag = readTag(param(params.tag) || undefined);

  const feed = useCursorList(
    async (before) => {
      if (tab === "orgs") return { items: [], next: null };
      const page = await getFeed(mine ? "mine" : "all", before, tag);
      return page ? { items: page.posts, next: page.nextBefore } : null;
    },
    [tab, mine, tag, user?.id],
  );

  function setTab(next: Tab) {
    router.setParams(
      next === "orgs"
        ? { tab: "orgs", scope: undefined, tag: undefined, page: undefined }
        : {
            tab: undefined,
            q: undefined,
            page: undefined,
            tag: tag ?? undefined,
          },
    );
  }

  return (
    <Page refreshing={feed.refreshing} onRefresh={() => feed.reload(true)}>
      <Composer />
      <Segments
        items={TABS}
        current={tab}
        onChange={setTab}
        label="Bảng tin"
        fill
      />
      {tab === "orgs" ? (
        <OrganizationDirectory
          search={param(params.q)}
          page={param(params.page) || undefined}
          focusSearch={param(params.focus) === "search"}
          onSearch={(q) =>
            router.setParams({
              q: q || undefined,
              page: undefined,
              focus: undefined,
            })
          }
          onPage={(page) =>
            router.setParams({ page: page > 1 ? String(page) : undefined })
          }
        />
      ) : (
        <>
          {user ? (
            <ScopeToggle
              mine={mine}
              onToggle={() =>
                router.setParams({
                  scope: mine ? undefined : "mine",
                  tab: undefined,
                })
              }
            />
          ) : null}
          {tag ? (
            <TagFilterBar
              label={tagLabel(tag, feed.items)}
              onClear={() => router.setParams({ tag: undefined })}
            />
          ) : null}
          {feed.loading ? (
            <Loading label="Đang tải bảng tin…" />
          ) : feed.failed ? (
            <LoadError>Không tải được bảng tin. Vui lòng thử lại.</LoadError>
          ) : (
            <FeedList posts={feed.items} filtered={tag !== null} />
          )}
          <MoreButton
            visible={feed.hasMore && !feed.loadingMore}
            onPress={feed.loadMore}
          />
          {feed.loadingMore ? <Loading /> : null}
        </>
      )}
      <RightRail />
    </Page>
  );
}
