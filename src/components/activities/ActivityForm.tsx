import { useState } from "react";
import { View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import { type ActivityDetail, toLocalInput } from "@/lib/activities";
import type { ActivityValues } from "@/lib/activityActions";
import { checkFields } from "@/lib/formCheck";
import { tagListError } from "@/lib/posts";
import { tagFieldValue } from "@/lib/tagInput";
import { FIELD_MESSAGES } from "@/lib/validation";
import { follow } from "../common/ActionButton";
import Button from "../common/Button";
import TagInput from "../compose/TagInput";
import { FormMessage, RequiredLegend } from "../FormParts";
import DateField from "../forms/DateField";
import { CheckRow, InputField, TextAreaField } from "../forms/Fields";
import FormSection from "../forms/FormSection";
import { panel } from "../ui";

type TextKey = Exclude<
  keyof ActivityValues,
  "is_remote" | "requires_approval" | "tags"
>;

function startValues(activity?: ActivityDetail): Omit<ActivityValues, "tags"> {
  return {
    title: activity?.title ?? "",
    description: activity?.description ?? "",
    location: activity?.location ?? "",
    address: activity?.address ?? "",
    city: activity?.city ?? "",
    is_remote: activity?.is_remote ?? false,
    start_at: toLocalInput(activity?.start_at ?? null),
    end_at: toLocalInput(activity?.end_at ?? null),
    registration_deadline: toLocalInput(
      activity?.registration_deadline ?? null,
    ),
    max_participants: activity?.max_participants?.toString() ?? "",
    hours_awarded: activity?.hours_awarded?.toString() ?? "",
    requires_approval: activity?.requires_approval ?? false,
  };
}

// The create and edit form of an activity, ported from the web ActivityForm.
export default function ActivityForm({
  submit,
  orgSlug,
  activity,
}: {
  submit: (values: ActivityValues, publish: boolean) => Promise<ActionResult>;
  orgSlug: string;
  activity?: ActivityDetail;
}) {
  const [values, setValues] = useState(() => startValues(activity));
  const [tags, setTags] = useState<string[]>(activity?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  const errors = state.fieldErrors;
  const set = (key: TextKey) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function send(publish: boolean) {
    const tagText = tagFieldValue(tags, tagDraft);
    const { is_remote: _r, requires_approval: _a, ...text } = values;
    // A remote activity has no place, so the place is required only for the others.
    const required = ["title", "start_at", "end_at", "hours_awarded", "city"];
    if (!values.is_remote) required.push("location");
    const found = checkFields(text, required);
    if (!values.description.trim()) found.description = FIELD_MESSAGES.required;
    const tagError = tagListError(tagText);
    if (tagError) found.tags = tagError;
    if (Object.keys(found).length > 0) {
      setState({ fieldErrors: found });
      return;
    }
    setPending(true);
    try {
      const result = await submit({ ...values, tags: tagText }, publish);
      setState(result);
      follow(result, true);
    } catch {
      setState({ error: "Mất kết nối. Vui lòng thử lại." });
    } finally {
      setPending(false);
    }
  }

  const date = (key: TextKey, label: string, required = false) => (
    <DateField
      label={label}
      value={values[key]}
      onChange={set(key)}
      error={errors?.[key]}
      required={required}
    />
  );

  return (
    <View className={`${panel} gap-6 p-4`}>
      <FormMessage state={state} />
      <RequiredLegend />
      <FormSection title="Nội dung" first>
        <InputField
          label="Tên hoạt động"
          value={values.title}
          onChangeText={set("title")}
          maxLength={200}
          error={errors?.title}
          required
        />
        <TextAreaField
          label="Mô tả"
          value={values.description}
          onChangeText={set("description")}
          rows={5}
          maxLength={5000}
          error={errors?.description}
          required
        />
        <TagInput
          orgSlug={orgSlug}
          source="activity"
          tags={tags}
          draft={tagDraft}
          onChange={(nextTags, nextDraft) => {
            setTags(nextTags);
            setTagDraft(nextDraft);
          }}
          error={errors?.tags}
        />
      </FormSection>
      <FormSection title="Thời gian">
        {date("start_at", "Bắt đầu", true)}
        {date("end_at", "Kết thúc", true)}
        {date("registration_deadline", "Hạn đăng ký")}
        <InputField
          label="Giờ tình nguyện"
          value={values.hours_awarded}
          onChangeText={set("hours_awarded")}
          numeric="decimal"
          error={errors?.hours_awarded}
          required
        />
      </FormSection>
      <FormSection title="Địa điểm">
        <CheckRow
          label="Trực tuyến"
          checked={values.is_remote}
          onChange={(on) =>
            setValues((current) => ({ ...current, is_remote: on }))
          }
        />
        <InputField
          label="Địa điểm"
          value={values.location}
          onChangeText={set("location")}
          maxLength={200}
          error={errors?.location}
          required={!values.is_remote}
        />
        <InputField
          label="Thành phố"
          value={values.city}
          onChangeText={set("city")}
          maxLength={120}
          error={errors?.city}
          required
        />
        <InputField
          label="Địa chỉ"
          value={values.address}
          onChangeText={set("address")}
          maxLength={500}
          error={errors?.address}
        />
      </FormSection>
      <FormSection title="Đăng ký">
        <InputField
          label="Số chỗ"
          value={values.max_participants}
          onChangeText={set("max_participants")}
          numeric="integer"
          hint="Bỏ trống nếu không giới hạn. Khi có ca, số chỗ tính theo từng ca."
          error={errors?.max_participants}
        />
        <CheckRow
          label="Cần duyệt người đăng ký"
          checked={values.requires_approval}
          onChange={(on) =>
            setValues((current) => ({ ...current, requires_approval: on }))
          }
        />
      </FormSection>
      <View className="flex-row flex-wrap gap-3">
        {activity ? (
          <Button icon="save" pending={pending} onPress={() => send(false)}>
            Lưu
          </Button>
        ) : (
          <>
            <Button icon="send" pending={pending} onPress={() => send(true)}>
              Đăng ngay
            </Button>
            <Button
              variant="secondary"
              icon="save"
              disabled={pending}
              onPress={() => send(false)}
            >
              Lưu nháp
            </Button>
          </>
        )}
      </View>
    </View>
  );
}
