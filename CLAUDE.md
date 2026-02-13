# Receipt Scanner - プロジェクト概要

## プロジェクト概要

領収書をスマートフォンのカメラで撮影または画像ファイルから読み込み、AIによるOCRで構造化データを抽出・管理するWebアプリケーション。
個人事業主、フリーランス、経費管理を行う個人を対象としたMVP版。

## エージェント構成

### 主エージェント：Claude Code（オーケストレーター）
- プロジェクト全体の管理と調整
- 各チーム・外部エージェントへのタスク割り当て
- 進捗管理とフェーズ間の調整
- Agent Teams の構成・起動・監督

### 外部エージェント（Skills経由）

#### Codex: 各フェーズのレビュー担当
- 要件定義レビュー
- 設計レビュー
- 実装レビュー
- テストレビュー
- ドキュメントレビュー

#### Gemini: ドキュメント生成担当
- 要件定義書（REQUIREMENTS.md）
- 設計書（DESIGN.md）
- README（README.md）
- API仕様書（API.md）
- ユーザーマニュアル（USER_MANUAL.md）
- 開発者ドキュメント（DEVELOPMENT.md）

### Agent Teams（Claude Code内蔵サブエージェント）

#### Team: Planning
| エージェント | 役割 |
|-------------|------|
| Plan | 実装計画立案、アーキテクチャ設計、タスク分解 |
| Explore | コードベース探索、ファイル・パターン検索、影響範囲分析 |

#### Team: Backend
| エージェント | 役割 |
|-------------|------|
| general-purpose | API実装、サーバーサイドロジック、Supabase連携 |
| Database Reviewer | スキーマ設計、クエリ最適化、RLSポリシー、Supabaseベストプラクティス |
| Security Reviewer | 認証・認可、OWASP Top 10チェック、APIセキュリティ |

#### Team: Frontend
| エージェント | 役割 |
|-------------|------|
| general-purpose | UIコンポーネント実装、ページ実装、状態管理 |
| Build Error Resolver | ビルドエラー解決、TypeScriptエラー修正、依存関係修正 |

#### Team: Quality
| エージェント | 役割 |
|-------------|------|
| TDD Guide | テスト駆動開発、ユニットテスト、カバレッジ確保（80%+） |
| E2E Runner | E2Eテスト生成・実行、Playwright使用 |
| Code Reviewer | コード品質レビュー、ベストプラクティス確認、保守性評価 |

#### Team: Maintenance
| エージェント | 役割 |
|-------------|------|
| Refactor Cleaner | デッドコード削除、重複コード整理、リファクタリング |
| Doc Updater | コードマップ更新（※正式ドキュメントはGemini担当） |

### チーム起動タイミング

| チーム | 起動タイミング | 備考 |
|--------|---------------|------|
| Planning | 新機能・大きな変更の前 | 要件調査、計画立案、影響範囲分析 |
| Backend | API・DB・サーバー関連の実装時 | 並列でAPI実装 + DBレビュー + セキュリティレビュー |
| Frontend | UI・ページ関連の実装時 | コンポーネント実装 + ビルドエラー即時修正 |
| Quality | 実装完了後 | TDDテスト作成 + E2Eテスト + コード品質確認 |
| Maintenance | フェーズ完了後・定期的 | リファクタリング、不要コード削除、コードマップ更新 |

---

## 開発原則・ガイドライン

### 要件ヒアリングの原則
- **AskUserQuestion Toolの積極的な使用**
  - 要件や仕様が曖昧な場合は、推測せずに必ずユーザーに確認する
  - 質問は細分化し、具体的で答えやすい形式にする
  - 複数の選択肢を提示し、ユーザーが選択しやすくする
  - 1回のヒアリングで1-4問の質問に絞り、段階的に要件を明確化する

### ヒアリング対象の例
- 技術スタックの選択（フレームワーク、データベース、ホスティングなど）
- 機能の優先順位
- UI/UXの方向性
- 非機能要件（性能、セキュリティ、スケーラビリティ）
- データモデルの詳細
- APIの設計方針

### ヒアリングのタイミング
1. **要件定義フェーズ**: 機能要件、非機能要件の詳細確認
2. **設計フェーズ**: 技術選定、アーキテクチャ方針の確認
3. **実装フェーズ**: 実装の詳細や代替案の選択
4. **テストフェーズ**: テスト方針、カバレッジ目標の確認
5. **デプロイフェーズ**: デプロイ先、環境設定の確認

