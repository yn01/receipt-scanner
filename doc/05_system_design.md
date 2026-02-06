# システム設計書 — 領収書スキャンWebアプリ（MVP）

---

## 1. システム構成図

### 全体アーキテクチャ

```
┌──────────────────────────────────────────────────────────────────┐
│                      クライアント (ブラウザ)                        │
│                                                                  │
│  ┌────────────┐   ┌──────────────┐   ┌───────────────────┐      │
│  │  カメラ撮影   │   │  画像前処理     │   │  React UI          │      │
│  │  <input> /  │──→│  browser-image │──→│  (Next.js App     │      │
│  │ getUserMedia│   │  -compression  │   │   Router)         │      │
│  └────────────┘   └──────────────┘   └─────────┬─────────┘      │
│                                                  │                │
└──────────────────────────────────────────────────┼────────────────┘
                                                   │ HTTPS
                                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Vercel (Next.js サーバー)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  Next.js API Routes (Edge/Node.js Runtime)           │        │
│  │                                                      │        │
│  │  POST /api/ocr ─────────────────→ Claude Haiku API   │        │
│  │  GET  /api/receipts              (Vision)            │        │
│  │  GET  /api/receipts/[id]                             │        │
│  │  PUT  /api/receipts/[id]                             │        │
│  │  DELETE /api/receipts/[id]                            │        │
│  └──────────┬───────────────────────────────────────────┘        │
│             │                                                    │
└─────────────┼────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Supabase                                  │
│                                                                  │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐        │
│  │  PostgreSQL   │  │  Storage        │  │  Auth         │        │
│  │  (receipts,   │  │  (レシート画像)   │  │  (JWT/RLS)    │        │
│  │  receipt_items)│  │                │  │              │        │
│  └──────────────┘  └────────────────┘  └──────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### データフロー図

```
[レシート撮影/読込フロー]

  ユーザー
    │
    │ 1. カメラ撮影 or 画像選択
    ▼
  クライアント（ブラウザ）
    │
    │ 2. browser-image-compression で圧縮（最大1MB, 1920px）
    │ 3. プレビュー表示
    │ 4. Base64エンコード
    ▼
  POST /api/ocr
    │
    │ 5. サーバー側バリデーション（ファイルタイプ・サイズ）
    │ 6. Claude Haiku Vision API 呼び出し（Base64画像送信）
    │ 7. レスポンスJSON解析
    ▼
  クライアント（OCR結果確認画面）
    │
    │ 8. ユーザーが確認・修正
    │ 9. 保存ボタン押下
    ▼
  Supabase Storage
    │ 10. 画像アップロード（{user_id}/{receipt_id}.jpg）
    ▼
  Supabase PostgreSQL
    │ 11. receipts テーブルに INSERT
    │ 12. receipt_items テーブルに INSERT（複数行）
    ▼
  レシート一覧画面へリダイレクト
