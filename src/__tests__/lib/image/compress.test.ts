import { compressImage, formatFileSize } from "@/lib/image/compress";

// Mock browser-image-compression
jest.mock("browser-image-compression", () =>
  jest.fn().mockResolvedValue(
    new File(["compressed"], "compressed.jpg", { type: "image/jpeg" })
  )
);

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/mock-url");

describe("Image Compression Module", () => {
  describe("compressImage", () => {
    it("should accept JPEG files", async () => {
      const file = new File(["data"], "test.jpg", { type: "image/jpeg" });
      const result = await compressImage(file);
      expect(result.compressed).toBeDefined();
      expect(result.base64).toBeDefined();
      expect(result.preview).toBe("blob:http://localhost/mock-url");
    });

    it("should accept PNG files", async () => {
      const file = new File(["data"], "test.png", { type: "image/png" });
      const result = await compressImage(file);
      expect(result.compressed).toBeDefined();
    });

    it("should accept WebP files", async () => {
      const file = new File(["data"], "test.webp", { type: "image/webp" });
      const result = await compressImage(file);
      expect(result.compressed).toBeDefined();
    });

    it("should accept HEIC files", async () => {
      const file = new File(["data"], "test.heic", { type: "image/heic" });
      const result = await compressImage(file);
      expect(result.compressed).toBeDefined();
    });

    it("should reject unsupported file types", async () => {
      const file = new File(["data"], "test.bmp", { type: "image/bmp" });
      await expect(compressImage(file)).rejects.toThrow(
        "対応していない画像形式です"
      );
    });

    it("should reject PDF files", async () => {
      const file = new File(["data"], "test.pdf", { type: "application/pdf" });
      await expect(compressImage(file)).rejects.toThrow(
        "対応していない画像形式です"
      );
    });

    it("should reject files over 10MB", async () => {
      const largeContent = new Uint8Array(10 * 1024 * 1024 + 1);
      const file = new File([largeContent], "large.jpg", {
        type: "image/jpeg",
      });
      await expect(compressImage(file)).rejects.toThrow(
        "ファイルサイズが10MBを超えています"
      );
    });

    it("should accept files exactly at 10MB", async () => {
      const content = new Uint8Array(10 * 1024 * 1024);
      const file = new File([content], "exact.jpg", { type: "image/jpeg" });
      const result = await compressImage(file);
      expect(result.compressed).toBeDefined();
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500B");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1.0KB");
      expect(formatFileSize(1536)).toBe("1.5KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1.0MB");
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5MB");
    });

    it("should format zero bytes", () => {
      expect(formatFileSize(0)).toBe("0B");
    });
  });
});
