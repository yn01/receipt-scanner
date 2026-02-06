"use client";

import { useState } from "react";
import { ReceiptFormData, ReceiptItem } from "@/types/receipt";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImagePreview from "./ImagePreview";

interface OcrResultFormProps {
  ocrResult: ReceiptFormData;
  confidence: number;
  imageUrl: string;
  onSave: (data: ReceiptFormData) => void;
  onRetry: () => void;
  loading?: boolean;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  let color = "bg-emerald-600";
  let label = "高";
  if (confidence < 0.5) {
    color = "bg-red-600";
    label = "低";
  } else if (confidence < 0.8) {
    color = "bg-amber-600";
    label = "中";
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">信頼度:</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium">
        {percentage}% ({label})
      </span>
    </div>
  );
}

export default function OcrResultForm({
  ocrResult,
  confidence,
  imageUrl,
  onSave,
  onRetry,
  loading = false,
}: OcrResultFormProps) {
  const [formData, setFormData] = useState<ReceiptFormData>(ocrResult);

  const updateField = <K extends keyof ReceiptFormData>(
    key: K,
    value: ReceiptFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { name: "", quantity: 1, unit_price: 0, subtotal: 0 },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="md:flex md:gap-6">
        <div className="md:w-1/3 mb-4 md:mb-0">
          <ImagePreview src={imageUrl} alt="レシート画像" />
          <div className="mt-2">
            <ConfidenceBadge confidence={confidence} />
          </div>
        </div>

        <div className="md:w-2/3 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              基本情報
            </h3>
            <div className="space-y-3">
              <Input
                label="店名"
                value={formData.store_name}
                onChange={(e) => updateField("store_name", e.target.value)}
              />
              <Input
                label="日付"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">明細</h3>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="商品名"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(index, "name", e.target.value)
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="数量"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-20"
                      />
                      <Input
                        placeholder="単価"
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "unit_price",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                      <Input
                        placeholder="小計"
                        type="number"
                        value={item.subtotal}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "subtotal",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="明細を削除"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium min-h-[44px]"
              >
                <svg
                  className="w-4 h-4"
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
                明細を追加
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">合計</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">小計</span>
                <Input
                  type="number"
                  value={formData.subtotal}
                  onChange={(e) =>
                    updateField("subtotal", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">税額</span>
                <Input
                  type="number"
                  value={formData.tax}
                  onChange={(e) =>
                    updateField("tax", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">合計</span>
                <Input
                  type="number"
                  value={formData.total}
                  onChange={(e) =>
                    updateField("total", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">支払方法</span>
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    updateField("payment_method", e.target.value)
                  }
                  className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="現金">現金</option>
                  <option value="クレジットカード">クレジットカード</option>
                  <option value="電子マネー">電子マネー</option>
                  <option value="QRコード決済">QRコード決済</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <Button type="submit" fullWidth loading={loading} size="lg">
          保存する
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onRetry}
          disabled={loading}
          size="lg"
        >
          やり直す
        </Button>
      </div>
    </form>
  );
}
