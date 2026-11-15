import { describe, expect, test } from "bun:test";
import { checkFields } from "./formCheck";
import { FIELD_MESSAGES } from "./validation";

describe("checkFields", () => {
  test("flags empty required fields", () => {
    expect(checkFields({ city: " " }, ["city"])).toEqual({
      city: FIELD_MESSAGES.required,
    });
  });

  test("applies the shared rule for a filled field", () => {
    expect(checkFields({ max_participants: "abc" }).max_participants).toBe(
      FIELD_MESSAGES.capacity,
    );
  });

  test("passes empty optional fields", () => {
    expect(checkFields({ website: "" })).toEqual({});
  });
});
