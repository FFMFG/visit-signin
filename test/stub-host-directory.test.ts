import { describe, expect, test } from "vitest";
import { StubHostDirectory } from "../src/worker/services/host-directory";

describe("StubHostDirectory", () => {
  test("list returns all hosts", async () => {
    const d = new StubHostDirectory();
    const all = await d.list();
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  test("search is case-insensitive by name", async () => {
    const d = new StubHostDirectory();
    const r = await d.search("tal");
    expect(r.some((h) => h.displayName === "Tal Schwartz")).toBe(true);
  });

  test("search by email fragment", async () => {
    const d = new StubHostDirectory();
    const r = await d.search("shipping@");
    expect(r.length).toBe(1);
    expect(r[0]?.email).toBe("shipping@ffmfg.com");
  });

  test("getById returns null for unknown", async () => {
    const d = new StubHostDirectory();
    expect(await d.getById("nope")).toBeNull();
  });
});
