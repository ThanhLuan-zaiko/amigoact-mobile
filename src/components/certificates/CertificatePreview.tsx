import { View } from "react-native";
import Svg, {
  Rect,
  Image as SvgImage,
  Text as SvgText,
} from "react-native-svg";
import {
  type Layout,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  PLACEMENT_KEYS,
  type PlacementKey,
  pagePoint,
} from "@/lib/certificates";
import { mediaSource } from "@/lib/http";

const SAMPLE_TEXT: Record<PlacementKey, string> = {
  name: "Nguyễn Văn A",
  activity: "Tên hoạt động",
  hours: "12 giờ tình nguyện",
  date: "10/11/2026",
  serial: "AMG-XXXX-XXXX-XXXX",
};

// The certificate page drawn as SVG, the same drawing as the web preview: A4
// landscape in points, each text at its x/y percentage. The paper stays white
// in dark mode, because it shows what gets printed.
export default function CertificatePreview({
  layout,
  backgroundUrl,
  label,
  texts = SAMPLE_TEXT,
}: {
  layout: Layout;
  backgroundUrl: string | null;
  label: string;
  texts?: Record<PlacementKey, string>;
}) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      className="aspect-[1.4151] w-full overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
      >
        <Rect width={PAGE_WIDTH} height={PAGE_HEIGHT} fill="#ffffff" />
        {backgroundUrl ? (
          <SvgImage
            href={mediaSource(backgroundUrl, 1600).uri}
            width={PAGE_WIDTH}
            height={PAGE_HEIGHT}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : null}
        {PLACEMENT_KEYS.map((key) => {
          const placement = layout[key];
          const point = pagePoint(placement);
          return (
            <SvgText
              key={key}
              x={point.x}
              y={point.y}
              fontSize={placement.size}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontFamily={
                key === "name"
                  ? "BeVietnamPro_600SemiBold"
                  : "BeVietnamPro_500Medium"
              }
              fill={key === "name" ? "#0f172a" : "#334155"}
            >
              {texts[key]}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
