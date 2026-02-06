"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Receipt } from "@/types/receipt";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ReceiptList from "@/components/receipt/ReceiptList";
import Loading from "@/components/ui/Loading";

export default function HomePage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchReceipts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/receipts?${params}`);
      const data = await res.json();
      if (data.success) {
        setReceipts(data.data.receipts);
      }
    } catch (error) {
      console.error("Failed to fetch receipts:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header
        title="ReceiptScan"
        rightAction={
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 min-h-[44px] px-2"
          >
            ログアウト
          </button>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="レシートを検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
        </div>

        {loading ? (
          <Loading message="レシートを読み込み中..." />
        ) : (
          <ReceiptList receipts={receipts} />
        )}
      </main>

      <button
        onClick={() => router.push("/scan")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center z-30 lg:bottom-8"
        aria-label="新規スキャン"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      <BottomNav />
    </div>
  );
}
