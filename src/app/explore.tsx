import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { ActivityCard } from "@/components/activities/ActivityParts";
import { IconButton } from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import PageLinks from "@/components/common/PageLinks";
import EmptyState, { LoadError, Loading } from "@/components/common/States";
import Page, { PageTitle } from "@/components/shell/Page";
import { inputField } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { useThemeColors } from "@/hooks/useThemeColors";
import { listPublicActivities } from "@/lib/activityApi";
import { param } from "@/lib/appPath";
import { pageOffset } from "@/lib/organizations";

// Published activities, searched by words and city. The search lives in the
// route params, as the web keeps it in the address.
export default function ExploreScreen() {
  const theme = useThemeColors();
  const params = useLocalSearchParams<{
    q?: string;
    city?: string;
    page?: string;
    focus?: string;
  }>();
  const search = param(params.q).trim();
  const city = param(params.city).trim();
  const offset = pageOffset(param(params.page) || undefined);
  const [q, setQ] = useState(search);
  const [place, setPlace] = useState(city);
  useEffect(() => setQ(search), [search]);
  useEffect(() => setPlace(city), [city]);
  const page = useLoad(
    () => listPublicActivities(search, city, offset),
    [search, city, offset],
  );

  function submit() {
    router.setParams({
      q: q.trim() || undefined,
      city: place.trim() || undefined,
      page: undefined,
      focus: undefined,
    });
  }

  return (
    <Page refreshing={page.refreshing} onRefresh={() => page.reload(true)}>
      <PageTitle>Khám phá</PageTitle>
      <View className="flex-row flex-wrap gap-2">
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={submit}
          returnKeyType="search"
          maxLength={100}
          autoFocus={param(params.focus) === "search"}
          placeholder="Tìm hoạt động"
          placeholderTextColor={theme.subtle}
          accessibilityLabel="Tìm hoạt động"
          className={`min-w-0 flex-1 basis-48 ${inputField}`}
        />
        <View className="min-w-0 flex-1 basis-32 justify-center">
          <View className="absolute left-3 z-10">
            <Icon name="map-pin" tone="subtle" />
          </View>
          <TextInput
            value={place}
            onChangeText={setPlace}
            onSubmitEditing={submit}
            returnKeyType="search"
            maxLength={100}
            placeholder="Thành phố"
            placeholderTextColor={theme.subtle}
            accessibilityLabel="Thành phố"
            className={`${inputField} pl-9`}
          />
        </View>
        <IconButton icon="search" label="Tìm" onPress={submit} />
      </View>
      {page.loading ? (
        <Loading />
      ) : page.data === null ? (
        <LoadError>Không tải được danh sách. Vui lòng thử lại.</LoadError>
      ) : (page.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="Chưa có hoạt động nào"
          description={
            search || city
              ? "Không có hoạt động nào khớp với tìm kiếm."
              : "Các hoạt động sắp diễn ra sẽ hiện ở đây."
          }
        />
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
    </Page>
  );
}
