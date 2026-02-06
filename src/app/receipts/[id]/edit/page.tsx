"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import ReceiptForm from "@/components/receipt/ReceiptForm";
import Loading from "@/components/ui/Loading";
import { Receipt, ReceiptFormData } from "@/types/receipt";

export default function ReceiptEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/receipts/${id}`);
        const data = await res.json();

        if (!data.success) {
          setError(data.error?.message || "レシートの取得に失敗しました。");
          return;
        }

        setReceipt(data.data);
      } catch {
        setError("レシートの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  const handleSubmit = async (formData: ReceiptFormData) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: formData.store_name,
          date: formData.date || null,
          items: formData.items,
          subtotal: formData.subtotal,
          tax: formData.tax,
          total: formData.total,
          payment_method: formData.payment_method || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "更新に失敗しました。");
        return;
      }

      router.push(`/receipts/${id}`);
    } catch {
      setError("更新に失敗しました。再度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  const initialFormData: ReceiptFormData | null = receipt
    ? {
        store_name: receipt.store_name || "",
        date: receipt.date || "",
        items: receipt.items || [],
        subtotal: receipt.subtotal || 0,
        tax: receipt.tax || 0,
        total: receipt.total || 0,
        payment_method: receipt.payment_method || "",
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="レシート編集" showBackButton />
      <main className="max-w-2xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <Loading />
        ) : initialFormData ? (
          <ReceiptForm
            initialData={initialFormData}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/receipts/${id}`)}
            loading={saving}
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">レシートが見つかりません。</p>
          </div>
        )}
      </main>
    </div>
  );
}
