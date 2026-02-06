/**
 * @jest-environment node
 */

// Create a shared mock function accessible from the mock factory and tests
const mockMessagesCreate = jest.fn();

jest.mock("@anthropic-ai/sdk", () => {
  class MockAPIError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = "APIError";
    }
  }
  class MockRateLimitError extends MockAPIError {
    constructor(message = "Rate limited") {
      super(429, message);
      this.name = "RateLimitError";
    }
  }

  return {
    __esModule: true,
    default: class MockAnthropic {
      messages = { create: (...args: unknown[]) => mockMessagesCreate(...args) };
      static APIError = MockAPIError;
      static RateLimitError = MockRateLimitError;
    },
  };
});

import { extractReceiptData, callWithRetry, OcrError } from "@/lib/claude/ocr";

function makeResponse(text: string) {
  return {
    content: [{ type: "text", text }],
  };
}

const validJson = JSON.stringify({
  store_name: "テストストア",
  date: "2025-01-15",
  items: [
    { name: "おにぎり", quantity: 1, unit_price: 150, subtotal: 150 },
    { name: "お茶", quantity: 2, unit_price: 130, subtotal: 260 },
  ],
  subtotal: 410,
  tax: 32,
  total: 442,
  payment_method: "現金",
  confidence: 0.92,
});

describe("OCR Module", () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("extractReceiptData", () => {
    it("should parse valid JSON response correctly", async () => {
      mockMessagesCreate.mockResolvedValue(makeResponse(validJson));
      const result = await extractReceiptData("base64data", "image/jpeg");

      expect(result.store_name).toBe("テストストア");
      expect(result.date).toBe("2025-01-15");
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe("おにぎり");
      expect(result.total).toBe(442);
      expect(result.confidence).toBe(0.92);
      expect(result.payment_method).toBe("現金");
    });

    it("should parse JSON wrapped in code block", async () => {
      const wrapped = "```json\n" + validJson + "\n```";
      mockMessagesCreate.mockResolvedValue(makeResponse(wrapped));
      const result = await extractReceiptData("base64data", "image/jpeg");

      expect(result.store_name).toBe("テストストア");
      expect(result.total).toBe(442);
    });

    it("should handle null fields gracefully", async () => {
      const partial = JSON.stringify({
        store_name: null,
        date: null,
        items: [],
        subtotal: null,
        tax: null,
        total: null,
        payment_method: null,
        confidence: 0.3,
      });
      mockMessagesCreate.mockResolvedValue(makeResponse(partial));
      const result = await extractReceiptData("base64data", "image/png");

      expect(result.store_name).toBeNull();
      expect(result.date).toBeNull();
      expect(result.items).toEqual([]);
      expect(result.total).toBeNull();
      expect(result.confidence).toBe(0.3);
    });

    it("should sanitize items with missing fields", async () => {
      const data = JSON.stringify({
        store_name: "テスト",
        date: "2025-01-15",
        items: [{ name: "商品A" }, { quantity: 2, unit_price: 100 }],
        total: 100,
        confidence: 0.5,
      });
      mockMessagesCreate.mockResolvedValue(makeResponse(data));
      const result = await extractReceiptData("base64data", "image/jpeg");

      expect(result.items[0].name).toBe("商品A");
      expect(result.items[0].quantity).toBe(1);
      expect(result.items[0].unit_price).toBe(0);
      expect(result.items[1].name).toBe("不明");
      expect(result.items[1].quantity).toBe(2);
    });

    it("should round fractional amounts", async () => {
      const data = JSON.stringify({
        store_name: "テスト",
        date: "2025-01-15",
        items: [{ name: "A", quantity: 1, unit_price: 99.5, subtotal: 99.5 }],
        subtotal: 99.5,
        tax: 7.9,
        total: 107.4,
        confidence: 0.8,
      });
      mockMessagesCreate.mockResolvedValue(makeResponse(data));
      const result = await extractReceiptData("base64data", "image/webp");

      expect(result.subtotal).toBe(100);
      expect(result.tax).toBe(8);
      expect(result.total).toBe(107);
    });

    it("should throw OcrError when response has no text block", async () => {
      mockMessagesCreate.mockResolvedValue({ content: [] });
      await expect(
        extractReceiptData("base64data", "image/jpeg")
      ).rejects.toThrow(OcrError);
    });

    it("should throw OcrError when response contains no JSON", async () => {
      mockMessagesCreate.mockResolvedValue(
        makeResponse("This is not JSON at all")
      );
      await expect(
        extractReceiptData("base64data", "image/jpeg")
      ).rejects.toThrow(OcrError);
    });

    it("should handle invalid date", async () => {
      const data = JSON.stringify({
        store_name: "テスト",
        date: "not-a-date",
        items: [],
        total: 100,
        confidence: 0.5,
      });
      mockMessagesCreate.mockResolvedValue(makeResponse(data));
      const result = await extractReceiptData("base64data", "image/jpeg");
      expect(result.date).toBeNull();
    });

    it("should default confidence to 0 when missing", async () => {
      const data = JSON.stringify({
        store_name: "テスト",
        date: "2025-01-15",
        items: [],
        total: 100,
      });
      mockMessagesCreate.mockResolvedValue(makeResponse(data));
      const result = await extractReceiptData("base64data", "image/jpeg");
      expect(result.confidence).toBe(0);
    });
  });

  describe("callWithRetry", () => {
    // Use real timers for retry tests since they need actual setTimeout
    beforeEach(() => {
      jest.useRealTimers();
    });

    it("should succeed on first attempt", async () => {
      mockMessagesCreate.mockResolvedValue(makeResponse(validJson));
      const result = await callWithRetry("base64data", "image/jpeg", 0);
      expect(result.store_name).toBe("テストストア");
      expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
    });

    it("should retry and succeed on second attempt", async () => {
      mockMessagesCreate
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(makeResponse(validJson));

      const result = await callWithRetry("base64data", "image/jpeg", 1);

      expect(result.store_name).toBe("テストストア");
      expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
    }, 10000);

    it("should throw OcrError after max retries exceeded", async () => {
      mockMessagesCreate.mockRejectedValue(new Error("Persistent error"));

      await expect(
        callWithRetry("base64data", "image/jpeg", 0)
      ).rejects.toThrow(OcrError);
    });

    it("should re-throw OcrError as-is", async () => {
      const ocrError = new OcrError("OCR_PARSE_ERROR", "Parse failed");
      mockMessagesCreate.mockRejectedValue(ocrError);

      await expect(
        callWithRetry("base64data", "image/jpeg", 0)
      ).rejects.toThrow(ocrError);
    });
  });

  describe("OcrError", () => {
    it("should have code and message", () => {
      const err = new OcrError("TEST_CODE", "Test message");
      expect(err.code).toBe("TEST_CODE");
      expect(err.message).toBe("Test message");
      expect(err.name).toBe("OcrError");
      expect(err).toBeInstanceOf(Error);
    });
  });
});
