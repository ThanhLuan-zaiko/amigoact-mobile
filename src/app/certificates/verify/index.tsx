import { Redirect, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import VerifyForm from "@/components/certificates/VerifyForm";
import Page, { PageTitle } from "@/components/shell/Page";
import { mutedText, panel } from "@/components/ui";
import { param } from "@/lib/appPath";
import { normalizeSerial } from "@/lib/certificates";

// Public. Anyone with a serial, such as a school or an employer, checks it here.
export default function VerifyScreen() {
  const typed = normalizeSerial(
    param(useLocalSearchParams<{ serial?: string }>().serial),
  );
  if (typed) {
    return (
      <Redirect
        href={`/certificates/verify/${encodeURIComponent(typed)}` as never}
      />
    );
  }
  return (
    <Page>
      <PageTitle>Xác minh chứng nhận</PageTitle>
      <View className={`${panel} gap-3 p-4`}>
        <Text className={mutedText}>
          Nhập số serial in trên chứng nhận để xem chứng nhận còn hiệu lực hay
          không.
        </Text>
        <VerifyForm />
      </View>
    </Page>
  );
}
