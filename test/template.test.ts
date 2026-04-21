import { describe, expect, test } from "vitest";
import { renderTemplate } from "../src/worker/pdf/template";

describe("renderTemplate", () => {
  test("substitutes simple vars", () => {
    expect(renderTemplate("Hello {{name}}!", { name: "Jane" })).toBe("Hello Jane!");
  });

  test("empty for missing vars", () => {
    expect(renderTemplate("Hello {{name}}!", {})).toBe("Hello !");
  });

  test("conditional renders when truthy", () => {
    expect(
      renderTemplate("A{{#if x}}B{{/if}}C", { x: "yes" }),
    ).toBe("ABC");
  });

  test("conditional omits when falsy", () => {
    expect(
      renderTemplate("A{{#if x}}B{{/if}}C", { x: false }),
    ).toBe("AC");
    expect(
      renderTemplate("A{{#if x}}B{{/if}}C", { x: undefined }),
    ).toBe("AC");
  });

  test("real NDA-style interpolation", () => {
    const t = "Visitor {{visitorName}} of {{company}} on {{date}}.";
    expect(
      renderTemplate(t, {
        visitorName: "Jane Doe",
        company: "Acme",
        date: "2026-04-21",
      }),
    ).toBe("Visitor Jane Doe of Acme on 2026-04-21.");
  });
});
