import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Text, View } from "react-native";
import CertificatePreview from "@/components/certificates/CertificatePreview";
import VerifyForm from "@/components/certificates/VerifyForm";
import { IconButton } from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { IconStat, Loading } from "@/components/common/States";
import Page, { PageTitle } from "@/components/shell/Page";
import { mutedText, panel, sectionTitle } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { formatDateTime } from "@/lib/activities";
import { param } from "@/lib/appPath";
import { hoursText } from "@/lib/attendance";
import { verifyCertificate } from "@/lib/certificateApi";
import {
  CERTIFICATE_STATUS_LABELS,
  certificateTexts,
  isSerialShape,
  normalizeSerial,
  printableDesign,
  type VerifiedCertificate,
} from "@/lib/certificates";
import { gatewayUrl } from "@/lib/http";
import { formatDate } from "@/lib/organizations";

function Found({ certificate }: { certificate: VerifiedCertificate }) {
  const issued = certificate.status === "issued";
  const design = printableDesign(certificate);
  return (
    <>
      <View className={`${panel} gap-5 p-4`}>
        <View className="flex-row flex-wrap items-center gap-3">
          <View
            className={`flex-row items-center gap-2 rounded-md px-3 py-1.5 ${issued ? "bg-green-50 dark:bg-green-950/40" : "bg-amber-50 dark:bg-amber-950/40"}`}
          >
            <Icon
              name={issued ? "check-circle" : "alert-triangle"}
              tone={issued ? "success" : "warning"}
            />
            <Text
              className={`font-body-semibold text-sm ${issued ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}
            >
              {CERTIFICATE_STATUS_LABELS[certificate.status]}
            </Text>
          </View>
          <Text
            selectable
            className="font-mono text-sm text-slate-600 dark:text-slate-400"
          >
            {certificate.serial_no}
          </Text>
          {issued ? (
            // The phone opens the PDF in its viewer, which also prints and shares it.
            <IconButton
              icon="download"
              label="Tải PDF"
              className="ml-auto"
              onPress={() =>
                WebBrowser.openBrowserAsync(
                  gatewayUrl(
                    `/certificates/verify/${encodeURIComponent(certificate.serial_no)}/pdf`,
                  ),
                )
              }
            />
          ) : null}
        </View>
        <View className="gap-1">
          <Text className={mutedText}>Chứng nhận</Text>
          <Text className="font-body-semibold text-2xl text-slate-900 dark:text-slate-100">
            {certificate.full_name}
          </Text>
          <Text className={mutedText}>đã tham gia hoạt động</Text>
          <Text className="font-body-semibold text-lg text-slate-900 dark:text-slate-100">
            {certificate.activity_title}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-x-5 gap-y-2">
          <IconStat icon="users" label="Tổ chức">
            {certificate.organization_name}
          </IconStat>
          <IconStat icon="clock" label="Số giờ">
            {hoursText(certificate.hours)}
          </IconStat>
          {certificate.activity_start_at ? (
            <IconStat icon="calendar" label="Thời gian hoạt động">
              {formatDateTime(certificate.activity_start_at)}
            </IconStat>
          ) : null}
          <IconStat icon="calendar" label="Ngày cấp">
            {formatDate(certificate.issued_at)}
          </IconStat>
        </View>
        {certificate.revoked_at ? (
          <Text className="font-body-semibold text-sm text-amber-700 dark:text-amber-400">
            Chứng nhận đã bị thu hồi ngày {formatDate(certificate.revoked_at)}.
          </Text>
        ) : null}
      </View>
      {design ? (
        <View className="gap-2">
          <Text accessibilityRole="header" className={sectionTitle}>
            Bản in
          </Text>
          <CertificatePreview
            layout={design.layout}
            backgroundUrl={design.background_url}
            label={`Chứng nhận của ${certificate.full_name}`}
            texts={certificateTexts(certificate)}
          />
        </View>
      ) : null}
    </>
  );
}

// Public: it shows only what proves the certificate, never contact details.
export default function VerifyCertificateScreen() {
  const typed = normalizeSerial(
    param(useLocalSearchParams<{ serial?: string }>().serial),
  );
  const result = useLoad(
    async () =>
      isSerialShape(typed)
        ? verifyCertificate(typed)
        : { certificate: null, rateLimited: false },
    [typed],
  );
  const data = result.data;
  return (
    <Page refreshing={result.refreshing} onRefresh={() => result.reload(true)}>
      <PageTitle>Xác minh chứng nhận</PageTitle>
      {!data ? (
        <Loading />
      ) : data.certificate ? (
        <Found certificate={data.certificate} />
      ) : (
        <View className={`${panel} gap-3 p-4`}>
          {"rateLimited" in data && data.rateLimited ? (
            <>
              <Text accessibilityRole="header" className={sectionTitle}>
                Tra cứu quá nhiều lần
              </Text>
              <Text className={mutedText}>
                Bạn đã tra cứu quá nhiều lần trong một phút. Vui lòng đợi một
                lúc rồi thử lại.
              </Text>
            </>
          ) : (
            <>
              <Text accessibilityRole="header" className={sectionTitle}>
                Không tìm thấy chứng nhận
              </Text>
              <Text className={mutedText}>
                Không có chứng nhận nào với số serial{" "}
                <Text className="font-mono">{typed}</Text>. Hãy kiểm tra lại
                từng ký tự.
              </Text>
            </>
          )}
          <VerifyForm defaultValue={typed} />
        </View>
      )}
    </Page>
  );
}
