import type {
  Receipt,
  ReceiptItem,
  ReceiptFormData,
  OcrResult,
  ApiResponse,
  PaginationInfo,
  ReceiptListResponse,
} from "@/types/receipt";

describe("Receipt Types", () => {
  describe("ReceiptItem", () => {
    it("should allow creating a valid ReceiptItem", () => {
      const item: ReceiptItem = {
        name: "おにぎり",
        quantity: 1,
        unit_price: 150,
        subtotal: 150,
      };
      expect(item.name).toBe("おにぎり");
      expect(item.quantity).toBe(1);
    });

    it("should allow optional id and sort_order", () => {
      const item: ReceiptItem = {
        id: "uuid-123",
        name: "お茶",
        quantity: 2,
        unit_price: 130,
        subtotal: 260,
        sort_order: 1,
      };
      expect(item.id).toBe("uuid-123");
      expect(item.sort_order).toBe(1);
    });
  });

  describe("Receipt", () => {
    it("should allow creating a valid Receipt", () => {
      const receipt: Receipt = {
        id: "uuid-1234",
        user_id: "user-uuid",
        store_name: "コンビニ",
        date: "2025-01-15",
        items: [],
        subtotal: 410,
        tax: 32,
        total: 442,
        payment_method: "現金",
        image_url: "https://example.com/img.jpg",
        ocr_confidence: 0.92,
        created_at: "2025-01-15T10:30:00Z",
        updated_at: "2025-01-15T10:30:00Z",
        deleted_at: null,
      };
      expect(receipt.id).toBe("uuid-1234");
      expect(receipt.deleted_at).toBeNull();
    });

    it("should allow nullable fields", () => {
      const receipt: Receipt = {
        id: "uuid-1234",
        user_id: "user-uuid",
        store_name: null,
        date: null,
        items: [],
        subtotal: null,
        tax: null,
        total: null,
        payment_method: null,
        image_url: null,
        ocr_confidence: null,
        created_at: "2025-01-15T10:30:00Z",
        updated_at: "2025-01-15T10:30:00Z",
        deleted_at: null,
      };
      expect(receipt.store_name).toBeNull();
      expect(receipt.total).toBeNull();
    });
  });

  describe("OcrResult", () => {
    it("should have confidence as a required number", () => {
      const result: OcrResult = {
        store_name: "テスト",
        date: "2025-01-15",
        items: [],
        subtotal: 100,
        tax: 10,
        total: 110,
        payment_method: "現金",
        confidence: 0.85,
      };
      expect(result.confidence).toBe(0.85);
    });
  });

  describe("ApiResponse", () => {
    it("should represent a success response", () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: "123" },
      };
      expect(response.success).toBe(true);
      expect(response.data?.id).toBe("123");
    });

    it("should represent an error response", () => {
      const response: ApiResponse<never> = {
        success: false,
        error: { code: "NOT_FOUND", message: "Not found" },
      };
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe("NOT_FOUND");
    });
  });

  describe("PaginationInfo", () => {
    it("should contain pagination fields", () => {
      const pagination: PaginationInfo = {
        page: 1,
        limit: 20,
        total: 45,
        total_pages: 3,
      };
      expect(pagination.total_pages).toBe(3);
    });
  });

  describe("ReceiptFormData", () => {
    it("should represent form input data", () => {
      const formData: ReceiptFormData = {
        store_name: "テストストア",
        date: "2025-01-15",
        items: [{ name: "商品", quantity: 1, unit_price: 100, subtotal: 100 }],
        subtotal: 100,
        tax: 10,
        total: 110,
        payment_method: "現金",
      };
      expect(formData.store_name).toBe("テストストア");
      expect(formData.items).toHaveLength(1);
    });
  });

  describe("ReceiptListResponse", () => {
    it("should contain receipts and pagination", () => {
      const response: ReceiptListResponse = {
        receipts: [],
        pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
      };
      expect(response.receipts).toEqual([]);
      expect(response.pagination.total).toBe(0);
    });
  });
});
