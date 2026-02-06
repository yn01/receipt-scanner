/**
 * @jest-environment node
 */
import { POST } from "@/app/api/ocr/route";
import { NextRequest } from "next/server";

// Mock supabase server
const mockGetUser = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

// Mock OCR module
const mockCallWithRetry = jest.fn();
jest.mock("@/lib/claude/ocr", () => ({
  callWithRetry: (...args: unknown[]) => mockCallWithRetry(...args),
  OcrError: class OcrError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = "OcrError";
    }
  },
}));

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/ocr", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/ocr", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = createRequest({
      image: "base64data",
      mimeType: "image/jpeg",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 400 when image is missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const req = createRequest({ mimeType: "image/jpeg" });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when mimeType is missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const req = createRequest({ image: "base64data" });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for unsupported mime type", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const req = createRequest({
      image: "base64data",
      mimeType: "image/bmp",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when base64 image is too large", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const largeImage = "a".repeat(5 * 1024 * 1024 + 1);
    const req = createRequest({
      image: largeImage,
      mimeType: "image/jpeg",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 200 with OCR result on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const ocrResult = {
      store_name: "テストストア",
      date: "2025-01-15",
      items: [],
      total: 442,
      confidence: 0.92,
    };
    mockCallWithRetry.mockResolvedValue(ocrResult);

    const req = createRequest({
      image: "base64data",
      mimeType: "image/jpeg",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.store_name).toBe("テストストア");
    expect(mockCallWithRetry).toHaveBeenCalledWith("base64data", "image/jpeg");
  });

  it("should return 429 for rate limit errors", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    // Import the mocked OcrError
    const { OcrError } = jest.requireMock("@/lib/claude/ocr");
    mockCallWithRetry.mockRejectedValue(
      new OcrError("RATE_LIMITED", "Rate limited")
    );

    const req = createRequest({
      image: "base64data",
      mimeType: "image/jpeg",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error.code).toBe("RATE_LIMITED");
  });

  it("should return 500 for OCR processing errors", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const { OcrError } = jest.requireMock("@/lib/claude/ocr");
    mockCallWithRetry.mockRejectedValue(
      new OcrError("OCR_FAILED", "OCR failed")
    );

    const req = createRequest({
      image: "base64data",
      mimeType: "image/jpeg",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.code).toBe("OCR_FAILED");
  });

  it("should return 500 for unexpected errors", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockCallWithRetry.mockRejectedValue(new Error("Unexpected"));

    const req = createRequest({
      image: "base64data",
      mimeType: "image/jpeg",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});
