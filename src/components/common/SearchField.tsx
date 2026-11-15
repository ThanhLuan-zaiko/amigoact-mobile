import { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { inputField } from "../ui";
import { IconButton } from "./Button";

// A search box and its button, the native counterpart of the web search
// forms. The search runs on the button or the keyboard's search key.
export default function SearchField({
  label,
  value,
  onSearch,
  autoFocus = false,
  maxLength = 100,
}: {
  label: string;
  value: string;
  onSearch: (query: string) => void;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  const theme = useThemeColors();
  const [text, setText] = useState(value);
  const input = useRef<{ focus: () => void } | null>(null);
  // A new search from elsewhere, such as clearing a filter, shows here too.
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => input.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);
  return (
    <View className="flex-row gap-2">
      <TextInput
        ref={(node) => {
          input.current = node;
        }}
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => onSearch(text.trim())}
        returnKeyType="search"
        maxLength={maxLength}
        placeholder={label}
        placeholderTextColor={theme.subtle}
        accessibilityLabel={label}
        autoCorrect={false}
        className={`flex-1 ${inputField}`}
      />
      <IconButton
        icon="search"
        label="Tìm"
        onPress={() => onSearch(text.trim())}
      />
    </View>
  );
}
