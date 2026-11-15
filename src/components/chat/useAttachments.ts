import { useRef, useState } from "react";
import { ATTACHMENT_MAX } from "@/lib/chat";
import { pickMedia } from "@/lib/filePicker";
import { uploadMessage } from "@/lib/forms";
import { uploadMedia } from "@/lib/http";
import { galleryFileError, isVideo } from "@/lib/pictureRules";

export type Draft = {
  key: string;
  name: string;
  kind: "image" | "video";
  preview: string;
  assetId: string | null;
  error: string | null;
};

// Pictures and videos waiting in the composer, ported from the web
// useAttachments. Each starts uploading as soon as it is chosen. The web shows
// a percentage from XHR progress; React Native's fetch gives none, so a
// spinner shows instead (see docs/web-parity.md).
export function useAttachments() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const countRef = useRef(0);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  function update(key: string, change: Partial<Draft>) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key ? { ...draft, ...change } : draft,
      ),
    );
  }

  async function pick() {
    const files = await pickMedia("both", true);
    if (files.length === 0) return;
    const room = ATTACHMENT_MAX - draftsRef.current.length;
    const problems: string[] = [];
    if (files.length > room) {
      problems.push(`Mỗi tin gửi tối đa ${ATTACHMENT_MAX} ảnh hoặc video.`);
    }
    for (const file of files.slice(0, Math.max(0, room))) {
      const invalid = galleryFileError({
        type: file.type,
        size: file.size ?? 0,
      });
      if (invalid) {
        problems.push(`${file.name}: ${invalid}`);
        continue;
      }
      countRef.current += 1;
      const key = `draft-${countRef.current}`;
      setDrafts((current) => [
        ...current,
        {
          key,
          name: file.name,
          kind: isVideo(file.type) ? "video" : "image",
          preview: file.uri,
          assetId: null,
          error: null,
        },
      ]);
      uploadMedia(file).then((result) =>
        update(
          key,
          result.ok
            ? { assetId: result.id }
            : { error: uploadMessage(result.code) },
        ),
      );
    }
    setNotice(problems.length > 0 ? problems.join(" ") : null);
  }

  function remove(key: string) {
    setDrafts((current) => current.filter((draft) => draft.key !== key));
  }

  function clear() {
    setDrafts([]);
    setNotice(null);
  }

  const uploading = drafts.some((d) => d.assetId === null && d.error === null);
  const failed = drafts.some((draft) => draft.error !== null);
  const ids = drafts.flatMap((draft) => (draft.assetId ? [draft.assetId] : []));

  return { drafts, notice, uploading, failed, ids, pick, remove, clear };
}

export type Attachments = ReturnType<typeof useAttachments>;
