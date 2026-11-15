import { describe, expect, test } from "bun:test";
import { tokenFromParam } from "./deepLink";

describe("tokenFromParam", () => {
  test("returns a token string, trimmed", () => {
    expect(tokenFromParam("abc_DEF-123")).toBe("abc_DEF-123");
    expect(tokenFromParam("  abc  ")).toBe("abc");
  });

  test("uses the first value when the query repeats", () => {
    expect(tokenFromParam(["first", "second"])).toBe("first");
  });

  test("missing, empty or blank is null", () => {
    expect(tokenFromParam(undefined)).toBeNull();
    expect(tokenFromParam("")).toBeNull();
    expect(tokenFromParam("   ")).toBeNull();
    expect(tokenFromParam([])).toBeNull();
  });

  test("regression: an oversized value is refused before any request", () => {
    expect(tokenFromParam("a".repeat(513))).toBeNull();
    expect(tokenFromParam("a".repeat(512))).not.toBeNull();
  });
});
