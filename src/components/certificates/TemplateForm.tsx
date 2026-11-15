import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import { appPath } from "@/lib/appPath";
import {
  type CertificateTemplate,
  DEFAULT_LAYOUT,
  type Layout,
  layoutErrors,
  PLACEMENT_KEYS,
  PLACEMENT_LABELS,
  placementField,
  templateNameError,
  updatePlacement,
} from "@/lib/certificates";
import { pickMedia } from "@/lib/filePicker";
import { uploadMessage } from "@/lib/forms";
import { uploadMedia } from "@/lib/http";
import {
  isPictureTooLarge,
  PICTURE_ACCEPT,
  PICTURE_MAX_MB,
} from "@/lib/pictureRules";
import { follow } from "../common/ActionButton";
import Button, { IconButton } from "../common/Button";
import { ErrorLine } from "../common/States";
import { FormMessage } from "../FormParts";
import { InputField } from "../forms/Fields";
import { fieldLabel, panel, sectionTitle, smallMuted, strongText } from "../ui";
import CertificatePreview from "./CertificatePreview";

function startFields(layout: Layout): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const key of PLACEMENT_KEYS) {
    for (const part of ["x", "y", "size"] as const) {
      fields[placementField(key, part)] = String(layout[key][part]);
    }
  }
  return fields;
}

export type TemplateSubmit = (
  name: string,
  background: string | null | undefined,
  layout: Record<string, string>,
) => Promise<ActionResult>;

// Name, background and the place of each text, with a preview above that
// follows the inputs, ported from the web TemplateForm.
export default function TemplateForm({
  submit,
  cancelHref,
  template,
}: {
  submit: TemplateSubmit;
  cancelHref: string;
  template?: CertificateTemplate;
}) {
  const saved = template?.layout ?? DEFAULT_LAYOUT;
  const [name, setName] = useState(template?.name ?? "");
  const [fields, setFields] = useState(() => startFields(saved));
  const [layout, setLayout] = useState<Layout>(saved);
  const [preview, setPreview] = useState<string | null>(
    template?.background_url ?? null,
  );
  // An asset id replaces the picture, null removes it, undefined keeps it.
  const [background, setBackground] = useState<string | null | undefined>(
    undefined,
  );
  const [busy, setBusy] = useState(false);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);

  async function choose() {
    const [file] = await pickMedia("images", false);
    if (!file) return;
    if (!PICTURE_ACCEPT.split(",").includes(file.type)) {
      setPictureError("Ảnh phải là JPEG, PNG hoặc WEBP.");
      return;
    }
    if (isPictureTooLarge(file.size ?? 0)) {
      setPictureError(`Ảnh tối đa ${PICTURE_MAX_MB} MB.`);
      return;
    }
    setBusy(true);
    setPictureError(null);
    const result = await uploadMedia(file);
    setBusy(false);
    if (!result.ok) {
      setPictureError(uploadMessage(result.code));
      return;
    }
    setBackground(result.id);
    setPreview(file.uri);
  }

  async function send() {
    const errors = layoutErrors((field) => fields[field] ?? "");
    const nameError = templateNameError(name);
    if (nameError) errors.template_name = nameError;
    if (Object.keys(errors).length > 0) {
      setState({ fieldErrors: errors });
      return;
    }
    setPending(true);
    const result = await submit(name, background, fields);
    setPending(false);
    setState(result);
    follow(result, true);
  }

  const hasPicture = preview !== null;
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text accessibilityRole="header" className={sectionTitle}>
          Xem trước
        </Text>
        <CertificatePreview
          layout={layout}
          backgroundUrl={preview}
          label="Xem trước mẫu chứng nhận"
        />
      </View>
      <View className={`${panel} gap-5 p-4`}>
        <FormMessage state={state} />
        <InputField
          label="Tên mẫu"
          value={name}
          onChangeText={setName}
          maxLength={120}
          error={state.fieldErrors?.template_name}
          required
        />
        <View className="gap-2">
          <Text className={fieldLabel}>Ảnh nền</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <Button
              variant="neutral"
              icon="upload-cloud"
              pending={busy}
              onPress={choose}
            >
              {busy ? "Đang tải lên…" : hasPicture ? "Đổi ảnh" : "Chọn ảnh"}
            </Button>
            {hasPicture ? (
              <IconButton
                icon="trash-2"
                label="Gỡ ảnh nền"
                onPress={() => {
                  setBackground(template?.background_url ? null : undefined);
                  setPreview(null);
                }}
              />
            ) : null}
          </View>
          <Text className={smallMuted}>
            JPEG, PNG, WEBP, tối đa {PICTURE_MAX_MB} MB. Nên dùng ảnh ngang tỉ
            lệ A4. Ảnh nền sẽ công khai để người nhận in được.
          </Text>
          <ErrorLine>{pictureError}</ErrorLine>
        </View>
        <View className="gap-4">
          <Text className={fieldLabel}>Bố cục</Text>
          <Text className={smallMuted}>
            X tính từ trái, Y tính từ trên, theo phần trăm khổ giấy. Chữ được
            căn giữa tại điểm đó.
          </Text>
          {PLACEMENT_KEYS.map((key, index) => (
            <View
              key={key}
              className={`gap-2 ${index > 0 ? "border-t border-slate-200 pt-3 dark:border-slate-800" : ""}`}
            >
              <Text className={strongText}>{PLACEMENT_LABELS[key]}</Text>
              <View className="flex-row gap-2">
                {(["x", "y", "size"] as const).map((part) => {
                  const field = placementField(key, part);
                  return (
                    <View key={part} className="flex-1">
                      <InputField
                        label={
                          part === "x"
                            ? "X (%)"
                            : part === "y"
                              ? "Y (%)"
                              : "Cỡ chữ"
                        }
                        value={fields[field] ?? ""}
                        onChangeText={(value) => {
                          setFields((current) => ({
                            ...current,
                            [field]: value,
                          }));
                          setLayout((current) =>
                            updatePlacement(current, field, value),
                          );
                        }}
                        numeric={part === "size" ? "integer" : "decimal"}
                        error={state.fieldErrors?.[field]}
                        required
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          <Button icon="save" pending={pending} onPress={send}>
            {template ? "Lưu mẫu" : "Tạo mẫu"}
          </Button>
          <IconButton
            icon="x"
            label="Hủy"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace(appPath(cancelHref) as never);
            }}
          />
        </View>
      </View>
    </View>
  );
}
