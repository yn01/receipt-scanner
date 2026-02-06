"use client";

import Image from "next/image";

interface ReceiptCardProps {
  id: string;
  storeName: string | null;
  date: string | null;
  total: number | null;
  thumbnailUrl: string | null;
  onClick: () => void;
}

export default function ReceiptCard({
  storeName,
  date,
  total,
  thumbnailUrl,
  onClick,
}: ReceiptCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "日付不明";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return "---";
    return `\u00A5${amount.toLocaleString()}`;
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
    >
      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={storeName || "レシート"}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {storeName || "店名不明"}
        </p>
        <p className="text-sm text-gray-500">{formatDate(date)}</p>
      </div>
      <p className="text-base font-semibold text-gray-900 flex-shrink-0">
        {formatAmount(total)}
      </p>
    </button>
  );
}
