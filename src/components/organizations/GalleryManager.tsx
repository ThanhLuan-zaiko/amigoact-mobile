import { useState } from "react";
import { Text, View } from "react-native";
import { firstError } from "@/lib/actionResult";
import { pickMedia } from "@/lib/filePicker";
import { uploadMessage } from "@/lib/forms";
import { uploadMedia } from "@/lib/http";
import {
  addGalleryItem,
  chooseOrgPictures,
  removeGalleryItem,
} from "@/lib/organizationActions";
import type { GalleryItem } from "@/lib/organizations";
import {
  assetIdFromUrl,
  GALLERY_MAX_ITEMS,
  galleryFileError,
  isVideo,
} from "@/lib/pictureRules";
import ActionButton from "../common/ActionButton";
import { IconButton } from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";
import Picture from "../common/Picture";
import FocusButton from "../compose/FocusButton";
import { UploadBox } from "../forms/FormSection";
import { fieldError, mutedText, panel, sectionTitle } from "../ui";
import { TILE, VideoTile } from "./CreateGalleryField";

// The gallery on the settings screen, ported from the web GalleryManager.
// Each upload joins the gallery at once; a picture becomes the logo or the
// cover with one tap; removing asks first.
export function GalleryManager({
  slug,
  items,
  logoUrl = null,
  coverUrl = null,
}: {
  slug: string;
  items: GalleryItem[];
  logoUrl?: string | null;
  coverUrl?: string | null;
}) {
  const [failures, setFailures] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<GalleryItem | null>(null);
  const [removeError, setRemoveError] = useState<string>();
  const [pendingRemove, setPendingRemove] = useState(false);
  const room = GALLERY_MAX_ITEMS - items.length;

  async function addFiles() {
    const files = await pickMedia("both", true);
    if (files.length === 0) return;
    setBusy(true);
    const errors: string[] = [];
    let left = room;
    for (const file of files) {
      const invalid =
        left <= 0
          ? `Bộ sưu tập tối đa ${GALLERY_MAX_ITEMS} tệp.`
          : galleryFileError({ type: file.type, size: file.size ?? 0 });
      let error = invalid ?? undefined;
      if (!error) {
        const upload = await uploadMedia(file);
        error = upload.ok
          ? firstError(await addGalleryItem(slug, upload.id))
          : uploadMessage(upload.code);
      }
      if (error) errors.push(`${file.name}: ${error}`);
      else left -= 1;
    }
    setFailures(errors);
    setBusy(false);
  }

  async function confirmRemove() {
    if (!removing) return;
    setPendingRemove(true);
    const state = await removeGalleryItem(slug, removing.id);
    setPendingRemove(false);
    if (state.error) {
      setRemoveError(state.error);
      return;
    }
    setRemoving(null);
    setRemoveError(undefined);
  }

  const logoId = assetIdFromUrl(logoUrl);
  const coverId = assetIdFromUrl(coverUrl);

  return (
    <View className={`${panel} gap-4 p-4`}>
      <View className="flex-row items-baseline gap-2">
        <Text accessibilityRole="header" className={sectionTitle}>
          Bộ sưu tập
        </Text>
        <Text className={mutedText}>
          {items.length}/{GALLERY_MAX_ITEMS}
        </Text>
      </View>
      <UploadBox
        title={busy ? "Đang tải lên…" : "Bấm để chọn tệp"}
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
                <Picture
                  src={item.url}
                  width={640}
                  focus={item.focus}
                  className={TILE}
                />
              )}
              <View className="flex-row flex-wrap items-start gap-2">
                {isVideo(item.mime) ? null : (
                  <>
                    <ActionButton
                      action={() => chooseOrgPictures(slug, { logo: item.id })}
                      icon="award"
                      label={
                        logoId === item.id ? "Đang là logo" : "Đặt làm logo"
                      }
                    />
                    <ActionButton
                      action={() => chooseOrgPictures(slug, { cover: item.id })}
                      icon="image"
                      label={
                        coverId === item.id
                          ? "Đang là ảnh bìa"
                          : "Đặt làm ảnh bìa"
                      }
                    />
                    <FocusButton
                      assetId={item.id}
                      src={item.url}
                      initial={item.focus}
                    />
                  </>
                )}
                <IconButton
                  icon="trash-2"
                  label="Xóa khỏi bộ sưu tập"
                  onPress={() => setRemoving(item)}
                />
              </View>
              {logoId === item.id || coverId === item.id ? (
                <Text className="font-body-semibold text-xs text-teal-700 dark:text-teal-400">
                  {logoId === item.id ? "Logo" : "Ảnh bìa"}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      <ConfirmDialog
        open={removing !== null}
        title={`Xóa ${removing && isVideo(removing.mime) ? "video" : "ảnh"} khỏi bộ sưu tập?`}
        confirmLabel="Xóa"
        confirmIcon="trash-2"
        pending={pendingRemove}
        error={removeError}
        onConfirm={confirmRemove}
        onClose={() => {
          setRemoving(null);
          setRemoveError(undefined);
        }}
      >
        Thao tác này không thể hoàn tác. Tệp sẽ không còn hiện trong bộ sưu tập,
        và muốn đưa lại bạn phải tải lên lại.
      </ConfirmDialog>
    </View>
  );
}
