import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import { deleteOrganization } from "@/lib/organizationActions";
import { follow } from "../common/ActionButton";
import Button from "../common/Button";
import { FormMessage } from "../FormParts";
import { fieldLabel, inputField, mutedText, panel, sectionTitle } from "../ui";

// Only the owner sees this panel. The action is a soft delete: the
// organization goes to the trash and can be restored there. The button stays
// off until the name is typed, and an open activity blocks it.
export default function DeleteOrganizationPanel({
  slug,
  name,
  openActivityCount,
}: {
  slug: string;
  name: string;
  openActivityCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  const blocked = openActivityCount > 0;
  const nameMatches = typedName.trim() === name;

  async function submit() {
    setPending(true);
    const result = await deleteOrganization(slug);
    setPending(false);
    setState(result);
    follow(result, true);
  }

  return (
    <View className={`${panel} gap-4 p-4`}>
      <View className="gap-1">
        <Text accessibilityRole="header" className={sectionTitle}>
          Đưa tổ chức vào thùng rác
        </Text>
        <Text className={mutedText}>
          Đây là xóa mềm, không phải xóa vĩnh viễn. Tổ chức sẽ ẩn với mọi người
          và đường dẫn cũ được nhả ra. Thành viên, hoạt động và ảnh vẫn được giữ
          lại. Bạn có thể khôi phục tổ chức ở mục Tổ chức đã xóa, trong Tổ chức
          của tôi.
        </Text>
      </View>
      {blocked ? (
        <Text className={mutedText}>
          Còn {openActivityCount} hoạt động đang mở. Hãy hủy các hoạt động đó
          trước khi đưa tổ chức vào thùng rác.
        </Text>
      ) : null}
      {confirming ? (
        <View className="gap-3">
          <FormMessage state={state} />
          <View className="gap-1">
            <Text className={fieldLabel}>Nhập “{name}” để xác nhận</Text>
            <TextInput
              value={typedName}
              onChangeText={setTypedName}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel={`Nhập ${name} để xác nhận`}
              className={inputField}
            />
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Button
              variant="neutral"
              icon="trash-2"
              pending={pending}
              disabled={!nameMatches || blocked}
              onPress={submit}
            >
              Đưa vào thùng rác
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                setConfirming(false);
                setTypedName("");
              }}
            >
              Hủy
            </Button>
          </View>
        </View>
      ) : (
        <View className="self-start">
          <Button
            variant="neutral"
            icon="trash-2"
            disabled={blocked}
            onPress={() => setConfirming(true)}
          >
            Đưa vào thùng rác
          </Button>
        </View>
      )}
    </View>
  );
}
