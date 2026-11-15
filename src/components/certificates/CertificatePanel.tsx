import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import type { ActionResult } from "@/lib/actionResult";
import { hoursText } from "@/lib/attendance";
import {
  getActivityCertificates,
  getTemplates,
  issueCertificates,
  reinstateCertificate,
  revokeCertificate,
} from "@/lib/certificateApi";
import {
  CERTIFICATE_STATUS_LABELS,
  type CertificateTemplate,
  reasonError,
} from "@/lib/certificates";
import { formatDate } from "@/lib/organizations";
import ActionButton from "../common/ActionButton";
import Button, { IconButton } from "../common/Button";
import Icon from "../common/Icon";
import InlineReasonForm from "../common/InlineForm";
import SelectMenu from "../common/SelectMenu";
import { IconStat } from "../common/States";
import { FormMessage } from "../FormParts";
import {
  mutedText,
  panel,
  sectionTitle,
  strongText,
  tagChip,
  tagChipText,
} from "../ui";

// Issues a certificate to everyone who attended and has none yet.
function IssueForm({
  activityId,
  templates,
}: {
  activityId: string;
  templates: CertificateTemplate[];
}) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  return (
    <View className="gap-3">
      <FormMessage state={state} />
      {templates.length > 0 ? (
        <SelectMenu
          label="Mẫu"
          value={templateId}
          onChange={setTemplateId}
          options={[
            ...templates.map((template) => ({
              value: template.id,
              label: template.name,
            })),
            { value: "", label: "Không dùng mẫu" },
          ]}
        />
      ) : null}
      <View className="self-start">
        <Button
          icon="award"
          pending={pending}
          onPress={async () => {
            setPending(true);
            setState(await issueCertificates(activityId, templateId));
            setPending(false);
          }}
        >
          Cấp chứng nhận
        </Button>
      </View>
    </View>
  );
}

// For managers of a completed activity: issue certificates to everyone who
// attended, then revoke or reinstate one.
export default function CertificatePanel({
  activityId,
  organizationSlug,
}: {
  activityId: string;
  organizationSlug: string;
}) {
  const data = useLoad(async () => {
    const [list, templates] = await Promise.all([
      getActivityCertificates(activityId),
      getTemplates(organizationSlug),
    ]);
    return { list, templates };
  }, [activityId, organizationSlug]);
  const list = data.data?.list;
  if (!list) return null;
  const active = (data.data?.templates ?? []).filter(
    (template) => template.is_active,
  );

  return (
    <View className={`${panel} gap-4 p-4`}>
      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
        <View className="flex-1 flex-row items-center gap-2">
          <Icon name="award" />
          <Text accessibilityRole="header" className={sectionTitle}>
            Chứng nhận
          </Text>
        </View>
        <IconStat icon="award" label="Đã cấp">
          {list.items.length}
        </IconStat>
        <IconStat icon="user-plus" label="Chưa có chứng nhận">
          {list.missing_count}
        </IconStat>
      </View>
      {list.missing_count > 0 ? (
        <IssueForm activityId={activityId} templates={active} />
      ) : (
        <Text className={mutedText}>
          Mọi người đã tham gia đều có chứng nhận. Người được chấp nhận khiếu
          nại sẽ hiện ở đây để cấp tiếp.
        </Text>
      )}
      {active.length === 0 && list.missing_count > 0 ? (
        <View className="flex-row flex-wrap items-center gap-1">
          <Text className={mutedText}>Chưa có mẫu đang dùng.</Text>
          <Pressable
            onPress={() =>
              router.push(`/org/${organizationSlug}/certificates/new` as never)
            }
            accessibilityRole="link"
          >
            <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
              Tạo mẫu chứng nhận
            </Text>
          </Pressable>
        </View>
      ) : null}
      {list.items.map((item, index) => (
        <View
          key={item.id}
          className={`flex-row flex-wrap items-start gap-x-3 gap-y-2 py-3 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
        >
          <View className="min-w-0 flex-1 basis-48 gap-1">
            <Text className={strongText}>{item.full_name}</Text>
            <Text
              selectable
              className="font-mono text-xs text-slate-600 dark:text-slate-400"
            >
              {item.serial_no}
            </Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              <IconStat icon="clock" label="Số giờ">
                {hoursText(item.hours)}
              </IconStat>
              <IconStat icon="calendar" label="Ngày cấp">
                {formatDate(item.issued_at)}
              </IconStat>
            </View>
          </View>
          <View className={tagChip}>
            <Text className={tagChipText}>
              {CERTIFICATE_STATUS_LABELS[item.status]}
            </Text>
          </View>
          <View className="flex-row flex-wrap items-start gap-2">
            <IconButton
              icon="external-link"
              label="Xem trang xác minh"
              onPress={() =>
                router.push(
                  `/certificates/verify/${encodeURIComponent(item.serial_no)}` as never,
                )
              }
            />
            {item.status === "issued" ? (
              <InlineReasonForm
                openIcon="slash"
                openLabel="Thu hồi chứng nhận"
                fieldLabel="Lý do thu hồi"
                hint="Từ 5 ký tự. Người nhận không thấy lý do trên trang xác minh."
                rows={2}
                required
                submitIcon="slash"
                submitLabel="Thu hồi"
                submitVariant="neutral"
                validate={reasonError}
                submit={(reason) => revokeCertificate(item.id, reason)}
              />
            ) : (
              <ActionButton
                action={() => reinstateCertificate(item.id)}
                icon="rotate-ccw"
                label="Hoàn tác thu hồi"
                confirmLabel="Cho chứng nhận có hiệu lực lại?"
              />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
