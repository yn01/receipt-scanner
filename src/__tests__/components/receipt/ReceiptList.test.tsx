import { render, screen, fireEvent } from "@testing-library/react";
import ReceiptList from "@/components/receipt/ReceiptList";
import type { Receipt } from "@/types/receipt";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    return <img {...props} />;
  },
}));

function makeReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "uuid-1",
    user_id: "user-1",
    store_name: "テストストア",
    date: "2025-01-15",
    items: [],
    subtotal: 410,
    tax: 32,
    total: 442,
    payment_method: "現金",
    image_url: null,
    ocr_confidence: 0.9,
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
    deleted_at: null,
    ...overrides,
  };
}

describe("ReceiptList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show empty state when no receipts", () => {
    render(<ReceiptList receipts={[]} />);
    expect(screen.getByText("レシートがまだありません")).toBeInTheDocument();
    expect(screen.getByText("レシートをスキャン")).toBeInTheDocument();
  });

  it("should navigate to /scan when empty state button clicked", () => {
    render(<ReceiptList receipts={[]} />);
    fireEvent.click(screen.getByText("レシートをスキャン"));
    expect(mockPush).toHaveBeenCalledWith("/scan");
  });

  it("should display receipts grouped by month", () => {
    const receipts = [
      makeReceipt({ id: "1", date: "2025-01-15" }),
      makeReceipt({ id: "2", date: "2025-01-20" }),
      makeReceipt({ id: "3", date: "2025-02-10" }),
    ];
    render(<ReceiptList receipts={receipts} />);
    expect(screen.getByText("2025年2月")).toBeInTheDocument();
    expect(screen.getByText("2025年1月")).toBeInTheDocument();
  });

  it("should navigate to receipt detail on card click", () => {
    const receipts = [makeReceipt({ id: "uuid-123" })];
    render(<ReceiptList receipts={receipts} />);
    const card = screen.getByRole("button");
    fireEvent.click(card);
    expect(mockPush).toHaveBeenCalledWith("/receipts/uuid-123");
  });

  it("should display multiple receipts in the same month", () => {
    const receipts = [
      makeReceipt({ id: "1", store_name: "ストアA", date: "2025-01-15" }),
      makeReceipt({ id: "2", store_name: "ストアB", date: "2025-01-20" }),
    ];
    render(<ReceiptList receipts={receipts} />);
    expect(screen.getByText("ストアA")).toBeInTheDocument();
    expect(screen.getByText("ストアB")).toBeInTheDocument();
  });

  it("should use created_at for grouping when date is null", () => {
    const receipts = [
      makeReceipt({
        id: "1",
        date: null,
        created_at: "2025-03-15T10:00:00Z",
      }),
    ];
    render(<ReceiptList receipts={receipts} />);
    expect(screen.getByText("2025年3月")).toBeInTheDocument();
  });
});
