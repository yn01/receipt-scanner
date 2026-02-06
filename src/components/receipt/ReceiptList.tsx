"use client";

import { useRouter } from "next/navigation";
import { Receipt } from "@/types/receipt";
import ReceiptCard from "./ReceiptCard";

interface ReceiptListProps {
  receipts: Receipt[];
}

function groupByMonth(
  receipts: Receipt[]
): { key: string; label: string; receipts: Receipt[] }[] {
  const groups: Record<string, Receipt[]> = {};
  for (const r of receipts) {
    const date = r.date ? new Date(r.date) : new Date(r.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, receipts]) => {
      const [year, month] = key.split("-");
      return {
        key,
        label: `${year}年${parseInt(month)}月`,
        receipts,
      };
    });
}

export default function ReceiptList({ receipts }: ReceiptListProps) {
  const router = useRouter();

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-500 font-medium mb-1">
          レシートがまだありません
        </p>
        <p className="text-sm text-gray-400 text-center mb-4">
          最初のレシートをスキャンして
          <br />
          経費管理を始めましょう
        </p>
        <button
          onClick={() => router.push("/scan")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          レシートをスキャン
        </button>
      </div>
    );
  }

  const groups = groupByMonth(receipts);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.key}>
          <h2 className="text-sm font-medium text-gray-500 mb-2 px-1">
            {group.label}
          </h2>
          <div className="space-y-2">
            {group.receipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                id={receipt.id}
                storeName={receipt.store_name}
                date={receipt.date}
                total={receipt.total}
                thumbnailUrl={receipt.image_url}
                onClick={() => router.push(`/receipts/${receipt.id}`)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
