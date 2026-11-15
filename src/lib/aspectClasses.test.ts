import { describe, expect, test } from "bun:test";
import { aspectClass } from "./aspectClasses";

describe("aspectClass", () => {
  test("picks the nearest listed shape", () => {
    expect(aspectClass(1920, 1080)).toBe("aspect-video");
    expect(aspectClass(1000, 1000)).toBe("aspect-square");
    expect(aspectClass(1080, 1920)).toBe("aspect-[0.5625]");
  });

  test("clamps very wide and very tall pictures", () => {
    expect(aspectClass(5000, 100)).toBe("aspect-[3]");
    expect(aspectClass(100, 5000)).toBe("aspect-[0.5]");
  });

  test("falls back to 4:3 without a size", () => {
    expect(aspectClass(null, 200)).toBe("aspect-[1.3333]");
    expect(aspectClass(0, 0)).toBe("aspect-[1.3333]");
  });
});
