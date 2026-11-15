import { Text, View } from "react-native";
import type { Focus } from "@/lib/focus";
import { uploadMessage } from "@/lib/forms";
import { isVideo } from "@/lib/pictureRules";
import { POST_MEDIA_LIMIT } from "@/lib/posts";
import { IconButton } from "../common/Button";
import Icon from "../common/Icon";
import Picture from "../common/Picture";
import { Notes } from "../forms/Fields";
import { fieldError, mutedText } from "../ui";
import FocusButton from "./FocusButton";

export type MediaItem = {
  id: string;
  mime: string;
  // A local file uri for a new upload, or the server path of a saved file.
  preview: string;
  focus?: Focus | null;
};

// The files of a post, ported from the web MediaField. Picking happens from
// the body toolbar (see BodyField); this lists what is attached, with buttons
// to place a file at the cursor, set its focal point, or remove it.
export default function MediaField({
  items,
  busy,
  failures,
  error,
  onInsert,
  onRemove,
  onFocus,
}: {
  items: MediaItem[];
  busy: boolean;
  failures: string[];
  error?: string;
  onInsert: (item: MediaItem) => void;
  onRemove: (item: MediaItem) => void;
  onFocus: (item: MediaItem, focus: Focus) => void;
}) {
  return (
    <View className="gap-2">
      {busy ? <Text className={mutedText}>Đang tải lên…</Text> : null}
      {failures.length > 0 ? (
        <View className="gap-1">
          {failures.map((message) => (
            <Text key={message} className={fieldError}>
              {message}
            </Text>
          ))}
        </View>
      ) : null}
      {items.length > 0 ? (
        <View className="flex-row flex-wrap gap-3">
          {items.map((item) => (
            <View key={item.id} className="w-[47%] gap-2">
              {isVideo(item.mime) ? (
                <View className="aspect-video w-full items-center justify-center rounded-md border border-slate-200 bg-slate-950 dark:border-slate-800">
                  <Icon name="video" size={22} tone="onDanger" />
                </View>
              ) : (
                <Picture
                  src={item.preview}
                  width={320}
                  focus={item.focus}
                  className="aspect-video w-full rounded-md border border-slate-200 dark:border-slate-800"
                />
              )}
              <View className="flex-row gap-2">
                <IconButton
                  icon="corner-down-left"
                  label="Chèn vào vị trí con trỏ"
                  onPress={() => onInsert(item)}
                />
                {isVideo(item.mime) ? null : (
                  <FocusButton
                    assetId={item.id}
                    src={item.preview}
                    initial={item.focus}
                    onSaved={(focus) => onFocus(item, focus)}
                  />
                )}
                <IconButton
                  icon="trash-2"
                  label="Gỡ tệp"
                  onPress={() => onRemove(item)}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}
      <Notes
        error={error}
        hint={
          items.length > 0
            ? `${items.length}/${POST_MEDIA_LIMIT} tệp. Dòng [media:…] trong nội dung là chỗ đặt tệp, tệp chưa đặt sẽ hiện cuối bài. Chỉ bài công khai có ảnh hoặc video.`
            : undefined
        }
      />
    </View>
  );
}

export { uploadMessage };
