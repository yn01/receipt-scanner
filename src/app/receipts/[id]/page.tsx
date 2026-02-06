"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ReceiptDetail from "@/components/receipt/ReceiptDetail";
import Loading from "@/components/ui/Loading";
import { Receipt } from "@/types/receipt";

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        router.push("/");
      } else {
        setError(data.error?.message || "削除に失敗しました。");
      }
    } catch {
      setError("削除に失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="レシート詳細" showBackButton />
      <main className="max-w-2xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <Loading />
        ) : receipt ? (
          <ReceiptDetail
            receipt={receipt}
            onEdit={() => router.push(`/receipts/${id}/edit`)}
            onDelete={handleDelete}
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">レシートが見つかりません。</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
