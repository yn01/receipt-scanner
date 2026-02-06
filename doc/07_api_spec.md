# API仕様書 — 領収書スキャンWebアプリ（MVP）

## 1. 共通仕様

### 1.1 ベースURL

```
開発環境: http://localhost:3000/api
本番環境: https://<your-domain>/api
```

### 1.2 認証方式

全てのAPIエンドポイントでSupabase Auth認証が必要です。

- 認証はSupabase Auth のセッションCookie（JWT）で行われます
- Next.js のサーバーサイドで `createClient()` を通じて `supabase.auth.getUser()` を呼び出し、認証状態を検証します
- 未認証の場合は `401 Unauthorized` が返却されます

### 1.3 共通レスポンス形式

全APIは以下の統一形式でレスポンスを返します。

**成功時:**

```json
{
  "success": true,
  "data": { ... }
}
```

**エラー時:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "ユーザー向けエラーメッセージ"
  }
}
```

### 1.4 共通エラーコード

| HTTPステータス | code | 説明 |
|--------------|------|------|
| 400 | `VALIDATION_ERROR` | リクエストパラメータ不正 |
| 401 | `UNAUTHORIZED` | 認証が必要、またはトークン無効 |
| 404 | `NOT_FOUND` | リソースが存在しない |
| 429 | `RATE_LIMITED` | Claude APIのレート制限超過 |
| 500 | `INTERNAL_ERROR` | サーバー内部エラー |
| 500 | `OCR_FAILED` | OCR処理失敗 |
| 500 | `OCR_PARSE_ERROR` | OCRレスポンスの解析失敗 |
| 500 | `API_ERROR` | Claude APIエラー |

---

## 2. エンドポイント一覧

| メソッド | パス | 概要 |
|---------|------|------|
| POST | `/api/ocr` | レシート画像のOCR処理 |
| GET | `/api/receipts` | レシート一覧取得 |
| POST | `/api/receipts` | レシート新規保存 |
| GET | `/api/receipts/[id]` | レシート詳細取得 |
| PUT | `/api/receipts/[id]` | レシート更新 |
| DELETE | `/api/receipts/[id]` | レシート削除（論理削除） |

---

## 3. POST /api/ocr

レシート画像をClaude Haiku Vision APIに送信し、構造化データを抽出します。

### リクエスト

```
POST /api/ocr
Content-Type: application/json
```

**リクエストボディ:**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `image` | string | Yes | Base64エンコードされた画像データ（`data:` プレフィックスなし） |
| `mimeType` | string | Yes | 画像のMIMEタイプ |

**許可されるMIMEタイプ:**

- `image/jpeg`
- `image/png`
- `image/webp`

**サイズ制限:**

- Base64文字列の最大長: 5MB（実ファイル約3.75MB相当）

### リクエスト例

```json
{
  "image": "/9j/4AAQSkZJRg...",
  "mimeType": "image/jpeg"
}
```

### レスポンス（成功: 200）

```json
{
  "success": true,
  "data": {
    "store_name": "コンビニエンスストアA",
    "date": "2026-02-05",
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

**レスポンスフィールド（`data`）:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `store_name` | string \| null | 店名 |
| `date` | string \| null | 購入日（YYYY-MM-DD形式） |
| `items` | array | 明細行の配列 |
| `items[].name` | string | 商品名（読み取れない場合は `"不明"`） |
| `items[].quantity` | integer | 数量（明示されていない場合は `1`） |
| `items[].unit_price` | integer | 単価（円単位） |
| `items[].subtotal` | integer | 小計（円単位） |
| `subtotal` | integer \| null | 税抜合計（円単位） |
| `tax` | integer \| null | 税額（円単位） |
| `total` | integer \| null | 税込合計（円単位） |
| `payment_method` | string \| null | 支払方法 |
| `confidence` | number | OCR信頼度スコア（0.0〜1.0） |

### エラーレスポンス

**400 - バリデーションエラー:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "画像データとMIMEタイプは必須です。"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "対応していない画像形式です。JPEG、PNG、WebPに対応しています。"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "画像サイズが大きすぎます。"
  }
}
```

**429 - レート制限:**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "APIの利用制限に達しました。しばらく待ってからお試しください。"
  }
}
```

**500 - OCR処理失敗:**

```json
{
  "success": false,
  "error": {
    "code": "OCR_FAILED",
    "message": "レシートの読み取りに失敗しました。画像を撮り直してお試しください。"
  }
}
```

### 処理フロー

1. Supabase Authによる認証チェック
2. リクエストボディのバリデーション（`image`、`mimeType` の存在確認）
3. MIMEタイプの検証
4. Base64データサイズの検証
5. Claude Haiku Vision API呼び出し（リトライ最大1回、バックオフ付き）
6. APIレスポンスからJSONを抽出・パース
7. フィールドの型検証・サニタイズ

