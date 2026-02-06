"use client";

import { useState } from "react";
import { Receipt } from "@/types/receipt";
import Button from "@/components/ui/Button";
import ImagePreview from "@/components/scan/ImagePreview";

interface ReceiptDetailProps {
  receipt: Receipt;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ReceiptDetail({
  receipt,
  onEdit,
  onDelete,
}: ReceiptDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "日付不明";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return "---";
    return `\u00A5${amount.toLocaleString()}`;
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const confidencePercent = receipt.ocr_confidence
    ? Math.round(receipt.ocr_confidence * 100)
    : null;

  return (
    <div className="space-y-6">
      <div className="md:flex md:gap-6">
        <div className="md:w-1/3 mb-4 md:mb-0">
          {receipt.image_url && (
            <ImagePreview src={receipt.image_url} alt="レシート画像" />
          )}
        </div>

        <div className="md:w-2/3 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {receipt.store_name || "店名不明"}
            </h2>
            <p className="text-gray-500">{formatDate(receipt.date)}</p>
          </div>

          {receipt.items && receipt.items.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                明細
              </h3>
              <div className="space-y-1">
                {receipt.items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex justify-between items-center py-1"
                  >
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-700">
                      x{item.quantity} {formatAmount(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="border-t border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>小計</span>
              <span>{formatAmount(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>消費税</span>
              <span>{formatAmount(receipt.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-300 pt-2">
              <span>合計</span>
              <span>{formatAmount(receipt.total)}</span>
            </div>
          </div>

          <div className="space-y-1 text-sm text-gray-500">
            {receipt.payment_method && (
              <p>支払方法: {receipt.payment_method}</p>
            )}
            {confidencePercent !== null && (
              <p>信頼度: {confidencePercent}%</p>
            )}
            <p>登録日: {formatDateTime(receipt.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button fullWidth onClick={onEdit} size="lg">
          編集する
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setShowMenu(!showMenu)}
            size="lg"
          >
            その他の操作
          </Button>
          {showMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50"
              >
                削除する
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              レシートを削除しますか?
            </h3>
            <p className="text-sm text-gray-500">
              この操作は取り消すことができません。
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
              >
                キャンセル
              </Button>
              <Button variant="danger" fullWidth onClick={onDelete}>
                削除する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
