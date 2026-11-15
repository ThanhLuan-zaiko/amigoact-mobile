import { useState } from "react";
import { Text, View } from "react-native";
import { pickMedia } from "@/lib/filePicker";
import { uploadMessage } from "@/lib/forms";
import { uploadMedia } from "@/lib/http";
import {
  GALLERY_MAX_ITEMS,
  galleryFileError,
  isVideo,
} from "@/lib/pictureRules";
import { IconButton } from "../common/Button";
import Icon from "../common/Icon";
import Picture from "../common/Picture";
import FocusButton from "../compose/FocusButton";
import { UploadBox } from "../forms/FormSection";
import { fieldError, fieldLabel, mutedText } from "../ui";

export const TILE =
  "aspect-video w-full overflow-hidden rounded-md border border-slate-200 dark:border-slate-800";

export function VideoTile() {
  return (
    <View className={`${TILE} items-center justify-center bg-slate-950`}>
      <Icon name="video" size={22} tone="onDanger" />
    </View>
  );
}

type Local = { id: string; mime: string; preview: string };

// The gallery of the create form: files upload at once and their ids go with
// the form, so the organization is created with its gallery in one step.
export function CreateGalleryField({
  onChange,
}: {
  onChange: (ids: string[]) => void;
}) {
  const [items, setItems] = useState<Local[]>([]);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);
  const room = GALLERY_MAX_ITEMS - items.length;

  async function addFiles() {
    const files = await pickMedia("both", true);
    if (files.length === 0) return;
    setBusy(true);
    const errors: string[] = [];
    let list = items;
    for (const file of files) {
      const invalid =
        GALLERY_MAX_ITEMS - list.length <= 0
          ? `Bộ sưu tập tối đa ${GALLERY_MAX_ITEMS} tệp.`
          : galleryFileError({ type: file.type, size: file.size ?? 0 });
      if (invalid) {
        errors.push(`${file.name}: ${invalid}`);
        continue;
      }
      const result = await uploadMedia(file);
      if (result.ok) {
        list = [...list, { id: result.id, mime: file.type, preview: file.uri }];
        setItems(list);
      } else {
        errors.push(`${file.name}: ${uploadMessage(result.code)}`);
      }
    }
    onChange(list.map((item) => item.id));
    setFailures(errors);
    setBusy(false);
  }

  function remove(item: Local) {
    const list = items.filter((entry) => entry.id !== item.id);
    setItems(list);
    onChange(list.map((entry) => entry.id));
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline gap-2">
        <Text className={fieldLabel}>Bộ sưu tập</Text>
        <Text className={mutedText}>
          {items.length}/{GALLERY_MAX_ITEMS}
        </Text>
      </View>
      <UploadBox
        title={
          busy
            ? "Đang tải lên, xong rồi mới tạo tổ chức…"
            : "Bấm để chọn ảnh hoặc video"
        }
        hint="Ảnh JPEG, PNG, WEBP tối đa 20 MB. Video MP4, WEBM tối đa 50 MB."
        onPress={addFiles}
        disabled={busy || room <= 0}
      />
      {failures.map((message) => (
        <Text key={message} className={fieldError}>
          {message}
        </Text>
      ))}
      {items.length > 0 ? (
        <View className="flex-row flex-wrap gap-3">
          {items.map((item) => (
            <View key={item.id} className="w-[47%] gap-2">
              {isVideo(item.mime) ? (
                <VideoTile />
              ) : (
                <Picture src={item.preview} className={TILE} />
              )}
              <View className="flex-row gap-2">
                {isVideo(item.mime) ? null : (
                  <FocusButton assetId={item.id} src={item.preview} />
                )}
                <IconButton
                  icon="trash-2"
                  label="Gỡ khỏi bộ sưu tập"
                  onPress={() => remove(item)}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