---

## 4. GET /api/receipts

認証ユーザーのレシート一覧を取得します。論理削除されたレシートは除外されます。

### リクエスト

```
GET /api/receipts?page=1&limit=20&search=コンビニ&date_from=2026-01-01&date_to=2026-01-31&amount_min=100&amount_max=5000
```

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| `page` | integer | No | `1` | ページ番号（1以上） |
| `limit` | integer | No | `20` | 1ページあたりの取得件数（1〜100） |
| `search` | string | No | - | キーワード検索（店名の部分一致、大文字小文字不問） |
| `date_from` | string (date) | No | - | 日付範囲の開始（YYYY-MM-DD） |
| `date_to` | string (date) | No | - | 日付範囲の終了（YYYY-MM-DD） |
| `amount_min` | integer | No | - | 合計金額の下限 |
| `amount_max` | integer | No | - | 合計金額の上限 |

### レスポンス（成功: 200）

```json
{
  "success": true,
  "data": {
    "receipts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "user-uuid",
        "store_name": "コンビニエンスストアA",
        "date": "2026-02-05",
        "subtotal": 410,
        "tax": 32,
        "total": 442,
        "payment_method": "現金",
        "image_url": "https://xxx.supabase.co/storage/v1/object/public/receipts/user-id/receipt-id.jpg",
        "ocr_confidence": 0.92,
        "ocr_raw_response": { ... },
        "created_at": "2026-02-05T10:30:00Z",
        "updated_at": "2026-02-05T10:30:00Z",
        "deleted_at": null,
        "items": [
          {
            "id": "item-uuid",
            "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "おにぎり 鮭",
            "quantity": 1,
            "unit_price": 150,
            "subtotal": 150,
            "sort_order": 0,
            "created_at": "2026-02-05T10:30:00Z"
          }
        ]
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

**ソート順:** 日付降順、同日の場合は作成日時降順

**レスポンスフィールド（`data.pagination`）:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `page` | integer | 現在のページ番号 |
| `limit` | integer | 1ページあたりの件数 |
| `total` | integer | 総件数 |
| `total_pages` | integer | 総ページ数 |

### エラーレスポンス

**401 - 未認証:**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です。"
  }
}
```

**500 - サーバーエラー:**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "レシート一覧の取得に失敗しました。"
  }
}
```

---

## 5. POST /api/receipts

新しいレシートを保存します。`receipts` テーブルへのINSERTと、明細がある場合は `receipt_items` テーブルへのINSERTを行います。

### リクエスト

```
POST /api/receipts
Content-Type: application/json
```

**リクエストボディ:**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `store_name` | string | No | 店名 |
| `date` | string | No | 購入日（YYYY-MM-DD） |
| `items` | array | No | 明細行の配列 |
| `items[].name` | string | Yes* | 商品名 |
| `items[].quantity` | integer | Yes* | 数量 |
| `items[].unit_price` | integer | Yes* | 単価（円単位） |
| `items[].subtotal` | integer | Yes* | 小計（円単位） |
| `subtotal` | integer | No | 税抜合計（円単位） |
| `tax` | integer | No | 税額（円単位） |
| `total` | integer | No | 税込合計（円単位） |
| `payment_method` | string | No | 支払方法 |
| `image_url` | string | No | Supabase Storage上の画像URL |
| `ocr_confidence` | number | No | OCR信頼度スコア |
| `ocr_raw_response` | object | No | OCR生レスポンス（デバッグ用） |

\* `items` 配列が存在する場合に必須

### リクエスト例

```json
{
  "store_name": "コンビニエンスストアA",
  "date": "2026-02-05",
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
  "image_url": "https://xxx.supabase.co/storage/v1/object/public/receipts/user-id/receipt-id.jpg",
  "ocr_confidence": 0.92
}
```

### レスポンス（成功: 201）

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-02-05T10:30:00Z"
  }
}
```

### エラーレスポンス

**401 - 未認証:**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です。"
  }
}
```

**500 - 保存失敗:**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "レシートの保存に失敗しました。"
  }
}
```

### 処理フロー

1. 認証チェック
2. `receipts` テーブルにレシートデータをINSERT（`user_id` は認証ユーザーのIDを自動設定）
3. `items` が存在し要素がある場合、`receipt_items` テーブルに明細行を一括INSERT（`sort_order` は配列のインデックス順）
4. 作成されたレシートのIDと作成日時を返却

---

## 6. GET /api/receipts/[id]

指定IDのレシート詳細を取得します。明細行（`receipt_items`）も含めて返却します。

### リクエスト

```
GET /api/receipts/{id}
```

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|----------|-----|------|
| `id` | uuid | レシートID |

