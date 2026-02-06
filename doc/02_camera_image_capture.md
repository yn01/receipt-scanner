# カメラ・画像キャプチャ実装調査

## 1. カメラキャプチャ方式の比較

### 1.1 HTML5 `<input type="file" capture>`（最シンプル）

```html
<input type="file" accept="image/*" capture="environment" />
```

| 項目 | 内容 |
|------|------|
| 実装量 | 最小（数行） |
| UI制御 | ❌ OS標準カメラUI |
| ガイド表示 | ❌ 不可 |
| ブラウザ対応 | ✅ 全モバイルブラウザ |
| デスクトップ | ファイルピッカーにフォールバック |

**最適**: MVP、プロトタイプ、最大限の互換性が必要な場合

### 1.2 MediaDevices API (getUserMedia)（カスタムUI）

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment', width: { ideal: 1920 } }
});
```

| 項目 | 内容 |
|------|------|
| 実装量 | 中〜多 |
| UI制御 | ✅ 完全カスタム（オーバーレイ、ガイド等） |
| リアルタイムプレビュー | ✅ |
| カメラ切替 | ✅ 前面/背面 |
| HTTPS | 必須 |

**最適**: ドキュメントスキャン風UI、ガイド表示が必要な場合

### 1.3 react-webcam（Reactラッパー）

```jsx
<Webcam ref={webcamRef} screenshotFormat="image/jpeg"
  videoConstraints={{ facingMode: 'environment' }} />
```

- getUserMediaのReactラッパー
- スクリーンショット機能内蔵
- ストリームのライフサイクル自動管理
- 追加依存: ~50KB

### 1.4 PWA カメラアクセス

- ホーム画面追加でアプリライクな体験
- Service Workerでオフライン対応
- Background Syncで失敗アップロードの再試行
- IndexedDBでオフライン画像保存

---

## 2. 画像前処理（OCR精度向上）

### 2.1 クライアントサイド画像最適化

**browser-image-compression**:
```javascript
import imageCompression from 'browser-image-compression';
const compressed = await imageCompression(file, {
  maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true
});
```

**Canvas APIによる手動最適化**:
- リサイズ（最大1920px）
- JPEG品質調整（0.85-0.92）
- グレースケール変換
- コントラスト強調

### 2.2 エッジ検出・台形補正

**OpenCV.js** (8MB、遅延読み込み推奨):
- Cannyエッジ検出 → 輪郭検出 → 四角形抽出
- 透視変換（台形補正）で正面からの画像に変換
- ブラウザ内で完結

**軽量代替**: Canvas APIによるバイリニア補間

### 2.3 OCR向け画像強調

処理パイプライン:
1. グレースケール変換
2. コントラスト調整（1.3倍）
3. 明度調整
4. シャープニング（ラプラシアンフィルタ）
5. ノイズ除去（ガウシアンブラー）
6. 適応的二値化（オプション）

---

## 3. フロントエンドフレームワーク

### 3.1 Next.js（App Router）

| 項目 | 評価 |
|------|------|
| SSR/SEO | ✅ |
| API Routes | ✅ 内蔵（バックエンド不要） |
| デプロイ | Vercelでゼロ設定 |
| バンドルサイズ | やや大きい |
| 適合度 | フルスタックアプリに最適 |

### 3.2 React + Vite（SPA）

| 項目 | 評価 |
|------|------|
| 開発サーバー速度 | ✅ 非常に高速 |
| バンドルサイズ | ✅ 小さい |
| API Routes | ❌ 別バックエンド必要 |
| 柔軟性 | ✅ 高い |
| 適合度 | クライアント重視アプリに最適 |

### 推奨: Next.js

API Routesでバックエンド処理（OCR API呼び出し）も一体化でき、開発効率が高い。

---

## 4. モバイルUXベストプラクティス

### 4.1 カメラガイドオーバーレイ
- 領収書の枠を示すガイドライン
- コーナーマーカー表示
- 「枠内にレシートを合わせてください」テキスト

### 4.2 画像品質バリデーション（アップロード前）
- ファイルサイズチェック（50KB〜10MB）
- 解像度チェック（最低800x600）
- 明度チェック（暗すぎ/明るすぎ検出）
- ブレ検出（ラプラシアン分散）

### 4.3 プログレッシブエンハンスメント
```
カメラ対応チェック
├── getUserMedia対応 → カスタムカメラUI
└── 非対応 → <input type="file" capture> にフォールバック
```

### 4.4 フィードバック
- 触覚フィードバック（navigator.vibrate）
- 撮影時のフラッシュエフェクト
- 処理中のローディング表示
