# 買い物リストアプリ - フロントエンド

家族で共有できるリアルタイム同期機能付きの買い物リストアプリケーションのフロントエンドです。
React、Vite、Tailwind CSS v4を使用したモダンなシングルページアプリケーション (SPA) として実装されています。

## 技術スタック

- **フレームワーク**: React 19.2.0
- **ビルドツール**: Vite 7.2.2
- **スタイリング**: Tailwind CSS 4.1.17
- **言語**: TypeScript 5.6.3
- **LINE連携**: @line/liff 2.27.3

## 前提条件

- Node.js v18以上 (推奨: v20以上)
- npm 10以上

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、必要な環境変数を設定します。

```bash
cp .env.example .env
```

`.env` ファイルを編集して、実際のLIFF IDを設定してください:

```
VITE_LIFF_ID=YOUR_LIFF_ID_HERE
```

| 環境変数 | 説明 | 必須 |
| :--- | :--- | :---: |
| `VITE_LIFF_ID` | LINE Front-end Framework (LIFF) アプリケーションID | ✓ |

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

開発サーバーが起動し、通常 `http://localhost:5173` でアクセス可能になります。
ファイルを編集すると、自動的にホットリロードされます。

### リント

```bash
npm run lint
```

ESLintを使用してコードの静的解析を実行します。

## ビルド

### プロダクションビルド

```bash
npm run build
```

このコマンドは以下の処理を実行します:
1. TypeScriptのコンパイル (`tsc`)
2. Viteによる最適化されたプロダクションビルド

ビルド成果物は `dist/` ディレクトリに出力されます。

### ビルドのプレビュー

```bash
npm run preview
```

プロダクションビルドをローカルで確認できます。

## アーキテクチャ

### ディレクトリ構成

```
frontend/
├── src/
│   ├── App.tsx              # メインアプリケーションコンポーネント
│   ├── AddItemForm.tsx      # アイテム追加フォームコンポーネント
│   ├── ShoppingList.tsx     # 買い物リストコンポーネント
│   ├── ShoppingListItem.tsx # リストアイテムコンポーネント
│   ├── types.ts             # TypeScript型定義
│   ├── main.tsx             # アプリケーションエントリーポイント
│   └── index.css            # グローバルスタイル
├── index.html               # HTMLテンプレート
├── vite.config.ts           # Vite設定ファイル
├── package.json             # 依存関係とスクリプト定義
└── .env.example             # 環境変数テンプレート
```

### コンポーネント構成

```
App
├── AddItemForm
└── ShoppingList
    └── ShoppingListItem (複数)
```

## コンポーネントドキュメント

### App.tsx

メインアプリケーションコンポーネント。LIFF初期化、API通信、状態管理を担当します。

**主要機能:**
- LIFF SDK初期化とLINEユーザー認証
- 買い物リストの読み込み (5秒ごとの自動更新)
- アイテムの追加、削除、完了状態の切り替え
- エラーハンドリング

**状態管理:**
- `items: Item[]` - 買い物リストのアイテム配列
- `lineUserId: string` - LINEユーザーID (ログイン時のみ)
- `liffError: string` - LIFF初期化エラーメッセージ

**API接続:**
- ベースURL: `https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod`
- リストID: `myFamilyList` (固定)

### AddItemForm.tsx

新しいアイテムを追加するフォームコンポーネント。

**Props:**
```typescript
interface AddItemFormProps {
  onAddItem: (text: string) => void;
}
```

**主要機能:**
- テキスト入力フィールド
- 入力値が空の場合、追加ボタンを無効化
- フォーム送信時にアイテムを追加し、入力欄をクリア

**使用例:**
```tsx
<AddItemForm onAddItem={addItem} />
```

### ShoppingList.tsx

買い物リストのアイテム一覧を表示するコンポーネント。

**Props:**
```typescript
interface ShoppingListProps {
  items: Item[];
  onToggleDone: (itemId: string, done: boolean) => void;
  onDeleteItem: (itemId: string) => void;
}
```

**主要機能:**
- アイテムの一覧表示
- 各アイテムを `ShoppingListItem` コンポーネントとして描画