### ドキュメント作成の原則
- **Claude Codeの役割**: 情報収集、要件整理、ドキュメント構成の決定
- **Geminiの役割**: 整理された情報をもとに、正式なドキュメントを生成
- **作成フロー**:
  1. Claude Codeが要件ヒアリング・情報整理
  2. Geminiがドキュメント生成（/gemini-docs）
  3. Codexがドキュメントレビュー（/codex-review）
  4. フィードバック反映後、確定

### ドキュメント種別と担当

| ドキュメント | 担当 | タイミング |
|-------------|------|-----------|
| 要件定義書（REQUIREMENTS.md） | Gemini | Phase 1完了時 |
| 設計書（DESIGN.md） | Gemini | Phase 2完了時 |
| README（README.md） | Gemini | Phase 5 |
| API仕様書（API.md） | Gemini | Phase 5 |
| ユーザーマニュアル（USER_MANUAL.md） | Gemini | Phase 5 |
| 開発者ドキュメント（DEVELOPMENT.md） | Gemini | Phase 5 |

### ワークフロー（フェーズごと）

```
Phase N: 機能実装の流れ

1. Planning Team → 計画立案・タスク分解
2. Gemini → 設計ドキュメント生成
3. Codex → 設計レビュー
4. Backend/Frontend Team → 実装（並列作業可能）
5. Quality Team → テスト作成・実行
6. Codex → 実装レビュー
7. Maintenance Team → リファクタリング・整理
8. Gemini → ドキュメント更新
9. Codex → 最終レビュー
```

---

## 開発フェーズとアジェンダ

### Phase 1: 要件定義（MVP実装済み）
- [x] 機能要件の整理（doc/04_requirements.md）
- [x] 非機能要件の定義
- [x] ユーザーストーリーの作成
- [ ] 要件定義書作成（doc/REQUIREMENTS.md）← Gemini担当
- [ ] **Codexレビュー**: 要件定義の妥当性確認

### Phase 2: 設計（MVP実装済み）
- [x] システムアーキテクチャ設計（doc/03_architecture_tech_stack.md）
- [x] データモデル設計
- [x] UI/UX設計（doc/06_ui_design.md）
- [x] API設計（doc/07_api_spec.md）
- [ ] 設計書作成（doc/DESIGN.md）← Gemini担当
- [ ] **Codexレビュー**: 設計の妥当性確認

### Phase 3: 実装（MVP実装済み）
- [x] 開発環境セットアップ
- [x] バックエンド実装
  - [x] Supabase連携（認証、DB、Storage）
  - [x] API Routes（OCR、レシートCRUD）
  - [x] Claude Haiku Vision API連携
- [x] フロントエンド実装
  - [x] 認証画面（ログイン・サインアップ）
  - [x] レシートスキャン（カメラ撮影・画像読込・OCR結果確認）
  - [x] レシート一覧・検索・フィルタ
  - [x] レシート詳細・編集・削除
  - [x] 共通コンポーネント（Header、BottomNav、Button、Input、Card、Loading）
- [ ] **Codexレビュー**: 実装品質確認

### Phase 4: テスト
- [x] ユニットテスト作成（一部実装済み）
  - [x] lib/image/compress.test.ts
  - [x] types/receipt.test.ts
  - [x] lib/claude/ocr.test.ts
  - [x] components/scan/CameraCapture.test.tsx
  - [x] components/receipt/ReceiptCard.test.tsx
  - [x] components/receipt/ReceiptList.test.tsx
  - [x] components/auth/LoginForm.test.tsx
  - [x] components/auth/SignupForm.test.tsx
  - [x] components/scan/OcrResultForm.test.tsx
  - [x] api/ocr/route.test.ts
  - [x] api/receipts/route.test.ts
  - [x] api/receipts/[id]/route.test.ts
- [ ] テストカバレッジ確認・拡充（目標80%+）
- [ ] E2Eテスト作成・実行
- [ ] **Codexレビュー**: テストカバレッジ・品質確認

