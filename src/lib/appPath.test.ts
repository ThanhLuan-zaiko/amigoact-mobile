import { describe, expect, test } from "bun:test";
import { appPath, param } from "./appPath";

describe("appPath", () => {
  test("moves owner addresses onto /org", () => {
    expect(appPath("/organizations/abc/posts/1")).toBe("/org/abc/posts/1");
    expect(appPath("/organizations/abc")).toBe("/org/abc");
  });

  test("keeps the organization list and the create form", () => {
    expect(appPath("/organizations")).toBe("/organizations");
    expect(appPath("/organizations/new")).toBe("/organizations/new");
  });

  test("keeps the query and drops the hash", () => {
    expect(appPath("/?tab=orgs#org-search")).toBe("/?tab=orgs");
    expect(appPath("/org/a/posts?tag=x")).toBe("/org/a/posts?tag=x");
  });
});

describe("param", () => {
  test("reads the first value", () => {
    expect(param(["a", "b"])).toBe("a");
    expect(param(undefined)).toBe("");
    expect(param("x")).toBe("x");
  });
});
