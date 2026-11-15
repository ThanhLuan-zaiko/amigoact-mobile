// Shared Tailwind class strings, the native counterpart of amigoact-fe
// src/app/_components/ui.ts. One teal accent, 1px slate borders, small radius,
// no shadows. Buttons and inputs are at least 44 points tall for touch.
//
// React Native has no inherited text style, so every Text carries its font
// class: font-body, font-body-medium, or font-body-semibold (see global.css).
// Do not use font-semibold and friends: a weight on a custom font can render
// bold twice on Android. A button is a Pressable with a box class and a Text
// with the matching text class.

export const screen = "flex-1 bg-white dark:bg-slate-950";

// Section or card. A border and a larger radius.
export const panel = "rounded-lg border border-slate-200 dark:border-slate-800";

export const pageTitle =
  "font-body-semibold text-2xl text-slate-900 dark:text-slate-100";

export const sectionTitle =
  "font-body-semibold text-base text-slate-900 dark:text-slate-100";

export const bodyText = "font-body text-sm text-slate-900 dark:text-slate-100";

export const strongText =
  "font-body-semibold text-sm text-slate-900 dark:text-slate-100";

export const mutedText = "font-body text-sm text-slate-500 dark:text-slate-400";

export const smallMuted =
  "font-body text-xs text-slate-500 dark:text-slate-400";

export const fieldLabel =
  "font-body-semibold text-sm text-slate-700 dark:text-slate-300";

const input =
  "min-h-11 w-full rounded-md border px-3 py-2.5 font-body text-sm text-slate-900 dark:text-slate-100";

export const inputField = `${input} border-slate-300 dark:border-slate-700`;

export const inputFieldFocused = `${input} border-teal-700 dark:border-teal-400`;

// Like the web, an invalid field gets a strong neutral border, not red.
export const inputFieldInvalid = `${input} border-slate-900 dark:border-slate-100`;

export const fieldError =
  "font-body-semibold text-xs text-red-700 dark:text-red-400";

export const successText =
  "font-body-semibold text-xs text-green-700 dark:text-green-400";

export const errorText =
  "font-body-semibold text-sm text-red-700 dark:text-red-400";

const buttonBox =
  "min-h-11 flex-row items-center justify-center gap-2 rounded-md border px-4";

export const primaryButton = `${buttonBox} border-teal-700 bg-teal-700 active:bg-teal-800 dark:border-teal-400 dark:bg-teal-400 dark:active:bg-teal-300`;

export const primaryButtonText =
  "font-body-semibold text-sm text-white dark:text-teal-950";

export const secondaryButton = `${buttonBox} border-teal-700 active:bg-teal-50 dark:border-teal-400 dark:active:bg-teal-950/40`;

export const secondaryButtonText =
  "font-body-semibold text-sm text-teal-700 dark:text-teal-400";

// Neutral slate for a reversible action, such as moving something to the trash.
export const neutralButton = `${buttonBox} border-slate-300 active:border-slate-500 dark:border-slate-700 dark:active:border-slate-500`;

export const neutralButtonText =
  "font-body-semibold text-sm text-slate-700 dark:text-slate-300";

// Red marks an action that cannot be undone.
export const dangerButton = `${buttonBox} border-red-700 bg-red-700 active:bg-red-800 dark:border-red-400 dark:bg-red-400 dark:active:bg-red-300`;

export const dangerButtonText =
  "font-body-semibold text-sm text-white dark:text-red-950";

export const iconButton =
  "h-11 w-11 items-center justify-center rounded-md border border-slate-200 active:border-teal-700 dark:border-slate-800 dark:active:border-teal-400";

export const iconButtonActive =
  "h-11 w-11 items-center justify-center rounded-md border border-teal-700 dark:border-teal-400";

export const chipButton =
  "min-h-9 flex-row items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 active:border-teal-700 dark:border-slate-800 dark:active:border-teal-400";

export const chipPressed =
  "min-h-9 flex-row items-center gap-2 rounded-md border border-teal-700 px-3 py-1.5 dark:border-teal-400";

export const chipText =
  "font-body-semibold text-sm text-slate-700 dark:text-slate-300";

export const chipPressedText =
  "font-body-semibold text-sm text-teal-700 dark:text-teal-400";

export const tagChip =
  "rounded-sm border border-slate-200 px-2 py-1 dark:border-slate-800";

export const tagChipText =
  "font-body-medium text-xs text-slate-600 dark:text-slate-300";

// Segmented control used for tabs and sub-navigation.
export const segmentList =
  "flex-row gap-1 rounded-md border border-slate-200 p-1 dark:border-slate-800";

export const segmentItem =
  "min-h-10 flex-row items-center justify-center gap-2 rounded-sm border px-3 py-2";

export const segmentActive = "border-teal-700 dark:border-teal-400";

export const segmentIdle = "border-transparent";

export const segmentActiveText =
  "font-body-semibold text-sm text-teal-700 dark:text-teal-400";

export const segmentIdleText =
  "font-body-semibold text-sm text-slate-600 dark:text-slate-400";

export const divider = "border-b border-slate-200 dark:border-slate-800";

export const linkText =
  "font-body-semibold text-sm text-teal-700 dark:text-teal-400";

// A badge with one semantic color, as on the web.
export const badge = {
  green: "rounded-sm bg-green-50 px-2 py-0.5 dark:bg-green-950/40",
  amber: "rounded-sm bg-amber-50 px-2 py-0.5 dark:bg-amber-950/40",
  red: "rounded-sm bg-red-50 px-2 py-0.5 dark:bg-red-950/40",
  sky: "rounded-sm bg-sky-50 px-2 py-0.5 dark:bg-sky-950/40",
  slate: "rounded-sm border border-slate-200 px-2 py-0.5 dark:border-slate-800",
  teal: "rounded-sm bg-teal-50 px-2 py-0.5 dark:bg-teal-950/40",
} as const;

export const badgeText = {
  green: "font-body-semibold text-xs text-green-700 dark:text-green-400",
  amber: "font-body-semibold text-xs text-amber-700 dark:text-amber-400",
  red: "font-body-semibold text-xs text-red-700 dark:text-red-400",
  sky: "font-body-semibold text-xs text-sky-700 dark:text-sky-400",
  slate: "font-body-semibold text-xs text-slate-700 dark:text-slate-300",
  teal: "font-body-semibold text-xs text-teal-700 dark:text-teal-400",
} as const;

export type Tone = keyof typeof badge;
