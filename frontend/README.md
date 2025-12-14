# フロントエンド開発ガイド

買い物リストアプリケーションのフロントエンド開発者向けドキュメントです。

## 📚 目次
- [技術スタック](#技術スタック)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [環境変数の設定](#環境変数の設定)
- [開発サーバーの起動](#開発サーバーの起動)
- [ビルド](#ビルド)
- [プロジェクト構成](#プロジェクト構成)
- [開発ワークフロー](#開発ワークフロー)
- [関連ドキュメント](#関連ドキュメント)

## 技術スタック

### コアライブラリ
- **React** 19.2.0 - UIライブラリ
- **TypeScript** 5.6.3 - 型安全な開発
- **Vite** 7.2.2 - 高速ビルドツール

### スタイリング
- **Tailwind CSS** 4.1.17 - ユーティリティファーストCSSフレームワーク
- **@tailwindcss/vite** - Vite統合プラグイン

### 認証・LINE連携
- **@line/liff** 2.27.3 - LINE Front-end Framework SDK

### 開発ツール
- **ESLint** - コード品質チェック
- **TypeScript ESLint** - TypeScript対応のlintルール

## 開発環境のセットアップ

### 必要な環境
- **Node.js**: v18以上推奨
- **npm**: v9以上推奨

### インストール手順

1. リポジトリのクローン
```bash
git clone <repository-url>
cd shopping_list_app
```

2. フロントエンドディレクトリに移動
```bash
cd frontend
```

3. 依存関係のインストール
```bash
npm install
```

## 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成します。

```bash
cp .env.example .env
```

`.env` ファイルを編集し、必要な環境変数を設定します：

```env
VITE_LIFF_ID=YOUR_LIFF_ID_HERE
```

### 環境変数の説明

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `VITE_LIFF_ID` | LINE Front-end FrameworkのアプリケーションID | はい | - |

#### LIFF IDの取得方法
1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. プロバイダーを選択またはを新規作成
3. LIFFアプリを作成
4. LIFF IDをコピーして `.env` ファイルに設定

## 開発サーバーの起動

開発サーバーを起動すると、ホットリロード機能が有効になります。

```bash
npm run dev
```

開発サーバーはデフォルトで `http://localhost:5173` で起動します。

### LIFFアプリでのテスト
LIFFアプリは通常、LINEアプリ内で動作します。開発時は以下の方法でテストできます：

1. **LIFF Browser** - LINE Developersが提供するブラウザベースのテストツール
2. **LINE公式アカウント** - 実際のLINE環境でテスト
3. **ブラウザ** - 一部の機能は通常のブラウザでも動作（ログイン状態はシミュレート不可）

## ビルド

本番用のビルドを実行します。

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### ビルドプロセス
1. TypeScriptの型チェック (`tsc`)
2. Viteによる最適化ビルド
3. 静的ファイルの生成

### プレビュー
ビルドしたファイルをローカルでプレビューできます：

```bash
npm run preview
```

## Lint

コードの品質チェックを実行します。

```bash
npm run lint
```

## プロジェクト構成

```
frontend/
├── dist/                  # ビルド成果物（自動生成）
├── src/
│   ├── App.tsx            # ルートコンポーネント（状態管理・API連携）
│   ├── main.tsx           # エントリーポイント
│   ├── index.css          # グローバルスタイル（Tailwind CSS import）
│   ├── types.ts           # TypeScript型定義
│   ├── AddItemForm.tsx    # アイテム追加フォームコンポーネント
│   ├── ShoppingList.tsx   # リスト表示コンポーネント
│   ├── ShoppingListItem.tsx # リストアイテムコンポーネント
│   └── vite-env.d.ts      # Vite型定義
├── index.html             # HTMLテンプレート
├── vite.config.ts         # Vite設定
├── package.json           # 依存関係・スクリプト
├── .env.example           # 環境変数テンプレート
└── .env                   # 環境変数（要作成、Git管理対象外）
```

### コンポーネント構成

```
App (ルート)
├── AddItemForm (アイテム追加フォーム)
└── ShoppingList (リスト表示)
    └── ShoppingListItem × N (各アイテム)
```

## 開発ワークフロー

### 1. 新機能の開発
1. フィーチャーブランチを作成
2. コンポーネントまたは機能を実装
3. TypeScript型定義を追加/更新
4. Lintエラーを修正 (`npm run lint`)
5. ビルドが成功することを確認 (`npm run build`)

### 2. コンポーネント開発のベストプラクティス
- **関数コンポーネント**を使用 (`React.FC`)
- **Props**は明示的なインターフェースで型定義
- **状態管理**は必要最小限に（`useState`, `useEffect`）
- **Tailwind CSS**のユーティリティクラスでスタイリング
- **アクセシビリティ**を考慮（`aria-label`など）

### 3. スタイリングのガイドライン
- Tailwind CSSのユーティリティクラスを使用
- カスタムCSSは極力避ける
- レスポンシブデザインは `sm:`, `md:`, `lg:` プレフィックスを活用
- カラーパレット: `indigo` (プライマリ), `slate` (テキスト/背景)

### 4. API連携
APIエンドポイントは `App.tsx` で一元管理されています。

- **Base URL**: `https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod`
- **認証**: `X-Line-User-Id` ヘッダーでLINE User IDを送信

詳細は [APIクライアント実装ガイド](../docs/frontend/api-client.md) を参照してください。

## トラブルシューティング

### LIFF初期化エラー
**症状**: 「LIFF Init Failed」エラーが表示される

**原因と対処法**:
- `.env` ファイルに正しいLIFF IDが設定されているか確認
- LIFF IDがLINE Developers Consoleで有効になっているか確認
- LINEアプリ内またはLIFF Browserで実行しているか確認

### ビルドエラー
**症状**: `npm run build` が失敗する

**対処法**:
1. TypeScriptエラーを確認: `npx tsc --noEmit`
2. 依存関係を再インストール: `rm -rf node_modules && npm install`
3. キャッシュをクリア: `rm -rf dist`

### 開発サーバーが起動しない
**対処法**:
1. ポート5173が使用中でないか確認
2. Node.jsのバージョンを確認 (v18以上)
3. `node_modules` を削除して再インストール

## 関連ドキュメント

- **[画面設計書](../docs/design/screen-design.md)** - UIコンポーネントと仕様
- **[画面遷移図](../docs/design/screen-transition.md)** - アプリケーションの状態遷移
- **[コンポーネント詳細仕様書](../docs/frontend/components.md)** - 各コンポーネントの詳細
- **[フロントエンドアーキテクチャ](../docs/frontend/architecture.md)** - 設計思想と構造
- **[APIクライアント実装ガイド](../docs/frontend/api-client.md)** - API連携の実装詳細
- **[API仕様書](../docs/api/api-spec.md)** - バックエンドAPIの仕様

## サポート

問題や質問がある場合は、リポジトリのIssueで報告してください。
