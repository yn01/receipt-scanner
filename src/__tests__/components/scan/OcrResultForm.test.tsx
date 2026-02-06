import { render, screen, fireEvent } from "@testing-library/react";
import OcrResultForm from "@/components/scan/OcrResultForm";
import type { ReceiptFormData } from "@/types/receipt";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    return <img {...props} />;
  },
}));

const mockOcrResult: ReceiptFormData = {
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
};

describe("OcrResultForm", () => {
  const mockOnSave = jest.fn();
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render basic info fields", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.92}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    expect(screen.getByText("基本情報")).toBeInTheDocument();
    expect(screen.getByText("明細")).toBeInTheDocument();
    // "合計" appears as both section header and label
    expect(screen.getAllByText("合計").length).toBeGreaterThanOrEqual(1);
  });

  it("should display confidence badge", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.92}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    expect(screen.getByText("信頼度:")).toBeInTheDocument();
    expect(screen.getByText("92% (高)")).toBeInTheDocument();
  });

  it("should show medium confidence label", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.65}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    expect(screen.getByText("65% (中)")).toBeInTheDocument();
  });

  it("should show low confidence label", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.3}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    expect(screen.getByText("30% (低)")).toBeInTheDocument();
  });

  it("should display item details", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.92}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    expect(screen.getByDisplayValue("おにぎり")).toBeInTheDocument();
    expect(screen.getByDisplayValue("お茶")).toBeInTheDocument();
  });

  it("should add a new item when add button is clicked", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.92}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    const addButton = screen.getByText("明細を追加");
    fireEvent.click(addButton);

    // Should now have 3 delete buttons (one per item)
    const deleteButtons = screen.getAllByLabelText("明細を削除");
    expect(deleteButtons).toHaveLength(3);
  });

  it("should remove an item when delete button is clicked", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.92}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    const deleteButtons = screen.getAllByLabelText("明細を削除");
    fireEvent.click(deleteButtons[0]);

    expect(screen.queryByDisplayValue("おにぎり")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("お茶")).toBeInTheDocument();
  });

  it("should call onSave when form is submitted", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.92}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    fireEvent.click(screen.getByText("保存する"));
    expect(mockOnSave).toHaveBeenCalledWith(mockOcrResult);
  });

  it("should call onRetry when retry button is clicked", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.92}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    fireEvent.click(screen.getByText("やり直す"));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("should display image preview", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.92}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    const img = screen.getByAltText("レシート画像");
    expect(img).toBeInTheDocument();
  });

  it("should render payment method dropdown", () => {
    render(
      <OcrResultForm
        ocrResult={mockOcrResult}
        confidence={0.92}
        imageUrl="https://example.com/img.jpg"
        onSave={mockOnSave}
        onRetry={mockOnRetry}
      />
    );
    expect(screen.getByText("支払方法")).toBeInTheDocument();
    expect(screen.getByDisplayValue("現金")).toBeInTheDocument();
  });
});
