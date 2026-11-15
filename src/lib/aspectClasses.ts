// Picture shapes as Tailwind classes. Inline styles are not allowed (CI gate
// 13), and Tailwind only builds classes it finds written out in source, so
// every shape is listed here in full, like the web focusClasses.ts. A picture
// takes the nearest shape, which is never more than a few percent off.
const SHAPES: readonly (readonly [number, string])[] = [
  [0.5, "aspect-[0.5]"],
  [0.5625, "aspect-[0.5625]"],
  [0.625, "aspect-[0.625]"],
  [0.6667, "aspect-[0.6667]"],
  [0.75, "aspect-[0.75]"],
  [0.8, "aspect-[0.8]"],
  [0.9, "aspect-[0.9]"],
  [1, "aspect-square"],
  [1.125, "aspect-[1.125]"],
  [1.25, "aspect-[1.25]"],
  [1.3333, "aspect-[1.3333]"],
  [1.5, "aspect-[1.5]"],
  [1.6, "aspect-[1.6]"],
  [1.7778, "aspect-video"],
  [2, "aspect-[2]"],
  [2.3333, "aspect-[2.3333]"],
  [3, "aspect-[3]"],
];

export function aspectClass(
  width: number | null | undefined,
  height: number | null | undefined,
): string {
  if (!width || !height || width <= 0 || height <= 0) return "aspect-[1.3333]";
  const ratio = width / height;
  let best = SHAPES[0];
  for (const shape of SHAPES) {
    if (Math.abs(shape[0] - ratio) < Math.abs(best[0] - ratio)) best = shape;
  }
  return best[1];
}
