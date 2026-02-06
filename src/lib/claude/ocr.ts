import Anthropic from "@anthropic-ai/sdk";
import { OcrResult, ReceiptItem } from "@/types/receipt";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const RECEIPT_EXTRACTION_PROMPT = `
このレシート画像から以下の情報を抽出し、JSON形式で返してください。
読み取れない項目はnullとしてください。

出力するJSONの形式:
{
  "store_name": "店名",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "name": "商品名",
      "quantity": 数量(整数),
      "unit_price": 単価(整数、円単位),
      "subtotal": 小計(整数、円単位)
    }
  ],
  "subtotal": 税抜合計(整数、円単位),
  "tax": 消費税額(整数、円単位),
  "total": 税込合計(整数、円単位),
  "payment_method": "支払方法",
  "confidence": 全体の読み取り信頼度(0.0-1.0の小数)
}

注意事項:
- 金額はすべて整数（円単位）で返してください
- 日付はISO 8601形式（YYYY-MM-DD）で返してください
- 商品の数量が明示されていない場合は1としてください
- 支払方法が不明な場合はnullとしてください
- confidenceは画像の鮮明さと読み取り精度に基づいて判定してください
- JSON以外のテキストは出力しないでください
`;

function isValidDate(dateStr: unknown): boolean {
  if (typeof dateStr !== "string") return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function sanitizeItem(item: Record<string, unknown>): ReceiptItem {
  return {
    name: typeof item.name === "string" ? item.name : "不明",
    quantity:
      typeof item.quantity === "number" ? Math.round(item.quantity) : 1,
    unit_price:
      typeof item.unit_price === "number" ? Math.round(item.unit_price) : 0,
    subtotal:
      typeof item.subtotal === "number" ? Math.round(item.subtotal) : 0,
  };
}

export class OcrError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "OcrError";
  }
}

function parseOcrResponse(response: Anthropic.Message): OcrResult {
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new OcrError(
      "OCR_PARSE_ERROR",
      "APIレスポンスにテキストが含まれていません"
    );
  }

  const jsonText = textBlock.text.trim();

  const jsonMatch =
    jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
    jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new OcrError("OCR_PARSE_ERROR", "JSONの抽出に失敗しました");
  }

  const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

  return {
    store_name:
      typeof parsed.store_name === "string" ? parsed.store_name : null,
    date: isValidDate(parsed.date) ? parsed.date : null,
    items: Array.isArray(parsed.items)
      ? parsed.items.map(sanitizeItem)
      : [],
    subtotal:
      typeof parsed.subtotal === "number"
        ? Math.round(parsed.subtotal)
        : null,
    tax:
      typeof parsed.tax === "number" ? Math.round(parsed.tax) : null,
    total:
      typeof parsed.total === "number" ? Math.round(parsed.total) : null,
    payment_method:
      typeof parsed.payment_method === "string"
        ? parsed.payment_method
        : null,
    confidence:
      typeof parsed.confidence === "number" ? parsed.confidence : 0,
  };
}

export async function extractReceiptData(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp"
): Promise<OcrResult> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: RECEIPT_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  return parseOcrResponse(response);
}

export async function callWithRetry(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
  maxRetries: number = 1
): Promise<OcrResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await extractReceiptData(base64Image, mimeType);
    } catch (error) {
      if (attempt === maxRetries) {
        if (error instanceof Anthropic.RateLimitError) {
          throw new OcrError(
            "RATE_LIMITED",
            "APIの利用制限に達しました。しばらく待ってからお試しください。"
          );
        }
        if (error instanceof Anthropic.APIError) {
          throw new OcrError(
            "API_ERROR",
            "OCR処理中にエラーが発生しました。再度お試しください。"
          );
        }
        if (error instanceof OcrError) {
          throw error;
        }
        throw new OcrError(
          "OCR_FAILED",
          "レシートの読み取りに失敗しました。画像を撮り直してお試しください。"
        );
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (attempt + 1))
      );
    }
  }
  throw new OcrError("OCR_FAILED", "予期しないエラーが発生しました。");
}
