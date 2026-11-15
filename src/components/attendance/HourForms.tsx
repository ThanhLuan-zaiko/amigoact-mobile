import { useState } from "react";
import { Text, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import type { HourRule } from "@/lib/attendance";
import { adjustHours, setHourRule } from "@/lib/attendanceApi";
import { checkFields } from "@/lib/formCheck";
import Button, { IconButton } from "../common/Button";
import { FormMessage } from "../FormParts";
import { InputField, TextAreaField } from "../forms/Fields";
import { panel, sectionTitle } from "../ui";

// Changes one person's hours on an activity, ported from the web AdjustHours.
export function AdjustHours({
  activityId,
  userId,
}: {
  activityId: string;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  if (!open) {
    return (
      <IconButton
        icon="edit-2"
        label="Điều chỉnh giờ"
        onPress={() => setOpen(true)}
      />
    );
  }
  async function send() {
    const found = checkFields({ delta_hours: delta }, ["delta_hours"]);
    if (Object.keys(found).length > 0) {
      setState({ fieldErrors: found });
      return;
    }
    setPending(true);
    const result = await adjustHours(activityId, userId, delta, reason);
    setPending(false);
    setState(result);
  }
  return (
    <View className="w-full gap-2">
      <FormMessage state={state} />
      <InputField
        label="Số giờ thay đổi"
        value={delta}
        onChangeText={setDelta}
        numeric="signed-decimal"
        hint="Ví dụ 1.5 hoặc -2"
        error={state.fieldErrors?.delta_hours}
        required
      />
      <TextAreaField
        label="Lý do"
        value={reason}
        onChangeText={setReason}
        rows={2}
        maxLength={1000}
        error={state.fieldErrors?.reason}
      />
      <View className="flex-row items-center gap-2">
        <Button icon="save" pending={pending} onPress={send}>
          Lưu
        </Button>
        <IconButton icon="x" label="Hủy" onPress={() => setOpen(false)} />
      </View>
    </View>
  );
}

// The organization's hour rule, ported from the web HourRuleForm.
export function HourRuleForm({ slug, rule }: { slug: string; rule: HourRule }) {
  const [multiplier, setMultiplier] = useState(String(rule.multiplier));
  const [cap, setCap] = useState(rule.cap_hours?.toString() ?? "");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  async function send() {
    const found = checkFields({ multiplier, cap_hours: cap }, ["multiplier"]);
    if (Object.keys(found).length > 0) {
      setState({ fieldErrors: found });
      return;
    }
    setPending(true);
    setState(await setHourRule(slug, multiplier, cap));
    setPending(false);
  }
  return (
    <View className={`${panel} gap-4 p-4`}>
      <Text accessibilityRole="header" className={sectionTitle}>
        Quy tắc tính giờ
      </Text>
      <FormMessage state={state} />
      <InputField
        label="Hệ số"
        value={multiplier}
        onChangeText={setMultiplier}
        numeric="decimal"
        hint="Nhân với số giờ của mỗi hoạt động"
        error={state.fieldErrors?.multiplier}
        required
      />
      <InputField
        label="Giới hạn giờ mỗi kỳ"
        value={cap}
        onChangeText={setCap}
        numeric="decimal"
        hint="Mỗi người, mỗi nửa năm. Bỏ trống nếu không giới hạn"
        error={state.fieldErrors?.cap_hours}
      />
      <View className="self-start">
        <Button icon="save" pending={pending} onPress={send}>
          Lưu
        </Button>
      </View>
    </View>
  );
}
