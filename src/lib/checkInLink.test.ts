import { describe, expect, test } from "bun:test";
import { sessionQrUrl, tokenFromScan } from "./checkInLink";

describe("sessionQrUrl", () => {
  test("uses the web address when it is set", () => {
    expect(sessionQrUrl("https://amigo.example/", "a b")).toBe(
      "https://amigo.example/checkin?token=a%20b",
    );
  });

  test("falls back to the app scheme", () => {
    expect(sessionQrUrl(undefined, "t1")).toBe("amigoact://checkin?token=t1");
    expect(sessionQrUrl("  ", "t1")).toBe("amigoact://checkin?token=t1");
  });
});

describe("tokenFromScan", () => {
  test("reads the token of a web or app check-in link", () => {
    expect(tokenFromScan("https://amigo.example/checkin?token=a%20b")).toBe(
      "a b",
    );
    expect(tokenFromScan("amigoact://checkin?token=t1")).toBe("t1");
    expect(tokenFromScan("http://10.0.2.2:3000/checkin?x=1&token=t2#top")).toBe(
      "t2",
    );
  });

  test("refuses other codes", () => {
    expect(tokenFromScan("https://amigo.example/login?token=a")).toBeNull();
    expect(tokenFromScan("hello")).toBeNull();
    expect(tokenFromScan("https://amigo.example/checkin?token=")).toBeNull();
    expect(
      tokenFromScan("https://amigo.example/checkin?token=%E0%A4%A"),
    ).toBeNull();
  });
});
