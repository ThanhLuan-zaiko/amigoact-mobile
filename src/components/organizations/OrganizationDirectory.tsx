import { Text, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import { listOtherOrganizations } from "@/lib/organizationApi";
import { pageOffset } from "@/lib/organizations";
import PageLinks from "../common/PageLinks";
import SearchField from "../common/SearchField";
import { LoadError, Loading } from "../common/States";
import { mutedText } from "../ui";
import OrganizationCard from "./OrganizationCard";

// The home screen's "Tổ chức" tab: every organization the viewer does not own.
// The viewer's own organizations live on /organizations.
export default function OrganizationDirectory({
  search,
  page: pageParam,
  focusSearch,
  onSearch,
  onPage,
}: {
  search: string;
  page: string | undefined;
  focusSearch: boolean;
  onSearch: (query: string) => void;
  onPage: (page: number) => void;
}) {
  const offset = pageOffset(pageParam);
  const page = useLoad(
    () => listOtherOrganizations(search, offset),
    [search, offset],
  );
  const others = page.data?.items ?? [];
  return (
    <View className="min-w-0 gap-3">
      <SearchField
        label="Tìm tổ chức"
        value={search}
        onSearch={onSearch}
        autoFocus={focusSearch}
      />
      {page.loading ? (
        <Loading />
      ) : page.data === null ? (
        <LoadError>Không tải được danh sách. Vui lòng thử lại.</LoadError>
      ) : others.length === 0 ? (
        <Text className={`py-4 ${mutedText}`}>
          {search
            ? "Không có tổ chức nào khác khớp với từ khóa này."
            : "Chưa có tổ chức nào khác."}
        </Text>
      ) : (
        <View className="gap-3">
          {others.map((organization) => (
            <OrganizationCard
              key={organization.id}
              organization={organization}
            />
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