### レスポンス（成功: 200）

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "store_name": "コンビニエンスストアA",
    "date": "2026-02-05",
    "subtotal": 410,
    "tax": 32,
    "total": 442,
    "payment_method": "現金",
    "image_url": "https://xxx.supabase.co/storage/v1/object/public/receipts/user-id/receipt-id.jpg",
    "ocr_confidence": 0.92,
    "ocr_raw_response": { ... },
    "created_at": "2026-02-05T10:30:00Z",
    "updated_at": "2026-02-05T10:30:00Z",
    "deleted_at": null,
    "items": [
      {
        "id": "item-uuid-1",
        "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "おにぎり 鮭",
        "quantity": 1,
        "unit_price": 150,
        "subtotal": 150,
        "sort_order": 0,
        "created_at": "2026-02-05T10:30:00Z"
      },
      {
        "id": "item-uuid-2",
        "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "お茶 500ml",
        "quantity": 2,
        "unit_price": 130,
        "subtotal": 260,
        "sort_order": 1,
        "created_at": "2026-02-05T10:30:00Z"
      }
    ]
  }
}
```

明細行（`items`）は `sort_order` の昇順でソートされて返却されます。

### エラーレスポンス

**404 - レシートが見つからない:**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "レシートが見つかりません。"
  }
}
```

### 備考

- 論理削除されたレシート（`deleted_at` が非NULL）は取得できません
- 他ユーザーのレシートは取得できません（`user_id` による制限）

---

## 7. PUT /api/receipts/[id]

指定IDのレシートを更新します。明細行が指定された場合、既存の明細行を全削除してから新しい明細行をINSERTします（洗い替え方式）。

### リクエスト

```
PUT /api/receipts/{id}
Content-Type: application/json
```

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|----------|-----|------|
| `id` | uuid | レシートID |

**リクエストボディ:**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `store_name` | string | No | 店名 |
| `date` | string | No | 購入日（YYYY-MM-DD） |
| `items` | array | No | 明細行の配列（指定した場合は洗い替え） |
| `items[].name` | string | Yes* | 商品名 |
| `items[].quantity` | integer | Yes* | 数量 |
| `items[].unit_price` | integer | Yes* | 単価（円単位） |
| `items[].subtotal` | integer | Yes* | 小計（円単位） |
| `subtotal` | integer | No | 税抜合計（円単位） |
| `tax` | integer | No | 税額（円単位） |
| `total` | integer | No | 税込合計（円単位） |
| `payment_method` | string | No | 支払方法 |

\* `items` 配列が存在する場合に必須

### リクエスト例

```json
{
  "store_name": "コンビニエンスストアA 東京駅店",
  "date": "2026-02-05",
  "items": [
    {
      "name": "おにぎり 鮭",
      "quantity": 1,
      "unit_price": 150,
      "subtotal": 150
    },
    {
      "name": "お茶 500ml",
      "quantity": 1,
      "unit_price": 130,
      "subtotal": 130
    }
  ],
  "subtotal": 280,
  "tax": 22,
  "total": 302,
  "payment_method": "クレジットカード"
}
```

### レスポンス（成功: 200）

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "updated_at": "2026-02-05T12:00:00Z"
  }
}
```

### エラーレスポンス

**500 - 更新失敗:**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "レシートの更新に失敗しました。"
  }
}
```

### 処理フロー

1. 認証チェック
2. `receipts` テーブルのレシートデータを更新（`user_id` 一致 かつ `deleted_at` がNULLのもののみ）
3. `items` が指定された場合:
   - 既存の `receipt_items` を全削除
   - 新しい明細行を一括INSERT（`sort_order` は配列のインデックス順）
4. `updated_at` はDBトリガーにより自動更新

### 備考

- 論理削除されたレシートは更新できません
- `updated_at` は `receipts` テーブルの `trigger_receipts_updated_at` トリガーにより自動で更新されます
- レスポンスの `updated_at` はアプリケーション側で生成した値です（トリガーで設定される値とわずかに差異がある場合があります）

---

## 8. DELETE /api/receipts/[id]

指定IDのレシートを論理削除します。`deleted_at` カラムに現在日時を設定します。

### リクエスト

```
DELETE /api/receipts/{id}
```

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|----------|-----|------|
| `id` | uuid | レシートID |

### レスポンス（成功: 200）

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deleted_at": "2026-02-06T09:00:00Z"
  }
}
```

### エラーレスポンス

**500 - 削除失敗:**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "レシートの削除に失敗しました。"
  }
}
```

### 備考

- 物理削除ではなく論理削除（`deleted_at` への値設定）を行います
- 既に論理削除されたレシート（`deleted_at` が非NULL）に対しては操作されません
- 明細行（`receipt_items`）は削除されませんが、レシートが論理削除状態になるとRLSポリシーにより参照不可になります
