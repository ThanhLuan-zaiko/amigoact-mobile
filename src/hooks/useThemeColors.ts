import { useColorScheme } from "react-native";
import { colors, type ThemeColors } from "@/lib/theme";

// Colors for props that cannot take a class. Follows the system theme.
export function useThemeColors(): ThemeColors {
  return useColorScheme() === "dark" ? colors.dark : colors.light;
}