```

---

## 2. ディレクトリ構成

```
receipt-scanner/
├── doc/                          # ドキュメント
├── public/                       # 静的ファイル
│   └── icons/                    # アプリアイコン
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── page.tsx              # ホーム（レシート一覧: S-03）
│   │   ├── login/
│   │   │   └── page.tsx          # ログイン画面 (S-01)
│   │   ├── signup/
│   │   │   └── page.tsx          # サインアップ画面 (S-02)
│   │   ├── scan/
│   │   │   ├── page.tsx          # レシート撮影・読込 (S-04)
│   │   │   └── confirm/
│   │   │       └── page.tsx      # OCR結果確認・編集 (S-05)
│   │   ├── receipts/
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # レシート詳細 (S-06)
│   │   │       └── edit/
│   │   │           └── page.tsx  # レシート編集 (S-07)
│   │   └── api/
│   │       ├── ocr/
│   │       │   └── route.ts      # POST /api/ocr
│   │       └── receipts/
│   │           ├── route.ts      # GET /api/receipts
│   │           └── [id]/
│   │               └── route.ts  # GET/PUT/DELETE /api/receipts/[id]
│   ├── components/
│   │   ├── ui/                   # 汎用UIコンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Loading.tsx
│   │   ├── layout/               # レイアウトコンポーネント
│   │   │   ├── Header.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── receipt/              # レシート関連コンポーネント
│   │   │   ├── ReceiptCard.tsx
│   │   │   ├── ReceiptList.tsx
│   │   │   ├── ReceiptForm.tsx
│   │   │   ├── ReceiptDetail.tsx
│   │   │   └── ReceiptItemRow.tsx
│   │   ├── scan/                 # スキャン関連コンポーネント
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   └── OcrResultForm.tsx
│   │   └── auth/                 # 認証関連コンポーネント
│   │       ├── LoginForm.tsx
│   │       └── SignupForm.tsx
│   ├── lib/                      # ユーティリティ・ライブラリ
│   │   ├── supabase/
│   │   │   ├── client.ts         # ブラウザ用Supabaseクライアント
│   │   │   ├── server.ts         # サーバー用Supabaseクライアント
│   │   │   └── middleware.ts     # 認証ミドルウェアヘルパー
│   │   ├── claude/
│   │   │   └── ocr.ts            # Claude Haiku Vision API呼び出し
│   │   ├── image/
│   │   │   └── compress.ts       # 画像圧縮処理
│   │   └── utils.ts              # 汎用ユーティリティ
│   └── types/
│       ├── receipt.ts            # レシート関連の型定義
│       ├── ocr.ts                # OCRレスポンスの型定義
│       └── database.ts           # Supabase DB型定義（自動生成）
├── supabase/
│   ├── migrations/               # DBマイグレーション
│   │   └── 001_create_tables.sql
│   └── config.toml               # Supabase設定
├── middleware.ts                  # Next.js ミドルウェア（認証チェック）
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                    # 環境変数（Git管理外）
```

---

## 3. API設計

### 3.1 POST /api/ocr — レシート画像のOCR処理

レシート画像をClaude Haiku Vision APIに送信し、構造化データを抽出する。

**リクエスト**

```
POST /api/ocr
Content-Type: application/json
Authorization: Bearer <supabase_access_token>

