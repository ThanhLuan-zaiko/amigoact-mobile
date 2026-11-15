import { useState } from "react";
import { View } from "react-native";
import type { User } from "@/lib/account";
import { type ProfileValues, updateProfile } from "@/lib/accountApi";
import type { ActionResult } from "@/lib/actionResult";
import { checkFields } from "@/lib/formCheck";
import { useAuth } from "../AuthProvider";
import Button from "../common/Button";
import SelectMenu from "../common/SelectMenu";
import { FormMessage, RequiredLegend } from "../FormParts";
import DateField from "../forms/DateField";
import { InputField } from "../forms/Fields";
import { panel } from "../ui";

const GENDERS = [
  { value: "", label: "Chưa chọn" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
  { value: "unspecified", label: "Không muốn nêu" },
];

// Ported from the web ProfileForm. The saved values stay on screen.
export default function ProfileForm({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const [values, setValues] = useState<ProfileValues>({
    full_name: user.full_name,
    phone: user.phone ?? "",
    date_of_birth: user.date_of_birth ?? "",
    gender: user.gender ?? "",
    address: user.address ?? "",
    company_name: user.company_name ?? "",
    tax_code: user.tax_code ?? "",
    legal_rep_name: user.legal_rep_name ?? "",
    legal_rep_id: user.legal_rep_id ?? "",
    legal_rep_position: user.legal_rep_position ?? "",
  });
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  const business = user.account_type === "business";
  const set = (key: keyof ProfileValues) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const errors = state.fieldErrors;

  async function send() {
    const checked: Record<string, string> = {
      full_name: values.full_name,
      phone: values.phone,
      date_of_birth: values.date_of_birth,
    };
    if (business) {
      checked.company_name = values.company_name;
      checked.tax_code = values.tax_code;
      checked.legal_rep_id = values.legal_rep_id;
    }
    const found = checkFields(
      checked,
      business ? ["full_name", "company_name", "tax_code"] : ["full_name"],
    );
    if (Object.keys(found).length > 0) {
      setState({ fieldErrors: found });
      return;
    }
    setPending(true);
    const result = await updateProfile(user, values);
    setPending(false);
    setState(result);
    if (result.success) refreshUser();
  }

  const field = (
    key: keyof ProfileValues,
    label: string,
    extra: Partial<Parameters<typeof InputField>[0]> = {},
  ) => (
    <InputField
      label={label}
      value={values[key]}
      onChangeText={set(key)}
      error={errors?.[key]}
      {...extra}
    />
  );

  return (
    <View className={`${panel} gap-4 p-4`}>
      <FormMessage state={state} />
      <RequiredLegend />
      {field("full_name", "Họ và tên", {
        maxLength: 120,
        required: true,
        autoCapitalize: "words",
      })}
      {field("phone", "Số điện thoại", { keyboardType: "phone-pad" })}
      <DateField
        label="Ngày sinh"
        mode="date"
        value={values.date_of_birth}
        onChange={set("date_of_birth")}
        error={errors?.date_of_birth}
      />
      <SelectMenu
        label="Giới tính"
        value={values.gender}
        onChange={set("gender")}
        options={GENDERS}
      />
      {field("address", "Địa chỉ", { maxLength: 500 })}
      {business ? (
        <View className="gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          {field("company_name", "Tên đơn vị", { required: true })}
          {field("tax_code", "Mã số thuế", { required: true })}
          {field("legal_rep_name", "Người đại diện pháp luật")}
          {field("legal_rep_id", "Số giấy tờ người đại diện")}
          {field("legal_rep_position", "Chức vụ người đại diện")}
        </View>
      ) : null}
      <View className="self-start">
        <Button icon="save" pending={pending} onPress={send}>
          Lưu thay đổi
        </Button>
      </View>
    </View>
  );
}
