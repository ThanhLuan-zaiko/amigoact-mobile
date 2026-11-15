import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { normalizeSerial } from "@/lib/certificates";
import Button from "../common/Button";
import { fieldLabel, inputField } from "../ui";

// The serial lookup, ported from the web VerifyForm. It opens the screen of
// the certificate with that serial.
export default function VerifyForm({
  defaultValue = "",
}: {
  defaultValue?: string;
}) {
  const theme = useThemeColors();
  const [serial, setSerial] = useState(defaultValue);
  function submit() {
    const typed = normalizeSerial(serial);
    if (!typed) return;
    router.push(`/certificates/verify/${encodeURIComponent(typed)}` as never);
  }
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className={fieldLabel}>Số serial</Text>
        <TextInput
          value={serial}
          onChangeText={setSerial}
          onSubmitEditing={submit}
          placeholder="AMG-XXXX-XXXX-XXXX"
          placeholderTextColor={theme.subtle}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={60}
          returnKeyType="search"
          accessibilityLabel="Số serial"
          className={`${inputField} font-mono uppercase`}
        />
      </View>
      <View className="self-start">
        <Button icon="search" onPress={submit}>
          Xác minh
        </Button>
      </View>
    </View>
  );
}
