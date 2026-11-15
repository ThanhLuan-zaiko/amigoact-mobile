import { describe, expect, test } from "bun:test";
import { fromWallClock, showWallClock, toWallClock } from "./wallClock";

describe("wall clock", () => {
  test("round-trips a date and time", () => {
    const date = toWallClock("2026-11-15T08:30");
    expect(date).not.toBeNull();
    expect(fromWallClock(date as Date, "datetime")).toBe("2026-11-15T08:30");
  });

  test("round-trips a date", () => {
    const date = toWallClock("2026-01-02");
    expect(fromWallClock(date as Date, "date")).toBe("2026-01-02");
  });

  test("refuses other text", () => {
    expect(toWallClock("")).toBeNull();
    expect(toWallClock("15/11/2026")).toBeNull();
  });

  test("shows day first", () => {
    expect(showWallClock("2026-11-15T08:30")).toBe("15/11/2026 08:30");
    expect(showWallClock("2026-11-15")).toBe("15/11/2026");
  });
});
