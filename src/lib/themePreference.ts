import * as SecureStore from "expo-secure-store";
import { Uniwind } from "uniwind";

// The header toggle, the native counterpart of the web ThemeToggle and its
// `theme` key in localStorage. Without a saved choice the app follows the system.
const KEY = "amigoact.theme";

export type ThemeChoice = "light" | "dark";

export async function restoreTheme(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(KEY);
    if (saved === "light" || saved === "dark") Uniwind.setTheme(saved);
  } catch {
    // The keystore can be unavailable; the system theme stays.
  }
}

export async function chooseTheme(theme: ThemeChoice): Promise<void> {
  Uniwind.setTheme(theme);
  try {
    await SecureStore.setItemAsync(KEY, theme);
  } catch {
    // The theme still switches for this run.
  }
}
