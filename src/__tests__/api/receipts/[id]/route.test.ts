/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from "@/app/api/receipts/[id]/route";
import { NextRequest } from "next/server";

// Mock supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}));

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/receipts/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost/api/receipts/uuid-1");
    const res = await GET(req, makeParams("uuid-1"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should return receipt on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const receiptData = {
      id: "uuid-1",
      store_name: "テストストア",
      receipt_items: [
        { name: "商品A", sort_order: 1 },
        { name: "商品B", sort_order: 0 },
      ],
    };

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: receiptData,
        error: null,
      }),
    });

    const req = new NextRequest("http://localhost/api/receipts/uuid-1");
    const res = await GET(req, makeParams("uuid-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.items[0].name).toBe("商品B"); // Sorted by sort_order
    expect(json.data.items[1].name).toBe("商品A");
  });

  it("should return 404 when receipt not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      }),
    });

    const req = new NextRequest("http://localhost/api/receipts/nonexistent");
    const res = await GET(req, makeParams("nonexistent"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });
});

describe("PUT /api/receipts/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost/api/receipts/uuid-1", {
      method: "PUT",
      body: JSON.stringify({ store_name: "Updated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req, makeParams("uuid-1"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should update receipt successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ error: null }),
    };
    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    const insertChain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return updateChain; // receipts update
      if (callCount === 2) return deleteChain; // receipt_items delete
      return insertChain; // receipt_items insert
    });

    const req = new NextRequest("http://localhost/api/receipts/uuid-1", {
      method: "PUT",
      body: JSON.stringify({
        store_name: "Updated Store",
        items: [{ name: "New Item", quantity: 1, unit_price: 200, subtotal: 200 }],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PUT(req, makeParams("uuid-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("uuid-1");
  });

  it("should return 500 on update error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ error: { message: "Update failed" } }),
    });

    const req = new NextRequest("http://localhost/api/receipts/uuid-1", {
      method: "PUT",
      body: JSON.stringify({ store_name: "Updated" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PUT(req, makeParams("uuid-1"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("DELETE /api/receipts/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost/api/receipts/uuid-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams("uuid-1"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should soft-delete receipt successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ error: null }),
    });

    const req = new NextRequest("http://localhost/api/receipts/uuid-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, makeParams("uuid-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("uuid-1");
    expect(json.data.deleted_at).toBeDefined();
  });

  it("should return 500 on delete error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
    });

    const req = new NextRequest("http://localhost/api/receipts/uuid-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, makeParams("uuid-1"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});
