import * as ImagePicker from "expo-image-picker";
import type { LocalFile } from "./http";

// A file chosen from the phone's library, with what the upload checks need.
export type PickedFile = LocalFile & { size: number | null };

function extensionFor(type: string): string {
  const known: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return known[type] ?? "bin";
}

// Opens the photo library, the native counterpart of the web file input.
// Nothing chosen gives an empty list.
export async function pickMedia(
  kind: "images" | "videos" | "both",
  multiple: boolean,
): Promise<PickedFile[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:
      kind === "both"
        ? ["images", "videos"]
        : kind === "images"
          ? ["images"]
          : ["videos"],
    allowsMultipleSelection: multiple,
    quality: 1,
    // Keep the original file, so the backend makes its own sizes.
    allowsEditing: false,
  });
  if (result.canceled) return [];
  return result.assets.map((asset, index) => {
    const type =
      asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg");
    return {
      uri: asset.uri,
      type,
      name:
        asset.fileName ?? `upload-${Date.now()}-${index}.${extensionFor(type)}`,
      size: asset.fileSize ?? null,
    };
  });
}
