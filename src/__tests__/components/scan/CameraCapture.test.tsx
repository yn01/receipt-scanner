import { render, screen, fireEvent } from "@testing-library/react";
import CameraCapture from "@/components/scan/CameraCapture";

describe("CameraCapture", () => {
  const mockOnCapture = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when getUserMedia is not available", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it("should render fallback file input with capture", () => {
      render(
        <CameraCapture onCapture={mockOnCapture} onError={mockOnError} />
      );
      expect(screen.getByText("カメラで撮影する")).toBeInTheDocument();
      expect(screen.getByText("ファイルを選択")).toBeInTheDocument();
    });

    it("should call onCapture when file is selected", () => {
      render(
        <CameraCapture onCapture={mockOnCapture} onError={mockOnError} />
      );
      const inputs = document.querySelectorAll('input[type="file"]');
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      fireEvent.change(inputs[0], { target: { files: [file] } });
      expect(mockOnCapture).toHaveBeenCalledWith(file);
    });
  });

  describe("when getUserMedia is available", () => {
    const mockGetUserMedia = jest.fn();

    beforeEach(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
        configurable: true,
      });
    });

    it("should render camera start button initially", () => {
      render(
        <CameraCapture onCapture={mockOnCapture} onError={mockOnError} />
      );
      expect(screen.getByText("カメラで撮影する")).toBeInTheDocument();
      expect(screen.getByText("ファイルを選択")).toBeInTheDocument();
    });

    it("should show file type hint", () => {
      render(
        <CameraCapture onCapture={mockOnCapture} onError={mockOnError} />
      );
      expect(screen.getByText("JPEG, PNG, WebP, HEIC")).toBeInTheDocument();
    });

    it("should call onCapture when a file is selected via file input", () => {
      render(
        <CameraCapture onCapture={mockOnCapture} onError={mockOnError} />
      );
      const inputs = document.querySelectorAll('input[type="file"]');
      const file = new File(["test"], "photo.png", { type: "image/png" });
      fireEvent.change(inputs[0], { target: { files: [file] } });
      expect(mockOnCapture).toHaveBeenCalledWith(file);
    });

    it("should start camera when button is clicked", async () => {
      const mockStream = {
        getTracks: () => [{ stop: jest.fn() }],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      render(
        <CameraCapture onCapture={mockOnCapture} onError={mockOnError} />
      );
      const button = screen.getByText("カメラで撮影する");
      fireEvent.click(button);

      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({ facingMode: "environment" }),
        })
      );
    });

    it("should call onError when camera access is denied", async () => {
      mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));

      render(
        <CameraCapture onCapture={mockOnCapture} onError={mockOnError} />
      );
      const button = screen.getByText("カメラで撮影する");
      fireEvent.click(button);

      // Wait for the async error handler
      await new Promise((r) => setTimeout(r, 0));

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "カメラへのアクセスが拒否されました。設定を確認してください。",
        })
      );
    });
  });
});
