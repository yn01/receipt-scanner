/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/receipts/route";
import { NextRequest } from "next/server";

// Mock supabase
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockIs = jest.fn();
const mockEq = jest.fn();
const mockOr = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockGetUser = jest.fn();

function setupQueryChain(result: { data: unknown; count?: number; error: unknown }) {
  const chain = {
    select: mockSelect.mockReturnThis(),
    is: mockIs.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    or: mockOr.mockReturnThis(),
    gte: mockGte.mockReturnThis(),
    lte: mockLte.mockReturnThis(),
    order: mockOrder.mockReturnThis(),
    range: mockRange.mockImplementation(() =>
      Promise.resolve(result)
    ),
    insert: mockInsert.mockReturnThis(),
    single: mockSingle.mockImplementation(() => Promise.resolve(result)),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}));

describe("GET /api/receipts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost/api/receipts");

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should return receipts with pagination on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    setupQueryChain({
      data: [
        {
          id: "r-1",
          store_name: "ストアA",
          total: 100,
          receipt_items: [{ name: "商品A" }],
        },
      ],
      count: 1,
      error: null,
    });

    const req = new NextRequest("http://localhost/api/receipts?page=1&limit=20");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.receipts).toHaveLength(1);
    expect(json.data.receipts[0].items).toEqual([{ name: "商品A" }]);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.total).toBe(1);
  });

  it("should apply search filter", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    setupQueryChain({ data: [], count: 0, error: null });

    const req = new NextRequest(
      "http://localhost/api/receipts?search=コンビニ"
    );
    await GET(req);

    expect(mockOr).toHaveBeenCalled();
  });

  it("should apply date range filter", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    setupQueryChain({ data: [], count: 0, error: null });

    const req = new NextRequest(
      "http://localhost/api/receipts?date_from=2025-01-01&date_to=2025-01-31"
    );
    await GET(req);

    expect(mockGte).toHaveBeenCalledWith("date", "2025-01-01");
    expect(mockLte).toHaveBeenCalledWith("date", "2025-01-31");
  });

  it("should apply amount range filter", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    setupQueryChain({ data: [], count: 0, error: null });

    const req = new NextRequest(
      "http://localhost/api/receipts?amount_min=100&amount_max=5000"
    );
    await GET(req);

    expect(mockGte).toHaveBeenCalledWith("total", 100);
    expect(mockLte).toHaveBeenCalledWith("total", 5000);
  });

  it("should return 500 on database error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    setupQueryChain({
      data: null,
      count: 0,
      error: { message: "DB error" },
    });

    const req = new NextRequest("http://localhost/api/receipts");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });

  it("should clamp page and limit values", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    setupQueryChain({ data: [], count: 0, error: null });

    const req = new NextRequest(
      "http://localhost/api/receipts?page=-1&limit=200"
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.limit).toBe(100);
  });
});

describe("POST /api/receipts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost/api/receipts", {
      method: "POST",
      body: JSON.stringify({ store_name: "テスト" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should create receipt and items on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const insertChain = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "new-receipt-id", created_at: "2025-01-15T10:00:00Z" },
        error: null,
      }),
    };
    const itemsInsertChain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "receipts") {
        return { insert: jest.fn().mockReturnValue(insertChain) };
      }
      return itemsInsertChain;
    });

    const req = new NextRequest("http://localhost/api/receipts", {
      method: "POST",
      body: JSON.stringify({
        store_name: "テストストア",
        date: "2025-01-15",
        items: [{ name: "おにぎり", quantity: 1, unit_price: 150, subtotal: 150 }],
        total: 150,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("new-receipt-id");
  });

  it("should return 500 when receipt insert fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const insertChain = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      }),
    };
    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue(insertChain),
    });

    const req = new NextRequest("http://localhost/api/receipts", {
      method: "POST",
      body: JSON.stringify({ store_name: "テスト" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});