### Phase 5: ドキュメント作成
- [ ] README更新（Gemini担当）
- [ ] API仕様書作成（doc/API.md）（Gemini担当）
- [ ] ユーザーマニュアル作成（doc/USER_MANUAL.md）（Gemini担当）
- [ ] 開発者ドキュメント作成（doc/DEVELOPMENT.md）（Gemini担当）
- [ ] **Codexレビュー**: ドキュメント品質確認

### Phase 6: デプロイ・リリース
- [ ] CI/CD設定（GitHub Actions）
- [ ] デプロイ準備
- [ ] 本番デプロイ実行
- [ ] **Codexレビュー**: デプロイ構成確認

---

## 技術スタック

### フロントエンド
- Framework: Next.js (App Router) + React 19
- Language: TypeScript
- Styling: TailwindCSS 4

### バックエンド
- Framework: Next.js API Routes
- Language: TypeScript
- OCR/AI: Claude Haiku Vision API (`claude-haiku-4-5-20251001`)

### データベース・インフラ
- Database: Supabase (PostgreSQL)
- Storage: Supabase Storage
- Auth: Supabase Auth (JWT + RLS)

### その他
- Image Compression: browser-image-compression
- Hosting: Vercel（推奨）

---

## 機能要件

### 基本機能（MVP実装済み）
- [x] カメラ撮影 / 画像読み込み
- [x] AI OCR（Claude Haiku Vision API）
- [x] OCR結果の確認・編集
- [x] レシート一覧・検索
- [x] レシート詳細・編集・削除
- [x] ユーザー認証（Supabase Auth）
- [x] 画像圧縮（クライアント側）

### 将来の拡張機能（バックログ）
- [ ] カテゴリ別集計・グラフ
- [ ] CSV/PDFエクスポート
- [ ] 複数通貨対応
- [ ] バッチスキャン（複数枚一括処理）
- [ ] ダークモード
- [ ] PWA対応（オフライン閲覧）

---

## プロジェクト管理

### 現在のステータス

**MVP実装済み** - Phase 3完了、Phase 4以降は未着手

### ディレクトリ構成

```
receipt-scanner/
├── doc/                          # ドキュメント
│   ├── 00_summary.md
│   ├── 01_ocr_ai_api_comparison.md
│   ├── 02_camera_image_capture.md
│   ├── 03_architecture_tech_stack.md
│   ├── 04_requirements.md
│   ├── 05_system_design.md
│   ├── 06_ui_design.md
│   └── 07_api_spec.md
├── public/                       # 静的ファイル
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # ホーム（レシート一覧）
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── scan/
│   │   │   ├── page.tsx          # レシート撮影・読込
│   │   │   └── confirm/page.tsx  # OCR結果確認・編集
│   │   ├── receipts/[id]/
│   │   │   ├── page.tsx          # レシート詳細
│   │   │   └── edit/page.tsx     # レシート編集
│   │   └── api/
│   │       ├── ocr/route.ts      # POST /api/ocr
│   │       └── receipts/
│   │           ├── route.ts      # GET/POST /api/receipts
│   │           └── [id]/route.ts # GET/PUT/DELETE /api/receipts/[id]
│   ├── components/
│   │   ├── ui/                   # 汎用UI（Button, Input, Card, Loading）
│   │   ├── layout/               # レイアウト（Header, BottomNav）
│   │   ├── receipt/              # レシート関連
│   │   ├── scan/                 # スキャン関連
│   │   └── auth/                 # 認証関連
│   ├── lib/
│   │   ├── supabase/             # Supabaseクライアント
│   │   ├── claude/ocr.ts         # Claude Haiku Vision API
│   │   └── image/compress.ts     # 画像圧縮
│   ├── types/receipt.ts          # 型定義
│   ├── middleware.ts             # 認証ミドルウェア
│   └── __tests__/               # テスト
├── supabase/
│   └── migrations/               # DBマイグレーション
├── CLAUDE.md                     # このファイル
├── package.json
├── tsconfig.json
└── .env.local.example
```

---

## Skills使用ガイド

### Codexレビューの実行
```bash
/codex-review
```
各フェーズ完了時にCodexによるレビューを実行

### Geminiドキュメント生成の実行
```bash
/gemini-docs
```
ドキュメント作成が必要な時にGeminiによるドキュメント生成を実行

---

## 更新履歴

- 2026-02-13: CLAUDE.md作成、Agent Teams構成定義、プロジェクト管理体制確立
