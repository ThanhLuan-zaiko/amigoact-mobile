import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { BODY_MAX } from "@/lib/posts";
import Icon, { type IconName } from "../common/Icon";
import { Notes } from "../forms/Fields";
import { inputField, inputFieldFocused, inputFieldInvalid } from "../ui";

export type Selection = { start: number; end: number };

type Tool = { label: string; icon: IconName; onPress: () => void };

// The post text with its toolbar, ported from the web BodyField. The parent
// keeps the text and the selection, so formatting and placing a file at the
// cursor work the same as on the web.
export default function BodyField({
  value,
  selection,
  onChange,
  onSelection,
  onFormat,
  onPickImages,
  onPickVideos,
  error,
  disabled = false,
}: {
  value: string;
  selection: Selection;
  onChange: (value: string) => void;
  onSelection: (selection: Selection) => void;
  onFormat: (action: "heading" | "quote" | "list" | "rule") => void;
  onPickImages: () => void;
  onPickVideos: () => void;
  error?: string;
  disabled?: boolean;
}) {
  const theme = useThemeColors();
  const [focused, setFocused] = useState(false);
  const tools: Tool[] = [
    { label: "Tiêu đề", icon: "type", onPress: () => onFormat("heading") },
    {
      label: "Trích dẫn",
      icon: "message-square",
      onPress: () => onFormat("quote"),
    },
    { label: "Danh sách", icon: "list", onPress: () => onFormat("list") },
    { label: "Thêm ảnh", icon: "image", onPress: onPickImages },
    { label: "Thêm video", icon: "video", onPress: onPickVideos },
    { label: "Đường kẻ", icon: "minus", onPress: () => onFormat("rule") },
  ];
  return (
    <View className="gap-2">
      <View className="flex-row self-start overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
        {tools.map((tool, index) => (
          <Pressable
            key={tool.label}
            onPress={tool.onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={tool.label}
            className={`h-11 w-11 items-center justify-center active:bg-slate-100 dark:active:bg-slate-800 ${
              index < tools.length - 1
                ? "border-r border-slate-200 dark:border-slate-800"
                : ""
            } ${disabled ? "opacity-50" : ""}`}
          >
            <Icon name={tool.icon} />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        selection={selection}
        onSelectionChange={(event) => onSelection(event.nativeEvent.selection)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline
        textAlignVertical="top"
        maxLength={BODY_MAX}
        placeholder="Nội dung bài viết…"
        placeholderTextColor={theme.subtle}
        accessibilityLabel="Nội dung bài viết"
        aria-invalid={error ? true : undefined}
        className={`${error ? inputFieldInvalid : focused ? inputFieldFocused : inputField} min-h-48 leading-relaxed`}
      />
      <Notes error={error} />
    </View>
  );
}
