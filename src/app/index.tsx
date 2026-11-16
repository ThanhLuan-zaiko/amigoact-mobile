import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/components/AuthProvider";
import ActivityDirectory from "@/components/activities/ActivityDirectory";
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
// What the screen lists: the "Tất cả" tab shows posts, or every activity when
// ?tab=activities (the header search, old /explore links).
type View = Tab | "activities";

const TABS = [
  { value: "all" as const, label: "Tất cả", icon: "globe" as const },
  { value: "orgs" as const, label: "Tổ chức", icon: "users" as const },
];

function readView(value: string): View {
  return value === "activities" || value === "orgs" ? value : "all";
}

// The home feed shows public posts of every organization, plus member posts of
// the organizations the viewer belongs to. "Tổ chức của tôi" narrows it to
// those organizations. The "Tất cả" tab shows posts only, and an activity
// appears inside the post about it; the "Tổ chức" tab is the directory. The filters live in the route
// params, as the web keeps them in the address.
export default function HomeScreen() {
  const params = useLocalSearchParams<{
    tab?: string;
    scope?: string;
    tag?: string;
    q?: string;
    city?: string;
    page?: string;
    focus?: string;
  }>();
  const { user } = useAuth();
  const view = readView(param(params.tab));
  const tab: Tab = view === "orgs" ? "orgs" : "all";
  // "tab=mine" is the address of the former tab, so old links keep working.
  const mine =
    Boolean(user) &&
    (param(params.scope) === "mine" || param(params.tab) === "mine");
  const tag = readTag(param(params.tag) || undefined);

  const feed = useCursorList(
    async (before) => {
      if (view !== "all") return { items: [], next: null };
      const page = await getFeed(mine ? "mine" : "all", before, tag);
      return page ? { items: page.posts, next: page.nextBefore } : null;
    },
    [view, mine, tag, user?.id],
  );

  // Switching tabs keeps the tag filter. The directories have no tags.
  function setTab(next: Tab) {
    router.setParams(
      next === "all"
        ? {
            tab: undefined,
            q: undefined,
            city: undefined,
            page: undefined,
            focus: undefined,
            tag: tag ?? undefined,
          }
        : {
            tab: next,
            scope: undefined,
            tag: undefined,
            q: undefined,
            city: undefined,
            page: undefined,
            focus: undefined,
          },
    );
  }

  function setPage(page: number) {
    router.setParams({ page: page > 1 ? String(page) : undefined });
  }

  return (
    <Page refreshing={feed.refreshing} onRefresh={() => feed.reload(true)}>
      {view === "activities" ? null : <Composer />}
      <Segments
        items={TABS}
        current={tab}
        onChange={setTab}
        label="Bảng tin"
        fill
      />
      {view === "activities" ? (
        <ActivityDirectory
          // An old /explore link may carry a city alone. The one search box
          // matches the city too, so that value becomes the search.
          search={(param(params.q) || param(params.city)).trim()}
          page={param(params.page) || undefined}
          focusSearch={param(params.focus) === "search"}
          onSearch={(q) =>
            router.setParams({
              q: q || undefined,
              city: undefined,
              page: undefined,
              focus: undefined,
            })
          }
          onPage={setPage}
          onClose={() => setTab("all")}
        />
      ) : view === "orgs" ? (
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
          onPage={setPage}
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
