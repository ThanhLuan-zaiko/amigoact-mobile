import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { searchTags, type TagSource } from "@/lib/postApi";
import { TAG_LIMIT, TAG_NAME_MAX } from "@/lib/posts";
import {
  addTag,
  suggestionRows,
  type TagSuggestion,
  tagSlug,
  takeFinishedTags,
} from "@/lib/tagInput";
import Icon from "../common/Icon";
import { fieldError, fieldLabel, mutedText, smallMuted } from "../ui";

const DELAY_MS = 200;

// Asks the backend for tags while the box is focused. Each slug prefix is
// fetched once, and an answer that arrives late is dropped.
function useTagSuggestions(
  orgSlug: string,
  source: TagSource,
  draft: string,
  open: boolean,
): TagSuggestion[] {
  const cache = useRef(new Map<string, TagSuggestion[]>());
  const [shown, setShown] = useState<TagSuggestion[]>([]);
  const key = draft.trim() ? tagSlug(draft) : "";
  const nothingToFind = draft.trim() !== "" && key === "";
  useEffect(() => {
    if (!open || nothingToFind) return;
    const cached = cache.current.get(key);
    if (cached) {
      setShown(cached);
      return;
    }
    let current = true;
    const timer = setTimeout(async () => {
      const items = await searchTags(orgSlug, source, key);
      cache.current.set(key, items);
      if (current) setShown(items);
    }, DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [orgSlug, source, key, open, nothingToFind]);
  return nothingToFind ? [] : shown;
}

// Tags as chips, ported from the web TagInput. The keyboard's done key or a
// comma turns the text into a chip, and tags already used in the organization
// are suggested while typing. `onChange` gets the chips; the draft text still
// counts when the form is sent, through tagFieldValue.
export default function TagInput({
  orgSlug,
  source = "post",
  tags,
  draft,
  onChange,
  error,
}: {
  orgSlug: string;
  source?: TagSource;
  tags: string[];
  draft: string;
  onChange: (tags: string[], draft: string) => void;
  error?: string;
}) {
  const theme = useThemeColors();
  const [open, setOpen] = useState(false);
  const full = tags.length >= TAG_LIMIT;
  const suggestions = useTagSuggestions(orgSlug, source, draft, open && !full);
  const rows = open && !full ? suggestionRows(suggestions, tags, draft) : [];

  function commit(name: string) {
    onChange(addTag(tags, name), "");
  }

  function type(text: string) {
    if (text.includes(",")) {
      const next = takeFinishedTags(tags, text);
      onChange(next.tags, next.draft);
    } else {
      onChange(tags, full ? "" : text);
    }
  }

  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <Icon name="tag" size={14} tone="muted" />
          <Text className={fieldLabel}>Thẻ</Text>
        </View>
        <Text className={smallMuted}>
          {tags.length}/{TAG_LIMIT}
        </Text>
      </View>
      <View
        className={`min-h-11 w-full flex-row flex-wrap items-center gap-2 rounded-md border px-2 py-1.5 ${
          error
            ? "border-slate-900 dark:border-slate-100"
            : open
              ? "border-teal-700 dark:border-teal-400"
              : "border-slate-300 dark:border-slate-700"
        }`}
      >
        {tags.map((tag, index) => (
          <View
            key={tag}
            className="max-w-full flex-row items-center gap-1 rounded-sm border border-teal-700 bg-teal-50 py-0.5 pl-2 pr-0.5 dark:border-teal-400 dark:bg-teal-950/40"
          >
            <Text
              numberOfLines={1}
              className="shrink font-body-medium text-sm text-teal-700 dark:text-teal-400"
            >
              #{tag}
            </Text>
            <Pressable
              onPress={() =>
                onChange(
                  tags.filter((_, at) => at !== index),
                  draft,
                )
              }
              accessibilityRole="button"
              accessibilityLabel={`Bỏ thẻ ${tag}`}
              hitSlop={6}
              className="h-7 w-7 items-center justify-center rounded-sm"
            >
              <Icon name="x" size={14} tone="accent" />
            </Pressable>
          </View>
        ))}
        <TextInput
          value={draft}
          editable={!full}
          maxLength={TAG_NAME_MAX}
          onChangeText={type}
          onSubmitEditing={() => {
            if (draft.trim()) commit(draft);
          }}
          submitBehavior="submit"
          returnKeyType="done"
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          autoCorrect={false}
          placeholder={
            full ? "Đã đủ thẻ" : tags.length ? "Thêm thẻ" : "Ví dụ: Môi trường"
          }
          placeholderTextColor={theme.subtle}
          accessibilityLabel="Thẻ"
          className="min-w-32 flex-1 py-1 font-body text-sm text-slate-900 dark:text-slate-100"
        />
      </View>
      {rows.length > 0 ? (
        <View
          accessibilityLabel="Gợi ý thẻ"
          className="rounded-md border border-slate-200 bg-white py-1 dark:border-slate-800 dark:bg-slate-950"
        >
          {rows.map((row) => (
            <Pressable
              key={`${row.count === null ? "new" : "tag"}-${row.name}`}
              onPress={() => commit(row.name)}
              accessibilityRole="button"
              className="min-h-11 flex-row items-center gap-2 px-3 py-2 active:bg-teal-50 dark:active:bg-teal-950/40"
            >
              <Icon
                name={row.count === null ? "plus" : "hash"}
                size={14}
                tone="muted"
              />
              <Text
                numberOfLines={1}
                className="min-w-0 flex-1 font-body text-sm text-slate-700 dark:text-slate-300"
              >
                {row.count === null ? `Tạo thẻ “${row.name}”` : row.name}
              </Text>
              {row.count === null ? null : (
                <View
                  accessible
                  accessibilityLabel={`${row.count} bài viết`}
                  className="flex-row items-center gap-1"
                >
                  <Icon name="file-text" size={12} tone="subtle" />
                  <Text className={smallMuted}>{row.count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ) : null}
      {error ? (
        <Text className={fieldError}>{error}</Text>
      ) : (
        <Text className={mutedText}>Nhấn Xong hoặc dấu phẩy để thêm thẻ.</Text>
      )}
    </View>
  );
}
