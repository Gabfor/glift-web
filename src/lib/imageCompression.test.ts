import { describe, it, expect } from "vitest";
import { compressImage } from "./imageCompression";

describe("compressImage utility", () => {
  it("should bypass compression if file type is not an image", async () => {
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("should bypass compression if image is SVG", async () => {
    const file = new File(["<svg></svg>"], "icon.svg", { type: "image/svg+xml" });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("should bypass compression if image is GIF", async () => {
    const file = new File(["gifbytes"], "animation.gif", { type: "image/gif" });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("should return the original file if running in SSR (window undefined)", async () => {
    // Temporarily mock window as undefined
    const originalWindow = global.window;
    // @ts-expect-error - delete window to simulate SSR
    delete global.window;

    try {
      const file = new File(["imagedata"], "photo.jpg", { type: "image/jpeg" });
      const result = await compressImage(file);
      expect(result).toBe(file);
    } finally {
      global.window = originalWindow;
    }
  });
});
