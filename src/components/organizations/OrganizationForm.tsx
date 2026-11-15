import { useState } from "react";
import { Text, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import type {
  OrganizationValues,
  PictureChoice,
} from "@/lib/organizationActions";
import {
  JOIN_POLICY_LABELS,
  LEGAL_STATUS_LABELS,
  ORG_TYPE_LABELS,
  type OrganizationDetail,
} from "@/lib/organizations";
import { follow } from "../common/ActionButton";
import Button from "../common/Button";
import SelectMenu, { optionsFrom } from "../common/SelectMenu";
import { FormMessage, RequiredLegend } from "../FormParts";
import { CheckRow, InputField, TextAreaField } from "../forms/Fields";
import FormSection from "../forms/FormSection";
import { mutedText, panel } from "../ui";
import { CreateGalleryField } from "./CreateGalleryField";
import PicturePicker, { type PickedPictures } from "./PicturePicker";

export type OrganizationSubmit = (
  values: OrganizationValues,
  logo: PictureChoice,
  cover: PictureChoice,
  listedPublicly: boolean,
  gallery: string[],
) => Promise<ActionResult>;

function startValues(
  organization?: OrganizationDetail,
  contact?: { email: string; phone: string | null },
): OrganizationValues {
  return {
    name: organization?.name ?? "",
    description: organization?.description ?? "",
    org_type: organization?.org_type ?? "organization",
    join_policy: organization?.join_policy ?? "invite",
    email: organization?.email ?? contact?.email ?? "",
    phone: organization?.phone ?? contact?.phone ?? "",
    website: organization?.website ?? "",
    address: organization?.address ?? "",
    city: organization?.city ?? "",
    legal_name: organization?.legal_name ?? "",
    tax_code: organization?.tax_code ?? "",
    license_number: organization?.license_number ?? "",
    legal_rep_name: organization?.legal_rep_name ?? "",
    legal_rep_position: organization?.legal_rep_position ?? "",
  };
}

// The create and settings form, ported from the web OrganizationForm.
export default function OrganizationForm({
  submit,
  organization,
  contactDefaults,
}: {
  submit: OrganizationSubmit;
  organization?: OrganizationDetail;
  contactDefaults?: { email: string; phone: string | null };
}) {
  const [values, setValues] = useState(() =>
    startValues(organization, contactDefaults),
  );
  const [listed, setListed] = useState(organization?.listed_publicly ?? true);
  const [pictures, setPictures] = useState<PickedPictures>({
    ids: [],
    logo: null,
    cover: null,
  });
  const [gallery, setGallery] = useState<string[]>([]);
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  const errors = state.fieldErrors;

  const set = (key: keyof OrganizationValues) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const field = (
    key: keyof OrganizationValues,
    label: string,
    options: Partial<Parameters<typeof InputField>[0]> = {},
  ) => (
    <InputField
      label={label}
      value={values[key]}
      onChangeText={set(key)}
      error={errors?.[key]}
      {...options}
    />
  );

  async function send() {
    setPending(true);
    try {
      // Pictures with no role, and the gallery field's files, join the gallery.
      const roles = new Set([pictures.logo, pictures.cover]);
      const extra = [...gallery, ...pictures.ids].filter(
        (id) => !roles.has(id),
      );
      const result = await submit(
        values,
        pictures.logo ?? undefined,
        pictures.cover ?? undefined,
        listed,
        [...new Set(extra)],
      );
      setState(result);
      follow(result, true);
    } catch {
      setState({ error: "Mất kết nối. Vui lòng thử lại." });
    } finally {
      setPending(false);
    }
  }

  return (
    <View className={`${panel} gap-6 p-4`}>
      <FormMessage state={state} />
      <RequiredLegend />
      <FormSection title="Thông tin chung" first>
        {field("name", "Tên tổ chức", { maxLength: 120, required: true })}
        <TextAreaField
          label="Giới thiệu"
          value={values.description}
          onChangeText={set("description")}
          maxLength={2000}
          error={errors?.description}
          required
        />
        <SelectMenu
          label="Loại tổ chức"
          value={values.org_type}
          onChange={set("org_type")}
          options={optionsFrom(ORG_TYPE_LABELS)}
        />
        <SelectMenu
          label="Cách tham gia"
          value={values.join_policy}
          onChange={set("join_policy")}
          options={optionsFrom(JOIN_POLICY_LABELS)}
        />
        {organization ? (
          <CheckRow
            label="Hiện trong danh sách tổ chức công khai"
            checked={listed}
            onChange={setListed}
          />
        ) : null}
      </FormSection>
      <FormSection title="Ảnh">
        <PicturePicker
          slug={organization?.slug}
          currentLogoUrl={organization?.logo_url}
          currentCoverUrl={organization?.cover_url}
          error={{ logo: errors?.logo, cover: errors?.cover }}
          onChange={setPictures}
        />
        {organization ? null : <CreateGalleryField onChange={setGallery} />}
      </FormSection>
      <FormSection title="Liên hệ">
        {field("email", "Email liên hệ", {
          keyboardType: "email-address",
          autoCapitalize: "none",
          required: true,
        })}
        {field("phone", "Số điện thoại", {
          keyboardType: "phone-pad",
          required: true,
        })}
        {contactDefaults ? (
          <Text className={mutedText}>
            Đã điền sẵn từ tài khoản của bạn. Thông tin này sẽ hiển thị công
            khai, bạn có thể đổi sang liên hệ riêng của tổ chức.
          </Text>
        ) : null}
        {field("website", "Website", {
          keyboardType: "url",
          autoCapitalize: "none",
          maxLength: 300,
          hint: "Bắt đầu bằng http:// hoặc https://",
        })}
        {field("address", "Địa chỉ", { maxLength: 500 })}
        {field("city", "Thành phố", { maxLength: 120, required: true })}
      </FormSection>
      <FormSection title="Pháp lý">
        {organization ? (
          <Text className={mutedText}>
            Trạng thái: {LEGAL_STATUS_LABELS[organization.legal_status]}
          </Text>
        ) : null}
        {field("legal_name", "Tên pháp lý", {
          maxLength: 200,
          hint: "Tên đăng ký trên giấy phép, nếu khác tên hiển thị",
        })}
        {field("tax_code", "Mã số thuế", {
          maxLength: 30,
          hint: "10 chữ số, hoặc 13 chữ số với chi nhánh",
        })}
        {field("license_number", "Số giấy phép hoặc quyết định thành lập", {
          maxLength: 200,
        })}
        {field("legal_rep_name", "Người đại diện pháp luật", {
          maxLength: 200,
        })}
        {field("legal_rep_position", "Chức vụ người đại diện", {
          maxLength: 200,
        })}
      </FormSection>
      <View className="self-start">
        <Button
          icon={organization ? "save" : "plus"}
          pending={pending}
          onPress={send}
        >
          {organization ? "Lưu thay đổi" : "Tạo tổ chức"}
        </Button>
      </View>
    </View>
  );
}
