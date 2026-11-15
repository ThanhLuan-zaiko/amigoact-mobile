import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import QrScanner from "@/components/attendance/QrScanner";
import Button from "@/components/common/Button";
import { FormMessage } from "@/components/FormParts";
import { InputField } from "@/components/forms/Fields";
import RequireUser from "@/components/RequireUser";
import Page, { PageTitle } from "@/components/shell/Page";
import { panel, sectionTitle } from "@/components/ui";
import type { ActionResult } from "@/lib/actionResult";
import { checkIn } from "@/lib/attendanceApi";
import { tokenFromParam } from "@/lib/deepLink";
import { checkFields } from "@/lib/formCheck";

// A scanned QR (or a link) brings a token. Checking in still takes a tap, so
// opening a link can never mark someone as present, as on the web.
function QrCheckIn({ token, onDone }: { token: string; onDone: () => void }) {
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  if (state.success) {
    return (
      <View className="gap-3">
        <FormMessage state={state} />
        <Button variant="secondary" icon="camera" onPress={onDone}>
          Quét mã khác
        </Button>
      </View>
    );
  }
  return (
    <View className={`${panel} gap-3 p-4`}>
      <FormMessage state={state} />
      <Button
        icon="check-circle"
        pending={pending}
        onPress={async () => {
          setPending(true);
          setState(await checkIn({ token }));
          setPending(false);
        }}
      >
        Điểm danh
      </Button>
    </View>
  );
}

function CodeCheckIn() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  async function send() {
    const found = checkFields({ code }, ["code"]);
    if (Object.keys(found).length > 0) {
      setState({ fieldErrors: found });
      return;
    }
    setPending(true);
    const result = await checkIn({ code: code.trim() });
    setPending(false);
    setState(result);
    if (result.success) setCode("");
  }
  return (
    <View className={`${panel} gap-3 p-4`}>
      <FormMessage state={state} />
      <InputField
        label="Mã điểm danh"
        value={code}
        onChangeText={setCode}
        maxLength={6}
        autoCapitalize="none"
        error={state.fieldErrors?.code}
        required
      />
      <View className="self-start">
        <Button icon="check" pending={pending} onPress={send}>
          Gửi mã
        </Button>
      </View>
    </View>
  );
}

function CheckInContent() {
  const linked = tokenFromParam(
    useLocalSearchParams<{ token?: string }>().token,
  );
  const [token, setToken] = useState<string | null>(linked);
  const [wrong, setWrong] = useState(false);
  return (
    <Page>
      <View className="w-full max-w-md gap-4 self-center">
        <PageTitle>Điểm danh</PageTitle>
        {token ? (
          <QrCheckIn token={token} onDone={() => setToken(null)} />
        ) : (
          <>
            <View className={`${panel} gap-3 p-4`}>
              <Text accessibilityRole="header" className={sectionTitle}>
                Quét mã QR
              </Text>
              <QrScanner
                onToken={(scanned) => {
                  setWrong(false);
                  setToken(scanned);
                }}
                onWrongCode={() => setWrong(true)}
              />
              {wrong ? (
                <FormMessage
                  state={{ error: "Đây không phải mã QR điểm danh." }}
                />
              ) : null}
            </View>
            <CodeCheckIn />
          </>
        )}
      </View>
    </Page>
  );
}

export default function CheckInScreen() {
  return <RequireUser>{() => <CheckInContent />}</RequireUser>;
}
