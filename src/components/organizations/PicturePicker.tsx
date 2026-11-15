import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { pickMedia } from "@/lib/filePicker";
import { uploadMessage } from "@/lib/forms";
import { uploadMedia } from "@/lib/http";
import { chooseOrgPictures } from "@/lib/organizationActions";
import {
  assetIdFromUrl,
  isPictureTooLarge,
  PICTURE_ACCEPT,
  PICTURE_MAX_MB,
} from "@/lib/pictureRules";
import { Chip, IconButton } from "../common/Button";
import Icon from "../common/Icon";
import Picture from "../common/Picture";
import { ErrorLine } from "../common/States";
import FocusButton from "../compose/FocusButton";
import { UploadBox } from "../forms/FormSection";
import { fieldError, fieldLabel } from "../ui";

export type PictureRole = "logo" | "cover";

export const ROLE_LABEL: Record<PictureRole, string> = {
  logo: "Logo",
  cover: "Ảnh bìa",
};

const ROLES: PictureRole[] = ["logo", "cover"];

export type PickedPictures = {
  // Every uploaded picture, in upload order.
  ids: string[];
  logo: string | null;
  cover: string | null;
};

type Item = { id: string; preview: string };

// Swaps the saved logo and cover in one tap.
function SwapPictures({
  slug,
  logoUrl,
  coverUrl,
}: {
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const logo = assetIdFromUrl(logoUrl);
  const cover = assetIdFromUrl(coverUrl);
  if (!logo || !cover) return null;
  return (
    <View className="items-start gap-1">
      <Chip
        icon="repeat"
        onPress={async () => {
          if (pending) return;
          setPending(true);
          const state = await chooseOrgPictures(slug, {
            logo: cover,
            cover: logo,
          });
          setError(state.error);
          setPending(false);
        }}
      >
        {pending ? "Đang đổi…" : "Đổi chỗ logo và ảnh bìa"}
      </Chip>
      <ErrorLine>{error}</ErrorLine>
    </View>
  );
}

// One upload box for every picture, ported from the web PicturePicker. The
// viewer uploads first, then marks which picture is the logo and which is the
// cover. Pictures with no role go to the gallery.
export default function PicturePicker({
  slug,
  currentLogoUrl,
  currentCoverUrl,
  error,
  onChange,
}: {
  slug?: string;
  currentLogoUrl?: string | null;
  currentCoverUrl?: string | null;
  error?: { logo?: string; cover?: string };
  onChange: (value: PickedPictures) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [picked, setPicked] = useState<Record<PictureRole, string | null>>({
    logo: null,
    cover: null,
  });
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);
  const current: Record<PictureRole, string | null> = {
    logo: currentLogoUrl ?? null,
    cover: currentCoverUrl ?? null,
  };

  function publish(
    nextItems: Item[],
    nextPicked: Record<PictureRole, string | null>,
  ) {
    onChange({ ids: nextItems.map((item) => item.id), ...nextPicked });
  }

  async function addFiles() {
    const files = await pickMedia("images", true);
    if (files.length === 0) return;
    setBusy(true);
    const errors: string[] = [];
    let list = items;
    for (const file of files) {
      if (!PICTURE_ACCEPT.split(",").includes(file.type)) {
        errors.push(`${file.name}: Ảnh phải là JPEG, PNG hoặc WEBP.`);
        continue;
      }
      if (isPictureTooLarge(file.size ?? 0)) {
        errors.push(`${file.name}: Ảnh tối đa ${PICTURE_MAX_MB} MB.`);
        continue;
      }
      const result = await uploadMedia(file);
      if (!result.ok) {
        errors.push(`${file.name}: ${uploadMessage(result.code)}`);
        continue;
      }
      list = [...list, { id: result.id, preview: file.uri }];
      setItems(list);
    }
    publish(list, picked);
    setFailures(errors);
    setBusy(false);
  }

  // Tapping the chosen role again clears it.
  function toggle(role: PictureRole, id: string) {
    const next = { ...picked, [role]: picked[role] === id ? null : id };
    setPicked(next);
    publish(items, next);
  }

  function discard(item: Item) {
    const list = items.filter((entry) => entry.id !== item.id);
    const next = {
      logo: picked.logo === item.id ? null : picked.logo,
      cover: picked.cover === item.id ? null : picked.cover,
    };
    setItems(list);
    setPicked(next);
    publish(list, next);
  }

  return (
    <View className="gap-3">
      <Text className={fieldLabel}>Ảnh</Text>
      <UploadBox
        title={busy ? "Đang tải lên…" : "Bấm để chọn ảnh"}
        hint={`JPEG, PNG, WEBP, tối đa ${PICTURE_MAX_MB} MB mỗi ảnh. Sau khi tải lên, hãy chọn ảnh nào là logo, ảnh nào là ảnh bìa. Các ảnh còn lại sẽ vào bộ sưu tập.`}
        onPress={addFiles}
        disabled={busy}
      />
      {failures.map((message) => (
        <Text key={message} className={fieldError}>
          {message}
        </Text>
      ))}
      {ROLES.map((role) =>
        error?.[role] ? <ErrorLine key={role}>{error[role]}</ErrorLine> : null,
      )}
      {ROLES.map((role) => {
        const url = current[role];
        if (!url) return null;
        return (
          <View
            key={role}
            className="flex-row items-center gap-3 border-b border-slate-200 pb-3 dark:border-slate-800"
          >
            <Picture
              src={url}
              width={320}
              label={ROLE_LABEL[role]}
              className="h-14 w-14 rounded-md border border-slate-200 dark:border-slate-800"
            />
            <View className="flex-row items-center gap-1 rounded-sm border border-teal-700 bg-teal-50 px-2 py-1 dark:border-teal-400 dark:bg-teal-950/40">
              <Icon
                name={role === "logo" ? "award" : "image"}
                size={12}
                tone="accent"
              />
              <Text className="font-body-semibold text-xs text-teal-700 dark:text-teal-400">
                {ROLE_LABEL[role]}
              </Text>
            </View>
            {picked[role] !== null ? (
              <Text className="flex-1 font-body text-sm text-slate-600 dark:text-slate-400">
                Sẽ được thay khi lưu
              </Text>
            ) : null}
          </View>
        );
      })}
      {slug ? (
        <SwapPictures
          slug={slug}
          logoUrl={current.logo}
          coverUrl={current.cover}
        />
      ) : null}
      {items.length > 0 ? (
        <View className="flex-row flex-wrap gap-3">
          {items.map((item) => (
            <View key={item.id} className="w-[47%] gap-2">
              <Picture
                src={item.preview}
                className="aspect-video w-full rounded-md border border-slate-200 dark:border-slate-800"
              />
              <View className="flex-row flex-wrap items-center gap-2">
                {ROLES.map((role) => {
                  const on = picked[role] === item.id;
                  return (
                    <Pressable
                      key={role}
                      onPress={() => toggle(role, item.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`Đặt làm ${ROLE_LABEL[role].toLowerCase()}`}
                      className={`h-11 w-11 items-center justify-center rounded-md border ${
                        on
                          ? "border-teal-700 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/40"
                          : "border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <Icon
                        name={role === "logo" ? "award" : "image"}
                        tone={on ? "accent" : "text"}
                      />
                    </Pressable>
                  );
                })}
                <FocusButton assetId={item.id} src={item.preview} />
                <IconButton
                  icon="trash-2"
                  label="Bỏ ảnh này"
                  onPress={() => discard(item)}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
