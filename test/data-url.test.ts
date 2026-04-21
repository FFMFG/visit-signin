import { describe, expect, test } from "vitest";
import { decodeDataUrl } from "../src/worker/util/data-url";

describe("decodeDataUrl", () => {
  test("decodes a small PNG", () => {
    const pngPrefix = "data:image/png;base64,";
    // 1x1 transparent PNG
    const b64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    const { bytes, mime } = decodeDataUrl(pngPrefix + b64);
    expect(mime).toBe("image/png");
    expect(bytes[0]).toBe(0x89); // PNG signature first byte
    expect(bytes[1]).toBe(0x50); // 'P'
  });

  test("rejects non-data URLs", () => {
    expect(() => decodeDataUrl("http://example.com/image.png")).toThrow();
  });
});
