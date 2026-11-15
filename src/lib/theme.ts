// Exact hex values of the Tailwind shades used on the web, for props that
// cannot take a class (icon color, status bar, navigator options).
export const colors = {
  light: {
    accent: "#0f766e", // teal-700
    onAccent: "#ffffff", // text and icons on an accent button
    text: "#0f172a", // slate-900
    muted: "#475569", // slate-600
    border: "#e2e8f0", // slate-200
    surface: "#ffffff",
    error: "#b91c1c", // red-700
    success: "#15803d", // green-700
    warning: "#b45309", // amber-700
    info: "#0369a1", // sky-700
  },
  dark: {
    accent: "#2dd4bf", // teal-400
    onAccent: "#042f2e", // teal-950
    text: "#f1f5f9", // slate-100
    muted: "#94a3b8", // slate-400
    border: "#1e293b", // slate-800
    surface: "#020617", // slate-950
    error: "#f87171", // red-400
    success: "#4ade80", // green-400
    warning: "#fbbf24", // amber-400
    info: "#38bdf8", // sky-400
  },
} as const;

export type ThemeColors = (typeof colors)["light"] | (typeof colors)["dark"];