{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",  // Base64エンコード画像
  "mimeType": "image/jpeg"                          // MIME type
}
```

**レスポンス（成功: 200）**

```json
{
  "success": true,
  "data": {
    "store_name": "コンビニエンスストア○○",
    "date": "2025-01-15",
    "items": [
      {
        "name": "おにぎり 鮭",
        "quantity": 1,
        "unit_price": 150,
        "subtotal": 150
      },
      {
        "name": "お茶 500ml",
        "quantity": 2,
        "unit_price": 130,
        "subtotal": 260
      }
    ],
    "subtotal": 410,
    "tax": 32,
    "total": 442,
    "payment_method": "現金",
    "confidence": 0.92
  }
}
```

**レスポンス（エラー: 400/500）**

```json
{
  "success": false,
  "error": {
    "code": "OCR_FAILED",
    "message": "レシートの読み取りに失敗しました。画像を撮り直してお試しください。"
  }
}
```

### 3.2 GET /api/receipts — レシート一覧取得

**リクエスト**

```
GET /api/receipts?page=1&limit=20&search=コンビニ&date_from=2025-01-01&date_to=2025-01-31&amount_min=100&amount_max=5000
Authorization: Bearer <supabase_access_token>
```

| パラメータ | 型 | 必須 | 説明 |
|----------|-----|------|------|
| `page` | integer | No | ページ番号（デフォルト: 1） |
| `limit` | integer | No | 取得件数（デフォルト: 20、最大: 100） |
| `search` | string | No | キーワード検索（店名・商品名） |
| `date_from` | string (date) | No | 日付範囲の開始 |
| `date_to` | string (date) | No | 日付範囲の終了 |
| `amount_min` | integer | No | 金額の下限 |
| `amount_max` | integer | No | 金額の上限 |

**レスポンス（成功: 200）**

```json
{
  "success": true,
  "data": {
    "receipts": [
      {
        "id": "uuid-1234",
        "store_name": "コンビニエンスストア○○",
        "date": "2025-01-15",
        "total": 442,
        "image_url": "https://xxx.supabase.co/storage/v1/object/public/receipts/user-id/uuid-1234.jpg",
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

### 3.3 GET /api/receipts/[id] — レシート詳細取得

**リクエスト**

```
GET /api/receipts/uuid-1234
Authorization: Bearer <supabase_access_token>
```

**レスポンス（成功: 200）**

```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "user_id": "user-uuid",
    "store_name": "コンビニエンスストア○○",
    "date": "2025-01-15",
    "items": [
      {
        "id": "item-uuid-1",
        "name": "おにぎり 鮭",
        "quantity": 1,
        "unit_price": 150,
        "subtotal": 150,
        "sort_order": 1
      }
    ],
    "subtotal": 410,
    "tax": 32,
    "total": 442,
    "payment_method": "現金",
    "image_url": "https://xxx.supabase.co/storage/v1/...",
    "ocr_confidence": 0.92,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**レスポンス（エラー: 404）**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "レシートが見つかりません。"
  }
}
```

### 3.4 PUT /api/receipts/[id] — レシート更新

**リクエスト**

```
PUT /api/receipts/uuid-1234
Content-Type: application/json
Authorization: Bearer <supabase_access_token>

{
  "store_name": "コンビニエンスストア○○ △△店",
  "date": "2025-01-15",
  "items": [
    {
      "id": "item-uuid-1",
      "name": "おにぎり 鮭",
      "quantity": 1,
      "unit_price": 150,
      "subtotal": 150,
      "sort_order": 1
    },
    {
      "name": "新しい商品",
      "quantity": 1,
      "unit_price": 200,
      "subtotal": 200,
      "sort_order": 2
    }
  ],
  "subtotal": 350,
  "tax": 28,
  "total": 378,
  "payment_method": "クレジットカード"
}
```

**レスポンス（成功: 200）**

```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "updated_at": "2025-01-15T12:00:00Z"
  }
}
```

### 3.5 DELETE /api/receipts/[id] — レシート削除（論理削除）

**リクエスト**

```
DELETE /api/receipts/uuid-1234
Authorization: Bearer <supabase_access_token>
```

**レスポンス（成功: 200）**

```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "deleted_at": "2025-01-16T09:00:00Z"
  }
}
```

### 共通エラーレスポンス

| HTTPステータス | コード | 説明 |
|--------------|--------|------|
| 400 | `VALIDATION_ERROR` | リクエストパラメータ不正 |
| 401 | `UNAUTHORIZED` | 認証トークン無効/未提供 |
| 404 | `NOT_FOUND` | リソースが存在しない |
| 429 | `RATE_LIMITED` | レート制限超過 |
| 500 | `INTERNAL_ERROR` | サーバー内部エラー |

---

## 4. データベース設計

### 4.1 receipts テーブル

```sql
CREATE TABLE receipts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name    text,
  date          date,
  subtotal      integer,          -- 税抜合計（円単位）
  tax           integer,          -- 税額（円単位）
  total         integer,          -- 税込合計（円単位）
  payment_method text,
  image_url     text,             -- Supabase Storage上のパス
  ocr_confidence real,            -- OCR信頼度 (0.0-1.0)
  ocr_raw_response jsonb,         -- Claude APIの生レスポンス（デバッグ用）
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz       -- 論理削除用（NULLなら有効）
);
```

### 4.2 receipt_items テーブル

```sql
CREATE TABLE receipt_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id  uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name        text NOT NULL,
  quantity    integer NOT NULL DEFAULT 1,
  unit_price  integer NOT NULL,    -- 単価（円単位）
  subtotal    integer NOT NULL,    -- 小計（円単位）
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

### 4.3 インデックス

```sql
-- receipts テーブル
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(user_id, date DESC);
CREATE INDEX idx_receipts_deleted_at ON receipts(deleted_at);
CREATE INDEX idx_receipts_store_name ON receipts USING gin(to_tsvector('simple', coalesce(store_name, '')));

-- receipt_items テーブル
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_name ON receipt_items USING gin(to_tsvector('simple', name));
```

### 4.4 updated_at 自動更新トリガー

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 4.5 RLSポリシー

```sql
-- receipts テーブル
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_select" ON receipts
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "receipts_insert" ON receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "receipts_update" ON receipts
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "receipts_delete" ON receipts
  FOR UPDATE USING (auth.uid() = user_id);
  -- 論理削除のため、DELETE操作ではなくUPDATE（deleted_atの設定）で行う

-- receipt_items テーブル
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipt_items_select" ON receipt_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
        AND receipts.deleted_at IS NULL
    )
  );

CREATE POLICY "receipt_items_insert" ON receipt_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "receipt_items_update" ON receipt_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "receipt_items_delete" ON receipt_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );
```

### 4.6 Supabase Storage ポリシー

```sql
-- バケット: receipts
-- パス構成: {user_id}/{receipt_id}.jpg

CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 5. Claude Haiku Vision API連携

### 5.1 リクエスト形式

```typescript
// src/lib/claude/ocr.ts

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function extractReceiptData(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp"
) {
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
              data: base64Image, // Base64文字列（data:プレフィックスなし）
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
```

### 5.2 プロンプト設計

```typescript
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
```

### 5.3 レスポンスパース処理

```typescript
interface OcrResult {
  store_name: string | null;
  date: string | null;
  items: OcrItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  payment_method: string | null;
  confidence: number;
}

function parseOcrResponse(response: Anthropic.Message): OcrResult {
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new OcrError("OCR_PARSE_ERROR", "APIレスポンスにテキストが含まれていません");
  }

  const jsonText = textBlock.text.trim();

  // JSON部分の抽出（```json ... ``` で囲まれている場合に対応）
  const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                    jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new OcrError("OCR_PARSE_ERROR", "JSONの抽出に失敗しました");
  }

  const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

  // 型の検証とサニタイズ
  return {
    store_name: typeof parsed.store_name === "string" ? parsed.store_name : null,
    date: isValidDate(parsed.date) ? parsed.date : null,
    items: Array.isArray(parsed.items) ? parsed.items.map(sanitizeItem) : [],
    subtotal: typeof parsed.subtotal === "number" ? Math.round(parsed.subtotal) : null,
    tax: typeof parsed.tax === "number" ? Math.round(parsed.tax) : null,
    total: typeof parsed.total === "number" ? Math.round(parsed.total) : null,
    payment_method: typeof parsed.payment_method === "string" ? parsed.payment_method : null,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
  };
}
```

### 5.4 エラーハンドリング

```typescript
class OcrError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

async function callWithRetry(
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
          throw new OcrError("RATE_LIMITED", "APIの利用制限に達しました。しばらく待ってからお試しください。");
        }
        if (error instanceof Anthropic.APIError) {
          throw new OcrError("API_ERROR", "OCR処理中にエラーが発生しました。再度お試しください。");
        }
        throw new OcrError("OCR_FAILED", "レシートの読み取りに失敗しました。画像を撮り直してお試しください。");
      }
      // リトライ前に待機
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new OcrError("OCR_FAILED", "予期しないエラーが発生しました。");
}
```

---

## 6. 認証・認可設計

### 6.1 Supabase Auth フロー

```
[サインアップフロー]

  ユーザー ──→ SignupForm ──→ supabase.auth.signUp({ email, password })
                                      │
                                      ▼
                              Supabase Auth (auth.users作成)
                                      │
                                      ▼
                              JWT発行 → Cookie保存
                                      │
                                      ▼
                              レシート一覧画面へリダイレクト

[ログインフロー]

  ユーザー ──→ LoginForm ──→ supabase.auth.signInWithPassword({ email, password })
                                      │
                                      ▼
                              JWT検証 → セッション確立
                                      │
                                      ▼
                              レシート一覧画面へリダイレクト
```

### 6.2 Supabaseクライアント設定

**ブラウザ用クライアント（`src/lib/supabase/client.ts`）**

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**サーバー用クライアント（`src/lib/supabase/server.ts`）**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### 6.3 セッション管理

- Supabase Authが発行するJWTトークンをHTTP-only Cookieに保存
- トークンの有効期限: 1時間（Supabaseデフォルト）
- リフレッシュトークンによる自動更新

### 6.4 ミドルウェア（`middleware.ts`）

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // セッションのリフレッシュ（JWTの有効期限チェック）
  const { data: { user } } = await supabase.auth.getUser();

  // 未認証ユーザーのリダイレクト
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 認証済みユーザーがログイン画面にアクセスした場合のリダイレクト
  if (user && isPublicPath) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
```

---

## 7. 画像処理フロー

### 7.1 クライアント側前処理

```typescript
// src/lib/image/compress.ts

import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,            // 最大1MB
  maxWidthOrHeight: 1920,  // 長辺最大1920px
  useWebWorker: true,      // Web Workerで非同期処理
  fileType: "image/jpeg",  // JPEG出力（圧縮率最適）
};

