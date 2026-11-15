import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { IconButton } from "@/components/common/Button";
import EmptyState, {
  IconStat,
  LoadError,
  Loading,
} from "@/components/common/States";
import RequireUser from "@/components/RequireUser";
import Page, { PageTitle } from "@/components/shell/Page";
import {
  mutedText,
  panel,
  strongText,
  tagChip,
  tagChipText,
} from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { hoursText } from "@/lib/attendance";
import { getMyCertificates } from "@/lib/certificateApi";
import { CERTIFICATE_STATUS_LABELS } from "@/lib/certificates";
import { formatDate } from "@/lib/organizations";

function MyCertificatesContent() {
  const certificates = useLoad(() => getMyCertificates(), []);
  const list = certificates.data;
  return (
    <Page
      refreshing={certificates.refreshing}
      onRefresh={() => certificates.reload(true)}
    >
      <PageTitle>Chứng nhận của tôi</PageTitle>
      <Text className={mutedText}>
        Mỗi chứng nhận có số serial riêng. Ai có số serial cũng xác minh được
        tại trang xác minh công khai.
      </Text>
      {certificates.loading ? (
        <Loading />
      ) : !list ? (
        <LoadError />
      ) : list.length === 0 ? (
        <EmptyState
          title="Chưa có chứng nhận nào"
          description="Chứng nhận được cấp sau khi hoạt động bạn đã điểm danh kết thúc."
        />
      ) : (
        <View className={`${panel} px-4`}>
          {list.map((certificate, index) => (
            <View
              key={certificate.id}
              className={`flex-row items-start gap-3 py-3 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
            >
              <View className="min-w-0 flex-1 gap-1">
                <Pressable
                  onPress={() =>
                    router.push(
                      `/activities/${certificate.activity_id}` as never,
                    )
                  }
                  accessibilityRole="link"
                >
                  <Text className={strongText}>
                    {certificate.activity_title}
                  </Text>
                </Pressable>
                <Text
                  selectable
                  className="font-mono text-xs text-slate-600 dark:text-slate-400"
                >
                  {certificate.serial_no}
                </Text>
                <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                  <IconStat icon="users" label="Tổ chức">
                    {certificate.organization_name}
                  </IconStat>
                  <IconStat icon="clock" label="Số giờ">
                    {hoursText(certificate.hours)}
                  </IconStat>
                  <IconStat icon="calendar" label="Ngày cấp">
                    {formatDate(certificate.issued_at)}
                  </IconStat>
                </View>
              </View>
              <View className={tagChip}>
                <Text className={tagChipText}>
                  {CERTIFICATE_STATUS_LABELS[certificate.status]}
                </Text>
              </View>
              <IconButton
                icon="external-link"
                label="Xem và in"
                onPress={() =>
                  router.push(
                    `/certificates/verify/${encodeURIComponent(certificate.serial_no)}` as never,
                  )
                }
              />
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}

export default function MyCertificatesScreen() {
  return <RequireUser>{() => <MyCertificatesContent />}</RequireUser>;
}
