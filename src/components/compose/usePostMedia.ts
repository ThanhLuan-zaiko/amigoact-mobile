import { useState } from "react";
import { pickMedia } from "@/lib/filePicker";
import { uploadMessage } from "@/lib/forms";
import { uploadMedia } from "@/lib/http";
import {
  isPictureTooLarge,
  isVideo,
  PICTURE_ACCEPT,
  VIDEO_MAX_BYTES,
} from "@/lib/pictureRules";
import { POST_MEDIA_LIMIT } from "@/lib/posts";
import type { MediaItem } from "./MediaField";

const VIDEO_ACCEPT = "video/mp4,video/webm";

// Checked on the phone first. The backend checks the real file type again.
// The web wording is kept, so the two apps say the same thing.
export function fileError(file: {
  type: string;
  size: number | null;
}): string | null {
  const size = file.size ?? 0;
  if (isVideo(file.type)) {
    if (!VIDEO_ACCEPT.split(",").includes(file.type)) {
      return "Video phải là MP4 hoặc WEBM.";
    }
    return size > VIDEO_MAX_BYTES ? "Video tối đa 50 MB." : null;
  }
  if (!PICTURE_ACCEPT.split(",").includes(file.type)) {
    return "Chỉ nhận ảnh JPEG, PNG, WEBP hoặc video MP4, WEBM.";
  }
  return isPictureTooLarge(size) ? "Ảnh tối đa 20 MB." : null;
}

// The files of a post being written. Each one uploads at once and only its
// asset id goes with the form, as on the web.
export function usePostMedia(
  initial: { id: string; mime: string }[],
  onUploaded: (id: string) => void,
) {
  const [items, setItems] = useState<MediaItem[]>(() =>
    initial.map(({ id, mime }) => ({ id, mime, preview: `/media/${id}/file` })),
  );
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);

  async function pick(kind: "images" | "videos") {
    if (busy) return;
    const files = await pickMedia(kind, true);
    if (files.length === 0) return;
    setBusy(true);
    const errors: string[] = [];
    let room = POST_MEDIA_LIMIT - items.length;
    for (const file of files) {
      const invalid =
        room <= 0 ? `Tối đa ${POST_MEDIA_LIMIT} tệp mỗi bài.` : fileError(file);
      if (invalid) {
        errors.push(`${file.name}: ${invalid}`);
        continue;
      }
      const result = await uploadMedia(file);
      if (result.ok) {
        room -= 1;
        setItems((current) => [
          ...current,
          {
            id: result.id,
            mime: file.type,
            preview: file.uri,
            focus: result.focus,
          },
        ]);
        // A new file lands where the cursor is, like a picture in an article.
        onUploaded(result.id.toLowerCase());
      } else {
        errors.push(`${file.name}: ${uploadMessage(result.code)}`);
      }
    }
    setFailures(errors);
    setBusy(false);
  }

  function remove(item: MediaItem) {
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  function setFocus(item: MediaItem, focus: MediaItem["focus"]) {
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, focus } : entry,
      ),
    );
  }

  function reset() {
    setItems([]);
    setFailures([]);
  }

  return { items, busy, failures, pick, remove, setFocus, reset };
}