**使用例:**
```tsx
<ShoppingList 
  items={items} 
  onToggleDone={toggleDone} 
  onDeleteItem={deleteItem} 
/>
```

### ShoppingListItem.tsx

個別の買い物リストアイテムを表示するコンポーネント。

**Props:**
```typescript
interface ShoppingListItemProps {
  item: Item;
  onToggleDone: (itemId: string, done: boolean) => void;
  onDeleteItem: (itemId: string) => void;
}
```

**主要機能:**
- カスタムチェックボックス (完了/未完了の切り替え)
- アイテムテキストの表示 (完了時は取り消し線とグレーアウト)
- 削除ボタン (完了済みアイテムのみ表示)

**使用例:**
```tsx
<ShoppingListItem
  item={item}
  onToggleDone={onToggleDone}
  onDeleteItem={onDeleteItem}
/>
```

### types.ts

アプリケーション全体で使用する型定義。

**Item型:**
```typescript
export interface Item {
  itemId: string;  // 一意のアイテムID
  text: string;    // アイテムのテキスト
  done: boolean;   // 完了状態
}
```

## LINE連携 (LIFF)

このアプリケーションは、LINE Front-end Framework (LIFF) を使用してLINEユーザー認証を実装しています。

### 初期化フロー

1. アプリケーション起動時に `liff.init()` を呼び出し
2. `liff.isLoggedIn()` でログイン状態を確認
3. ログイン済みの場合、`liff.getProfile()` でユーザープロフィールを取得
4. 取得したLINE User IDをAPIリクエストヘッダーに付与

### APIリクエストヘッダー

LINEにログイン済みの場合、以下のカスタムヘッダーが自動的に付与されます:

```
X-Line-User-Id: <LINE User ID>
```

### エラーハンドリング

LIFF初期化に失敗した場合、画面中央にエラーメッセージが赤字で表示されます。

**想定されるエラー:**
- ネットワークエラー (LIFF SDKの読み込み失敗)
- 無効なLIFF ID (環境変数の設定ミス)
- LINEアプリ外での実行 (一部機能が制限される場合があります)

## APIエンドポイント

詳細なAPI仕様については、[API仕様書](../docs/api/api-spec.md) を参照してください。

### 主要エンドポイント

- `GET /lists/{listId}` - リストの取得
- `POST /lists/{listId}/items` - アイテムの追加
- `PUT /lists/{listId}/items/{itemId}` - アイテムの更新
- `DELETE /lists/{listId}/items/{itemId}` - アイテムの削除

## 設計ドキュメント

詳細な設計情報については、以下のドキュメントを参照してください:

- **[画面設計書](../docs/design/screen-design.md)** - UIコンポーネントと仕様の詳細
- **[画面遷移図](../docs/design/screen-transition.md)** - アプリケーションの状態遷移

## スタイリング

### Tailwind CSS v4

このプロジェクトはTailwind CSS v4を使用しています。Viteプラグインを介して統合されており、追加の設定ファイルは不要です。

**特徴:**
- ユーティリティファーストのCSSフレームワーク
- レスポンシブデザイン対応
- カスタムカラーパレット (インディゴをプライマリカラーとして使用)
- ホバーエフェクトとトランジション

### デザインシステム

**カラーパレット:**
- プライマリ: インディゴ (Indigo)
- 背景: グラデーション (ブルー → インディゴ)
- テキスト: スレート (Slate)

**コンポーネントスタイル:**
- 角丸: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- 影: `shadow-sm`, `shadow-md`, `shadow-xl`
- トランジション: 200ms duration

## トラブルシューティング

### ビルドエラー

**問題:** TypeScriptコンパイルエラー

**解決策:** 
```bash
npm install
npm run build
```

### LIFF初期化エラー

**問題:** "LIFF Init Failed" エラーが表示される

**解決策:**
1. `.env` ファイルに正しいLIFF IDが設定されているか確認
2. ネットワーク接続を確認
3. LINEアプリ内で開いているか確認

### 開発サーバーが起動しない

**問題:** ポート番号の競合

**解決策:**
```bash
# 既存のプロセスを終了するか、別のポートを指定
npm run dev -- --port 3000
```

## ライセンス

MIT