export async function compressImage(file: File): Promise<{
  compressed: File;
  base64: string;
  preview: string;
}> {
  // 1. ファイルバリデーション
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("対応していない画像形式です。JPEG、PNG、WebP、HEICに対応しています。");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("ファイルサイズが10MBを超えています。");
  }

  // 2. 圧縮処理
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

  // 3. Base64変換（API送信用）
  const base64 = await fileToBase64(compressed);

  // 4. プレビューURL生成
  const preview = URL.createObjectURL(compressed);

  return { compressed, base64, preview };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // "data:image/jpeg;base64," プレフィックスを除去
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 7.2 Supabase Storageへのアップロード

```typescript
// 画像アップロード処理

async function uploadReceiptImage(
  supabase: SupabaseClient,
  userId: string,
  receiptId: string,
  compressedFile: File
): Promise<string> {
  const filePath = `${userId}/${receiptId}.jpg`;

  const { error } = await supabase.storage
    .from("receipts")
    .upload(filePath, compressedFile, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error("画像のアップロードに失敗しました。");
  }

  // 署名付きURLの取得（1年有効）
  const { data } = supabase.storage
    .from("receipts")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
```

### 7.3 画像処理の全体フロー

```
1. ユーザーがカメラ撮影 or ファイル選択
   │
2. クライアント: ファイルバリデーション（形式・サイズチェック）
   │
3. クライアント: browser-image-compression で圧縮
   │  - 最大1MB / 最大1920px
   │  - Web Worker使用
   │
4. クライアント: プレビュー表示
   │
5. クライアント: Base64エンコード → POST /api/ocr 送信
   │
6. サーバー: Claude Haiku Vision API 呼び出し
   │
7. クライアント: OCR結果を表示、ユーザーが確認・修正
   │
8. クライアント: 保存ボタン押下
   │  ├─ Supabase Storage に画像アップロード
   │  └─ Supabase PostgreSQL にデータ保存
   │
9. レシート一覧画面へ遷移
```

