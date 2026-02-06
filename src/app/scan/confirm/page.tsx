"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import OcrResultForm from "@/components/scan/OcrResultForm";
import Loading from "@/components/ui/Loading";
import { ReceiptFormData } from "@/types/receipt";
import { createClient } from "@/lib/supabase/client";

export default function ScanConfirmPage() {
  const [ocrResult, setOcrResult] = useState<ReceiptFormData | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [base64, setBase64] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const scanDataRaw = sessionStorage.getItem("scanData");
    if (!scanDataRaw) {
      router.push("/scan");
      return;
    }

    const scanData = JSON.parse(scanDataRaw);
    setBase64(scanData.base64);
    setMimeType(scanData.mimeType);
    setImageUrl(scanData.previewUrl);

    performOcr(scanData.base64, scanData.mimeType);
  }, [router]);

  const performOcr = async (imageBase64: string, imageMimeType: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, mimeType: imageMimeType }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "OCR処理に失敗しました。");
        return;
      }

      const result = data.data;
      setConfidence(result.confidence || 0);
      setOcrResult({
        store_name: result.store_name || "",
        date: result.date || "",
        items: result.items || [],
        subtotal: result.subtotal || 0,
        tax: result.tax || 0,
        total: result.total || 0,
        payment_method: result.payment_method || "",
      });
    } catch {
      setError("レシートの読み取りに失敗しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: ReceiptFormData) => {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      let imageStorageUrl: string | null = null;

      const receiptId = crypto.randomUUID();
      const filePath = `${user.id}/${receiptId}.jpg`;

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType || "image/jpeg" });

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, blob, { contentType: "image/jpeg", upsert: false });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(filePath);
        imageStorageUrl = urlData.publicUrl;
      }

      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: formData.store_name,
          date: formData.date || null,
          items: formData.items,
          subtotal: formData.subtotal,
          tax: formData.tax,
          total: formData.total,
          payment_method: formData.payment_method || null,
          image_url: imageStorageUrl,
          ocr_confidence: confidence,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "保存に失敗しました。");
        return;
      }

      sessionStorage.removeItem("scanData");
      router.push("/");
    } catch {
      setError("保存に失敗しました。再度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    sessionStorage.removeItem("scanData");
    router.push("/scan");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="読み取り結果確認" showBackButton />
      <main className="max-w-2xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
            <button
              onClick={() => performOcr(base64, mimeType)}
              className="ml-2 text-red-700 underline"
            >
              リトライ
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16">
            <Loading message="レシートを読み取っています..." />
            <div className="mt-4 mx-auto max-w-[200px]">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/5" />
              </div>
            </div>
          </div>
        ) : ocrResult ? (
          <OcrResultForm
            ocrResult={ocrResult}
            confidence={confidence}
            imageUrl={imageUrl}
            onSave={handleSave}
            onRetry={handleRetry}
            loading={saving}
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">
              レシートの読み取りに失敗しました。
            </p>
            <button
              onClick={handleRetry}
              className="text-blue-600 hover:underline"
            >
              撮り直す
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
