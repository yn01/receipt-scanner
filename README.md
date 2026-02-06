# Receipt Scanner - 領収書スキャンWebアプリ

領収書をスマートフォンのカメラで撮影または画像ファイルから読み込み、AIによるOCRで構造化データを抽出・管理するWebアプリケーションです。

個人事業主、フリーランス、経費管理を行う個人を対象としたMVP版です。

## 主な機能

- **カメラ撮影 / 画像読み込み**: スマートフォンのカメラで撮影、またはギャラリーから画像を選択
- **AI OCR**: Claude Haiku Vision APIによるレシート情報の自動抽出（店名、日付、明細、合計金額等）
- **OCR結果の確認・編集**: 抽出結果をフォームで確認・修正してから保存
- **レシート一覧・検索**: 保存済みレシートの一覧表示、キーワード検索、日付・金額フィルタ
- **レシート詳細・編集・削除**: 個別レシートの詳細表示、編集、論理削除
- **ユーザー認証**: メール・パスワードによるサインアップ・ログイン（Supabase Auth）
- **画像圧縮**: クライアント側での画像自動圧縮（最大1MB / 1920px）

## 技術スタック

| 要素 | 技術 |
|------|------|
| フレームワーク | Next.js (App Router) + React 19 |
| スタイリング | TailwindCSS 4 |
| データベース | Supabase (PostgreSQL) |
| 画像ストレージ | Supabase Storage |
| 認証 | Supabase Auth (JWT + RLS) |
| OCR / AI | Claude Haiku Vision API (`claude-haiku-4-5-20251001`) |
| 画像圧縮 | browser-image-compression |
| ホスティング | Vercel (推奨) |
| 言語 | TypeScript |

## 前提条件

- **Node.js** 18以上
- **npm** 9以上
- **Supabaseアカウント**: [supabase.com](https://supabase.com) で無料プロジェクトを作成
- **Anthropic APIキー**: [console.anthropic.com](https://console.anthropic.com) で取得

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd receipt-scanner
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、各値を設定します。

```bash
cp .env.local.example .env.local
```

`.env.local` に以下の値を設定してください:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Claude API
CLAUDE_API_KEY=sk-ant-...
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseダッシュボードの Settings > API から取得
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseダッシュボードの Settings > API > service_role key から取得
- `CLAUDE_API_KEY`: Anthropicコンソールから取得

### 4. Supabaseのセットアップ

#### マイグレーションの実行

Supabase CLIを使う場合:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

または、Supabaseダッシュボードの SQL Editor で `supabase/migrations/001_create_tables.sql` の内容を直接実行してください。

#### Storageバケットの作成

Supabaseダッシュボードで以下を実行します:

1. Storage > New bucket で `receipts` バケットを作成
2. バケットのポリシーを設定（ユーザーごとのフォルダアクセス制限）

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## ビルド・デプロイ

### ビルド

```bash
npm run build
```

### 本番サーバー起動

```bash
npm start
```

### Vercelへのデプロイ

Vercelにリポジトリを接続し、以下の環境変数を設定してデプロイします:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLAUDE_API_KEY`

## npm スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm start` | プロダクションサーバー起動 |
| `npm run lint` | ESLintによるコード検査 |

## ディレクトリ構成

```
receipt-scanner/
├── doc/                          # ドキュメント
├── public/                       # 静的ファイル
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── page.tsx              # ホーム（レシート一覧）
│   │   ├── login/page.tsx        # ログイン画面
│   │   ├── signup/page.tsx       # サインアップ画面
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
│   │   ├── ui/                   # 汎用UIコンポーネント（Button, Input, Card, Loading）
│   │   ├── layout/               # レイアウト（Header, BottomNav）
│   │   ├── receipt/              # レシート関連（ReceiptCard, ReceiptList, ReceiptForm, ReceiptDetail）
│   │   ├── scan/                 # スキャン関連（CameraCapture, ImagePreview, OcrResultForm）
│   │   └── auth/                 # 認証関連（LoginForm, SignupForm）
│   ├── lib/
│   │   ├── supabase/             # Supabaseクライアント（client.ts, server.ts）
│   │   ├── claude/ocr.ts         # Claude Haiku Vision API呼び出し
│   │   └── image/compress.ts     # 画像圧縮処理
│   ├── types/receipt.ts          # 型定義
│   └── middleware.ts             # 認証ミドルウェア
├── supabase/
│   └── migrations/               # DBマイグレーション
├── package.json
├── tsconfig.json
└── .env.local.example            # 環境変数テンプレート
```

## ドキュメント一覧

| ファイル | 内容 |
|---------|------|
| [doc/00_summary.md](doc/00_summary.md) | プロジェクト概要サマリー |
| [doc/01_ocr_ai_api_comparison.md](doc/01_ocr_ai_api_comparison.md) | OCR/AI API比較検討 |
| [doc/02_camera_image_capture.md](doc/02_camera_image_capture.md) | カメラ・画像キャプチャ技術調査 |
| [doc/03_architecture_tech_stack.md](doc/03_architecture_tech_stack.md) | アーキテクチャ・技術スタック検討 |
| [doc/04_requirements.md](doc/04_requirements.md) | 要件定義書 |
| [doc/05_system_design.md](doc/05_system_design.md) | システム設計書 |
| [doc/06_ui_design.md](doc/06_ui_design.md) | UI設計書 |
| [doc/07_api_spec.md](doc/07_api_spec.md) | API仕様書 |

## ライセンス

Private
