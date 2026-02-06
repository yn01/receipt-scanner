"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CameraCapture from "@/components/scan/CameraCapture";
import ImagePreview from "@/components/scan/ImagePreview";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import { compressImage, formatFileSize } from "@/lib/image/compress";

export default function ScanPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCapture = async (file: File) => {
    setError(null);
    setCompressing(true);

    try {
      const result = await compressImage(file);
      setImageFile(result.compressed);
      setPreviewUrl(result.preview);
      setBase64(result.base64);
      setMimeType("image/jpeg");
      setCompressedSize(formatFileSize(result.compressed.size));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "画像の処理に失敗しました。"
      );
    } finally {
      setCompressing(false);
    }
  };

  const handleError = (err: Error) => {
    setError(err.message);
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl(null);
    setBase64(null);
    setMimeType(null);
    setCompressedSize(null);
  };

  const handleProceed = () => {
    if (!base64 || !mimeType || !previewUrl) return;

    sessionStorage.setItem(
      "scanData",
      JSON.stringify({ base64, mimeType, previewUrl })
    );
    router.push("/scan/confirm");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="レシート読込" showBackButton />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {compressing && <Loading message="画像を圧縮中..." />}

        {!imageFile && !compressing && (
          <CameraCapture onCapture={handleCapture} onError={handleError} />
        )}

        {imageFile && previewUrl && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">プレビュー</h2>
            <ImagePreview
              src={previewUrl}
              alt="撮影した画像"
              compressedSize={compressedSize || undefined}
              onRemove={handleRemoveImage}
            />
            <Button fullWidth onClick={handleProceed} size="lg">
              この画像で読み取る
            </Button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