---

## 8. エラーハンドリング方針

### 8.1 エラー分類

| カテゴリ | 例 | 対応方針 |
|---------|-----|---------|
| **入力エラー** | 非対応ファイル形式、サイズ超過 | クライアント側でバリデーション、即時フィードバック |
| **認証エラー** | トークン期限切れ、未認証 | ログイン画面へリダイレクト |
| **OCRエラー** | API応答なし、解析失敗 | リトライ1回 → ユーザーに再撮影を促す |
| **ネットワークエラー** | 通信断、タイムアウト | ユーザーに再試行を促す |
| **サーバーエラー** | DB接続失敗、内部エラー | 汎用エラーメッセージを表示、ログ記録 |
| **レート制限** | Claude API制限超過 | 待機後にリトライを促す |

### 8.2 クライアント側エラーハンドリング

- **トースト通知**: 一時的なエラー（ネットワークエラー、バリデーションエラー）にはトースト通知で表示
- **インラインエラー**: フォームバリデーションエラーは各フィールドの直下に表示
- **エラー画面**: 回復不可能なエラー（認証失敗、サーバーダウン）は専用エラー画面を表示
- **ローディング状態**: OCR処理中はスピナーとともに「レシートを読み取り中...」と表示

### 8.3 サーバー側エラーハンドリング

- API Routeで統一的なエラーレスポンス形式を使用（`{ success: false, error: { code, message } }`）
- Claude API呼び出しには10秒のタイムアウトを設定
- リトライは最大1回（バックオフ付き）
- エラーの詳細はサーバーログに記録し、クライアントにはユーザーフレンドリーなメッセージのみ返す

### 8.4 環境変数

```
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # サーバーサイド管理用

# Claude API
CLAUDE_API_KEY=sk-ant-...
```
