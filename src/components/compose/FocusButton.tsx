import { useState } from "react";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { DEFAULT_FOCUS, type Focus, markerClass } from "@/lib/focus";
import { setMediaFocus } from "@/lib/organizationActions";
import Button, { IconButton } from "../common/Button";
import Picture from "../common/Picture";
import Sheet from "../common/Sheet";
import { errorText, mutedText } from "../ui";

// An icon button on an uploaded picture that opens a sheet to choose its focal
// point, ported from the web FocusButton. The uploader taps the picture and
// sees two crops update before saving.
export default function FocusButton({
  assetId,
  src,
  initial,
  onSaved,
}: {
  assetId: string;
  src: string;
  initial?: Focus | null;
  onSaved?: (focus: Focus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Focus | null>(initial ?? null);
  const [point, setPoint] = useState<Focus>(initial ?? DEFAULT_FOCUS);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [box, setBox] = useState({ width: 0, height: 0 });

  function start() {
    setPoint(saved ?? DEFAULT_FOCUS);
    setError("");
    setOpen(true);
  }

  async function save() {
    setPending(true);
    let result: Awaited<ReturnType<typeof setMediaFocus>>;
    try {
      result = await setMediaFocus(assetId, point);
    } catch {
      result = { ok: false, message: "Mất kết nối. Vui lòng thử lại." };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSaved(result.focus);
    onSaved?.(result.focus);
    setOpen(false);
  }

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  }

  return (
    <>
      <IconButton icon="crosshair" label="Chọn điểm lấy nét" onPress={start} />
      <Sheet
        open={open}
        title="Điểm lấy nét"
        onClose={() => setOpen(false)}
        footer={
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="secondary" icon="x" onPress={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button icon="check" pending={pending} onPress={save}>
              {pending ? "Đang lưu…" : "Lưu"}
            </Button>
          </View>
        }
      >
        <Text className={mutedText}>
          Chạm vào phần quan trọng nhất của ảnh. Khi ảnh bị cắt cho vừa khung,
          phần này luôn được giữ lại.
        </Text>
        <Pressable
          onLayout={onLayout}
          onPress={(event) => {
            if (box.width <= 0 || box.height <= 0) return;
            const clamp = (value: number) =>
              Math.round(Math.min(1, Math.max(0, value)) * 1000) / 1000;
            setPoint({
              x: clamp(event.nativeEvent.locationX / box.width),
              y: clamp(event.nativeEvent.locationY / box.height),
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Đặt điểm lấy nét"
          className="relative aspect-[1.3333] w-full overflow-hidden rounded-md"
        >
          <Picture src={src} fit="contain" className="h-full w-full" />
          <View
            pointerEvents="none"
            className={`absolute h-6 w-6 -translate-x-3 -translate-y-3 rounded-full border-2 border-white bg-teal-700/70 dark:bg-teal-400/70 ${markerClass(point)}`}
          />
        </Pressable>
        <View className="flex-row items-end justify-center gap-3">
          <Picture
            src={src}
            focus={point}
            width={640}
            className="aspect-video w-36 rounded-md border border-slate-200 dark:border-slate-800"
          />
          <Picture
            src={src}
            focus={point}
            width={320}
            className="aspect-square w-20 rounded-md border border-slate-200 dark:border-slate-800"
          />
        </View>
        {error ? (
          <Text accessibilityRole="alert" className={errorText}>
            {error}
          </Text>
        ) : null}
      </Sheet>
    </>
  );
}
