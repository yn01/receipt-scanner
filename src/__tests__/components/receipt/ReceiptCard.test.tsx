import { render, screen, fireEvent } from "@testing-library/react";
import ReceiptCard from "@/components/receipt/ReceiptCard";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("ReceiptCard", () => {
  const mockOnClick = jest.fn();
  const defaultProps = {
    id: "uuid-1234",
    storeName: "テストストア",
    date: "2025-01-15",
    total: 442,
    thumbnailUrl: "https://example.com/img.jpg",
    onClick: mockOnClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display store name", () => {
    render(<ReceiptCard {...defaultProps} />);
    expect(screen.getByText("テストストア")).toBeInTheDocument();
  });

  it("should display formatted date", () => {
    render(<ReceiptCard {...defaultProps} />);
    expect(screen.getByText("2025/01/15")).toBeInTheDocument();
  });

  it("should display formatted total amount", () => {
    render(<ReceiptCard {...defaultProps} />);
    expect(screen.getByText("\u00A5442")).toBeInTheDocument();
  });

  it("should display thumbnail image", () => {
    render(<ReceiptCard {...defaultProps} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/img.jpg");
  });

  it("should display placeholder when no thumbnail", () => {
    render(<ReceiptCard {...defaultProps} thumbnailUrl={null} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should display '店名不明' when store name is null", () => {
    render(<ReceiptCard {...defaultProps} storeName={null} />);
    expect(screen.getByText("店名不明")).toBeInTheDocument();
  });

  it("should display '日付不明' when date is null", () => {
    render(<ReceiptCard {...defaultProps} date={null} />);
    expect(screen.getByText("日付不明")).toBeInTheDocument();
  });

  it("should display '---' when total is null", () => {
    render(<ReceiptCard {...defaultProps} total={null} />);
    expect(screen.getByText("---")).toBeInTheDocument();
  });

  it("should call onClick when card is clicked", () => {
    render(<ReceiptCard {...defaultProps} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should format large amounts with commas", () => {
    render(<ReceiptCard {...defaultProps} total={12345} />);
    expect(screen.getByText("\u00A512,345")).toBeInTheDocument();
  });
});
