import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { RegistrationBadge } from "@/components/activities/ActivityParts";
import ActionButton from "@/components/common/ActionButton";
import PageLinks from "@/components/common/PageLinks";
import Segments from "@/components/common/Segments";
import EmptyState, { IconStat, Loading } from "@/components/common/States";
import PersonRow from "@/components/organizations/PersonRow";
import RequireUser from "@/components/RequireUser";
import BackTitle from "@/components/shell/BackTitle";
import Page from "@/components/shell/Page";
import { mutedText, panel } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import {
  formatDateTime,
  REGISTRATION_STATUS_LABELS,
  type RegistrationStatus,
} from "@/lib/activities";
import { approveRegistration, rejectRegistration } from "@/lib/activityActions";
import { getActivityRegistrations } from "@/lib/activityApi";
import { param } from "@/lib/appPath";
import { pageOffset } from "@/lib/organizations";

const FILTERS = Object.keys(REGISTRATION_STATUS_LABELS) as RegistrationStatus[];
const ACTIVE = ["pending", "approved", "waitlisted"];

function RegistrationList() {
  const params = useLocalSearchParams<{
    id?: string;
    status?: string;
    page?: string;
  }>();
  const id = param(params.id);
  const wanted = param(params.status);
  const status = FILTERS.includes(wanted as RegistrationStatus) ? wanted : "";
  const offset = pageOffset(param(params.page) || undefined);
  const page = useLoad(
    () => getActivityRegistrations(id, status, offset),
    [id, status, offset],
  );

  return (
    <Page refreshing={page.refreshing} onRefresh={() => page.reload(true)}>
      <BackTitle href={`/activities/${id}`}>Người đăng ký</BackTitle>
      <Segments
        items={[
          { value: "", label: "Tất cả" },
          ...FILTERS.map((filter) => ({
            value: filter,
            label: REGISTRATION_STATUS_LABELS[filter],
          })),
        ]}
        current={status}
        onChange={(value) =>
          router.setParams({ status: value || undefined, page: undefined })
        }
        label="Lọc theo trạng thái"
      />
      {page.loading ? (
        <Loading />
      ) : !page.data ? (
        <Text className={mutedText}>Chỉ ban quản trị mới xem được.</Text>
      ) : page.data.items.length === 0 ? (
        <EmptyState
          title="Chưa có ai"
          description="Người đăng ký sẽ hiện ở đây."
        />
      ) : (
        <View className={`${panel} px-4`}>
          {page.data.items.map((registration, index) => (
            <PersonRow
              key={registration.id}
              name={registration.full_name}
              first={index === 0}
              details={
                <>
                  <IconStat icon="calendar" label="Ngày đăng ký">
                    {`${formatDateTime(registration.registered_at)}${registration.shift_title ? ` · ${registration.shift_title}` : ""}`}
                  </IconStat>
                  {registration.note ? (
                    <Text className="font-body text-sm text-slate-700 dark:text-slate-300">
                      {registration.note}
                    </Text>
                  ) : null}
                </>
              }
              trailing={
                <View className="flex-row flex-wrap items-center gap-2">
                  <RegistrationBadge status={registration.status} />
                  {registration.status === "pending" ? (
                    <ActionButton
                      action={() => approveRegistration(registration.id)}
                      icon="check"
                      label="Duyệt"
                    />
                  ) : null}
                  {ACTIVE.includes(registration.status) ? (
                    <ActionButton
                      action={() => rejectRegistration(registration.id)}
                      icon="x"
                      label="Từ chối"
                      confirmLabel="Từ chối?"
                    />
                  ) : null}
                </View>
              }
            />
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

export default function RegistrationsScreen() {
  return <RequireUser>{() => <RegistrationList />}</RequireUser>;
}
