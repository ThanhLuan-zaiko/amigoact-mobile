import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ThemeColors } from "@/lib/theme";

export type IconName = keyof typeof Feather.glyphMap;
export type IconTone = keyof ThemeColors;

// The web icons with no Feather twin (see AGENTS.md). "heart" is the filled
// heart of a liked comment; Feather draws outlines only.
export type ExtraIconName = "qrcode" | "pin" | "pin-off" | "heart";

// A Feather icon colored from the theme, since an icon color cannot be a class.
export default function Icon({
  name,
  size = 16,
  tone = "text",
}: {
  name: IconName;
  size?: number;
  tone?: IconTone;
}) {
  const theme = useThemeColors();
  return <Feather name={name} size={size} color={theme[tone]} />;
}

export function ExtraIcon({
  name,
  size = 16,
  tone = "text",
}: {
  name: ExtraIconName;
  size?: number;
  tone?: IconTone;
}) {
  const theme = useThemeColors();
  return <MaterialCommunityIcons name={name} size={size} color={theme[tone]} />;
}
