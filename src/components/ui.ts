// Shared Tailwind class strings, the native counterpart of amigoact-fe
// src/app/_components/ui.ts. One teal accent, 1px slate borders, small radius,
// no shadows. Buttons and inputs are at least 44 points tall for touch.
//
// React Native has no inherited text style, so every Text carries its font
// class: font-body, font-body-medium, or font-body-semibold (see global.css).
// Do not use font-semibold and friends: a weight on a custom font can render
// bold twice on Android.

export const screen = "flex-1 bg-white dark:bg-slate-950";

export const panel = "rounded-lg border border-slate-200 dark:border-slate-800";

export const pageTitle =
  "font-body-semibold text-2xl text-slate-900 dark:text-slate-100";

export const mutedText = "font-body text-sm text-slate-500 dark:text-slate-400";

export const fieldLabel =
  "font-body-semibold text-sm text-slate-700 dark:text-slate-300";

const input =
  "h-11 w-full rounded-md border px-3 font-body text-base text-slate-900 dark:text-slate-100";

export const inputField = `${input} border-slate-300 dark:border-slate-700`;

export const inputFieldFocused = `${input} border-teal-700 dark:border-teal-400`;

// Like the web, an invalid field gets a strong neutral border, not red.
export const inputFieldInvalid = `${input} border-slate-900 dark:border-slate-100`;

export const fieldError =
  "font-body-semibold text-xs text-red-700 dark:text-red-400";

export const successText =
  "font-body-semibold text-xs text-green-700 dark:text-green-400";

export const primaryButton =
  "h-11 flex-row items-center justify-center gap-2 rounded-md border border-teal-700 bg-teal-700 px-4 active:bg-teal-800 dark:border-teal-400 dark:bg-teal-400 dark:active:bg-teal-300";

export const primaryButtonText =
  "font-body-semibold text-sm text-white dark:text-teal-950";

export const iconButton =
  "h-11 w-11 items-center justify-center rounded-md border border-slate-200 active:border-teal-700 dark:border-slate-800 dark:active:border-teal-400";

export const linkText =
  "font-body-semibold text-sm text-teal-700 dark:text-teal-400";
