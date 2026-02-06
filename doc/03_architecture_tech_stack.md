# アーキテクチャ・技術スタック調査

## 1. アーキテクチャパターン

| パターン | 特徴 | コスト | 最適ケース |
|---------|------|--------|-----------|
| **Serverless (Vercel/Netlify)** | 自動スケール、インフラ管理不要 | $0-20/月 | MVP、変動トラフィック |
| **Traditional (Express/Fastify)** | フル制御、コールドスタートなし | $10-50/月 | 複雑な処理、安定トラフィック |
| **Edge-first (Cloudflare Workers)** | 超低レイテンシ、エグレス無料 | 100k req/日まで無料 | グローバル展開 |
| **Full Client-side** | 完全プライバシー、ホスティング無料 | $0 | プライバシー重視 |

---

## 2. データストレージ

| サービス | 無料枠 | 有料プラン | 特徴 |
|---------|--------|-----------|------|
| **Supabase** | DB 500MB + Storage 1GB | $25/月 | PostgreSQL + RLS + Auth一体 |
| **Firebase** | Storage 1GB + 10GB/月帯域 | 従量課金 | リアルタイム同期、モバイルSDK |
| **Neon** | 0.5GB | $19/月 | サーバーレスPostgres、ゼロスケール |
| **IndexedDB** | ∞（ローカル） | $0 | 完全オフライン、プライバシー重視 |

---

## 3. 画像ストレージ

| サービス | ストレージ料金 | エグレス料金 | 特徴 |
|---------|--------------|-------------|------|
| **Cloudflare R2** | $0.015/GB | **$0** | エグレス無料が最大の利点 |
| **AWS S3** | $0.023/GB | $0.09/GB | 業界標準 |
| **Supabase Storage** | プランに含む | プランに含む | 最もシンプル |
| **IndexedDB** | ローカル | なし | プライバシー重視 |

---

## 4. 認証

| サービス | 無料枠 | 有料 | 特徴 |
|---------|--------|------|------|
| **NextAuth.js** | 完全無料(OSS) | - | 柔軟、ベンダーロックインなし |
| **Supabase Auth** | 50k MAU | 含む | JWT + RLS連携 |
| **Clerk** | 10k MAU | $25/月 | 美しいUI、B2B向け機能 |
| **Firebase Auth** | 50k MAU | 従量課金 | Firebaseエコシステム |

---

## 5. 推奨テックスタック

### Stack 1: 低コスト（MVP向け）— 月$1-5

```
Frontend: Next.js 14 + TailwindCSS
Hosting:  Vercel (Free)
DB:       Supabase (Free - 500MB)
Storage:  Supabase Storage (1GB)
Auth:     Supabase Auth
OCR:      Tesseract.js + Claude Haiku API
```

**対象**: MVP、個人プロジェクト、ユーザー1,000人未満

### Stack 2: 本番環境向け — 月$108程度

```
Frontend:   Next.js 14
Hosting:    Vercel Pro ($20)
DB:         Neon Pro ($19)
Storage:    Cloudflare R2 (~$1)
Auth:       Clerk ($25)
OCR:        Google Cloud Vision ($7.50)
Monitoring: Sentry + Vercel Analytics ($26)
```

**対象**: スタートアップ、1k-100kユーザー

### Stack 3: プライバシー重視 — 月$0

```
Frontend: SvelteKit or Next.js + TailwindCSS
Hosting:  Cloudflare Pages (Free)
DB:       IndexedDB (Dexie.js)
Storage:  IndexedDB (ローカルのみ)
Auth:     なし
OCR:      Tesseract.js (ブラウザWASM)
```

**対象**: プライバシー重視、オフラインファースト

---

## 6. コストスケーリング

| 月間レシート数 | Stack 1 | Stack 2 | Stack 3 |
|--------------|---------|---------|---------|
| 1,000枚 | $5-10 | $108 | $0 |
| 10,000枚 | $50-100 | $200-300 | $0 |
| 100,000枚 | - | $800-1,200 | $0 |

---

## 7. 推奨実装フェーズ

### Phase 1: MVP（1-2週間）
- Stack 1でバリデーション
- Next.js + Supabase
- Claude Haiku for OCR
- 基本的なレシート一覧・詳細画面

### Phase 2: 機能強化（3-4週間）
- Claude Sonnetへアップグレード（高精度）
- レシート編集機能
- CSV/PDFエクスポート

### Phase 3: 本番化（2ヶ月目）
- Stack 2へ移行
- Clerk認証追加
- モニタリング導入
- PWA対応
