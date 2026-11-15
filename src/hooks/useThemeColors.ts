import { useUniwind } from "uniwind";
import { colors, type ThemeColors } from "@/lib/theme";

// Colors for props that cannot take a class. Follows the theme Uniwind draws
// with, which is the system theme unless the viewer picked one in the header.
export function useThemeColors(): ThemeColors {
  return useUniwind().theme === "dark" ? colors.dark : colors.light;
}
