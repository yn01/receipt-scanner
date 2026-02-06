# 領収書スキャンWebアプリ — 調査サマリー

## 調査概要

領収書をカメラ撮影/写真読み込みし、AIでテキスト化するWebアプリの実装方法を調査。

### 詳細レポート
- [01_ocr_ai_api_comparison.md](./01_ocr_ai_api_comparison.md) — OCR/AI API比較
- [02_camera_image_capture.md](./02_camera_image_capture.md) — カメラ・画像取り込み
- [03_architecture_tech_stack.md](./03_architecture_tech_stack.md) — アーキテクチャ・技術スタック

---

## 推奨構成（MVP）

```
┌─────────────────────────────────────────┐
│  ブラウザ (Next.js)                       │
│  ┌─────────┐  ┌──────────┐              │
│  │ カメラ    │  │ 画像前処理 │              │
│  │ <input>  │→│ 圧縮/リサイズ│              │
│  └─────────┘  └──────────┘              │
│       ↓                                  │
│  API Route (Next.js)                     │
│       ↓                                  │
│  Claude Haiku Vision API                 │
│  → 構造化JSON抽出                         │
│       ↓                                  │
│  Supabase (DB + Storage)                 │
└─────────────────────────────────────────┘
```

## 主要な技術選定

| 要素 | 推奨 | 理由 |
|------|------|------|
| **OCR/AI** | Claude Haiku | 最安($0.0005/枚)、日本語優秀、JSON直接抽出 |
| **カメラ** | `<input capture>` → getUserMedia | シンプルから始めて段階的に高度化 |
| **フレームワーク** | Next.js (App Router) | API Routes内蔵、Vercelで簡単デプロイ |
| **DB/Storage** | Supabase | 無料枠で十分、Auth含む |
| **画像前処理** | browser-image-compression | 転送量・API コスト削減 |

## コスト見込み

- **MVP（月1,000枚）**: $1-5/月
- **成長期（月10,000枚）**: $50-100/月

## 開発期間目安

- **Phase 1 (MVP)**: 1-2週間
- **Phase 2 (機能強化)**: 3-4週間
- **Phase 3 (本番化)**: 2ヶ月目
