import QRCode from "qrcode";
import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

const SIZE = 192;

// The attendance QR, drawn on the phone from the same address the web draws
// on its server. A QR is data, not an icon, so react-native-svg draws it.
// Dark modules on white, so every camera reads it in both themes.
export default function SessionQr({ url }: { url: string }) {
  const { path, count } = useMemo(() => {
    const code = QRCode.create(url, { errorCorrectionLevel: "M" });
    const size = code.modules.size;
    let d = "";
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (code.modules.get(x, y)) d += `M${x + 1} ${y + 1}h1v1h-1z`;
      }
    }
    return { path: d, count: size + 2 };
  }, [url]);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Mã QR điểm danh"
      className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800"
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${count} ${count}`}>
        <Rect width={count} height={count} fill="#ffffff" />
        <Path d={path} fill="#0f172a" />
      </Svg>
    </View>
  );
}
