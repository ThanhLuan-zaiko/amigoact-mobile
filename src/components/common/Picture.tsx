import { Image } from "expo-image";
import { withUniwind } from "uniwind";
import { DEFAULT_FOCUS, type Focus } from "@/lib/focus";
import { mediaSource } from "@/lib/http";

const StyledImage = withUniwind(Image);

// The width the gateway is asked for. A phone is at most about 430 points wide
// at 3x, so 1080 covers a full-width picture; small thumbnails ask for 320.
export type PictureSize = 320 | 640 | 1080 | 1600;

// A server picture, the native counterpart of the web <Picture>. The blurred
// placeholder fills the frame until the picture arrives, and the focal point
// keeps the important part in view when the frame crops it.
export default function Picture({
  src,
  width = 1080,
  className = "",
  placeholder,
  focus,
  fit = "cover",
  label,
}: {
  src: string;
  width?: PictureSize;
  className?: string;
  placeholder?: string | null;
  focus?: Focus | null;
  fit?: "cover" | "contain";
  label?: string;
}) {
  const point = focus ?? DEFAULT_FOCUS;
  return (
    <StyledImage
      source={mediaSource(src, width)}
      placeholder={placeholder ? { uri: placeholder } : undefined}
      contentFit={fit}
      contentPosition={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
      transition={150}
      accessibilityLabel={label}
      accessible={Boolean(label)}
      className={className}
    />
  );
}
