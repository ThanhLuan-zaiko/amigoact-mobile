import { Text, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import { listPublicActivities } from "@/lib/activityApi";
import { pageOffset } from "@/lib/organizations";
import { IconButton } from "../common/Button";
import PageLinks from "../common/PageLinks";
import SearchField from "../common/SearchField";
import EmptyState, { LoadError, Loading } from "../common/States";
import { sectionTitle } from "../ui";
import { ActivityCard } from "./ActivityParts";

// Every published activity, shown in place of the posts under the home
// screen's "Tất cả" tab (?tab=activities), as on the web. The cross goes back
// to the feed. The web keeps one search box in its header, and a phone shows
// it here; the words match the title or the city. It replaced the former
// /explore screen.
export default function ActivityDirectory({
  search,
  page: pageParam,
  focusSearch,
  onSearch,
  onPage,
  onClose,
}: {
  search: string;
  page: string | undefined;
  focusSearch: boolean;
  onSearch: (query: string) => void;
  onPage: (page: number) => void;
  onClose: () => void;
}) {
  const offset = pageOffset(pageParam);
  const page = useLoad(
    () => listPublicActivities(search, "", offset),
    [search, offset],
  );
  const items = page.data?.items ?? [];
  return (
    <View className="min-w-0 gap-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text numberOfLines={1} className={`min-w-0 flex-1 ${sectionTitle}`}>
          {search ? `Hoạt động: “${search}”` : "Tất cả hoạt động"}
        </Text>
        <IconButton icon="x" label="Quay lại bảng tin" onPress={onClose} />
      </View>
      <SearchField
        label="Tìm hoạt động, thành phố"
        value={search}
        onSearch={onSearch}
        autoFocus={focusSearch}
      />
      {page.loading ? (
        <Loading />
      ) : page.data === null ? (
        <LoadError>Không tải được danh sách. Vui lòng thử lại.</LoadError>
      ) : items.length === 0 ? (
        <EmptyState
          title="Chưa có hoạt động nào"
          description={
            search
              ? "Không có hoạt động nào khớp với tìm kiếm."
              : "Các hoạt động sắp diễn ra sẽ hiện ở đây."
          }
        />
      ) : (
        <View className="gap-3">
          {items.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      )}
      <PageLinks
        offset={offset}
        total={page.data?.total ?? 0}
        onPage={onPage}
      />
    </View>
  );
}
