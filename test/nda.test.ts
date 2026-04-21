import { describe, expect, test } from "vitest";
import { selectNdaTemplate } from "../src/worker/pdf/nda";

describe("selectNdaTemplate", () => {
  test("US Person → standard template", () => {
    const t = selectNdaTemplate("us_person");
    expect(t).toContain("U.S. Person Acknowledgment");
    expect(t).not.toContain("Deemed Export");
  });

  test("Foreign National → ITAR template", () => {
    const t = selectNdaTemplate("foreign_national");
    expect(t).toContain("Foreign National");
    expect(t).toContain("Deemed Export");
    expect(t).toContain("ESCORT REQUIRED");
  });
});
