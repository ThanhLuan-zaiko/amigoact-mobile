import { useState } from "react";
import { Text, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import {
  formatDateTime,
  type Shift,
  seatsText,
  toLocalInput,
} from "@/lib/activities";
import {
  createShift,
  deleteShift,
  type ShiftValues,
  updateShift,
} from "@/lib/activityActions";
import { checkFields } from "@/lib/formCheck";
import ActionButton from "../common/ActionButton";
import Button, { IconButton } from "../common/Button";
import { IconStat } from "../common/States";
import { FormMessage } from "../FormParts";
import DateField from "../forms/DateField";
import { InputField } from "../forms/Fields";
import { panel, sectionTitle, strongText } from "../ui";

function ShiftForm({
  activityId,
  shift,
  onCancel,
}: {
  activityId: string;
  shift?: Shift;
  onCancel?: () => void;
}) {
  const empty: ShiftValues = {
    title: shift?.title ?? "",
    capacity: shift?.capacity?.toString() ?? "",
    start_at: toLocalInput(shift?.start_at ?? null),
    end_at: toLocalInput(shift?.end_at ?? null),
  };
  const [values, setValues] = useState(empty);
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  const set = (key: keyof ShiftValues) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function send() {
    const found = checkFields(
      {
        shift_title: values.title,
        capacity: values.capacity,
        start_at: values.start_at,
        end_at: values.end_at,
      },
      ["shift_title", "capacity", "start_at", "end_at"],
    );
    if (Object.keys(found).length > 0) {
      setState({ fieldErrors: found });
      return;
    }
    setPending(true);
    const result = shift
      ? await updateShift(activityId, shift.id, values)
      : await createShift(activityId, values);
    setPending(false);
    setState(result);
    if (result.success && !shift) setValues(empty);
  }

  const errors = state.fieldErrors;
  return (
    <View className="gap-3">
      <FormMessage state={state} />
      <InputField
        label="Tên ca"
        value={values.title}
        onChangeText={set("title")}
        maxLength={120}
        error={errors?.shift_title ?? errors?.title}
        required
      />
      <InputField
        label="Số chỗ"
        value={values.capacity}
        onChangeText={set("capacity")}
        numeric="integer"
        error={errors?.capacity}
        required
      />
      <DateField
        label="Bắt đầu"
        value={values.start_at}
        onChange={set("start_at")}
        error={errors?.start_at}
        required
      />
      <DateField
        label="Kết thúc"
        value={values.end_at}
        onChange={set("end_at")}
        error={errors?.end_at}
        required
      />
      <View className="flex-row items-center gap-2">
        <Button icon={shift ? "save" : "plus"} pending={pending} onPress={send}>
          {shift ? "Lưu" : "Thêm ca"}
        </Button>
        {onCancel ? (
          <IconButton icon="x" label="Hủy" onPress={onCancel} />
        ) : null}
      </View>
    </View>
  );
}

function ShiftRow({ activityId, shift }: { activityId: string; shift: Shift }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <View className="py-3">
        <ShiftForm
          activityId={activityId}
          shift={shift}
          onCancel={() => setEditing(false)}
        />
      </View>
    );
  }
  return (
    <View className="flex-row flex-wrap items-center gap-3 py-3">
      <View className="min-w-0 flex-1 basis-48 gap-1">
        <Text numberOfLines={1} className={strongText}>
          {shift.title}
        </Text>
        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
          <IconStat icon="calendar" label="Thời gian">
            {`${formatDateTime(shift.start_at)} – ${formatDateTime(shift.end_at)}`}
          </IconStat>
          <IconStat icon="users" label="Số chỗ">
            {seatsText(shift.seats_taken, shift.capacity)}
          </IconStat>
        </View>
      </View>
      <IconButton
        icon="edit-2"
        label="Sửa ca"
        onPress={() => setEditing(true)}
      />
      <ActionButton
        action={() => deleteShift(activityId, shift.id)}
        icon="trash-2"
        label="Xóa ca"
        confirmLabel="Xóa ca này?"
      />
    </View>
  );
}

// The shifts of an activity, ported from the web ShiftEditor.
export default function ShiftEditor({
  activityId,
  shifts,
}: {
  activityId: string;
  shifts: Shift[];
}) {
  return (
    <View className={`${panel} gap-3 p-4`}>
      <Text accessibilityRole="header" className={sectionTitle}>
        Ca
      </Text>
      {shifts.map((shift, index) => (
        <View
          key={shift.id}
          className={
            index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""
          }
        >
          <ShiftRow activityId={activityId} shift={shift} />
        </View>
      ))}
      <View className="border-t border-slate-200 pt-4 dark:border-slate-800">
        <ShiftForm key={shifts.length} activityId={activityId} />
      </View>
    </View>
  );
}
