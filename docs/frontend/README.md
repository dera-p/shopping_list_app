# フロントエンド開発者向けドキュメント

## 目次
1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [開発環境のセットアップ](#3-開発環境のセットアップ)
4. [プロジェクト構成](#4-プロジェクト構成)
5. [コンポーネント構成と役割](#5-コンポーネント構成と役割)
6. [状態管理](#6-状態管理)
7. [スタイリング (Tailwind CSS v4)](#7-スタイリング-tailwind-css-v4)
8. [LIFF連携](#8-liff連携)
9. [API通信](#9-api通信)
10. [環境変数の設定](#10-環境変数の設定)
11. [ビルド・実行・デプロイ](#11-ビルド-実行-デプロイ)
12. [開発時のtips](#12-開発時のtips)

---

## 1. プロジェクト概要

このプロジェクトは、React/Vite/TypeScript/Tailwind CSS v4を使用した**買い物リストアプリケーション**のフロントエンドです。
LINE LIFF (LINE Front-end Framework) を統合し、LINEプラットフォーム上で動作するシングルページアプリケーション (SPA) として実装されています。

### 主な機能
- 買い物リストの閲覧
- アイテムの追加
- アイテムの完了/未完了の切り替え
- 完了済みアイテムの削除
- 5秒間隔での自動リスト更新 (ポーリング)
- LINE LIFF経由でのユーザー認証

---

## 2. 技術スタック

| 技術 | バージョン | 用途 |
| :--- | :--- | :--- |
| **React** | 19.2.0 | UIライブラリ |
| **TypeScript** | 5.6.3 | 型安全な開発言語 |
| **Vite** | 7.2.2 | ビルドツール・開発サーバー |
| **Tailwind CSS** | 4.1.17 | ユーティリティファーストCSSフレームワーク |
| **@tailwindcss/vite** | 4.1.17 | Tailwind CSS v4のViteプラグイン |
| **@tailwindcss/postcss** | 4.1.17 | Tailwind CSS v4のPostCSSプラグイン |
| **LINE LIFF SDK** | 2.27.3 | LINEプラットフォーム連携SDK |
| **ESLint** | 8.56.0 | コードリンター |

### 開発用パッケージ
- `@vitejs/plugin-react`: ReactのViteプラグイン
- `@typescript-eslint/eslint-plugin`: TypeScript用ESLintプラグイン
- `@typescript-eslint/parser`: TypeScript用ESLintパーサー
- `eslint-plugin-react-hooks`: React Hooks用ESLintルール
- `eslint-plugin-react-refresh`: React Fast Refresh用ESLintルール

---

## 3. 開発環境のセットアップ

### 3.1. 前提条件
- **Node.js**: v18以上推奨
- **npm**: v9以上推奨
- **LINE Developers アカウント**: LIFF IDの取得に必要

### 3.2. セットアップ手順

#### ステップ1: 依存関係のインストール
```bash
cd frontend
npm install
```

#### ステップ2: 環境変数の設定
`.env.example`を参考に、`.env`ファイルを作成します。

```bash
cp .env.example .env
```

`.env`ファイルを編集し、LIFF IDを設定してください：
```env
VITE_LIFF_ID=YOUR_LIFF_ID_HERE
```

> **注意**: LIFF IDは [LINE Developers Console](https://developers.line.biz/console/) で取得できます。

#### ステップ3: 開発サーバーの起動
```bash
npm run dev
```

開発サーバーが起動し、ブラウザで `http://localhost:5173` にアクセスできます。

---

## 4. プロジェクト構成

```
frontend/
├── src/                       # ソースコード
│   ├── App.tsx                # メインコンポーネント (LIFF初期化、API通信、状態管理)
│   ├── main.tsx               # エントリーポイント (ReactDOM.createRoot)
│   ├── index.css              # グローバルスタイル (Tailwind CSS v4のインポート)
│   ├── types.ts               # TypeScript型定義 (Item型)
│   ├── ShoppingList.tsx       # リストコンテナコンポーネント
│   ├── ShoppingListItem.tsx   # 個別アイテムコンポーネント
│   ├── AddItemForm.tsx        # アイテム追加フォームコンポーネント
│   └── vite-env.d.ts          # Vite環境変数の型定義
├── dist/                      # ビルド出力ディレクトリ (gitignore済み)
├── index.html                 # HTMLテンプレート
├── package.json               # 依存関係とスクリプト
├── vite.config.ts             # Vite設定ファイル
├── .env.example               # 環境変数のサンプル
└── .env                       # 環境変数 (gitignore済み)
```

---

## 5. コンポーネント構成と役割

### 5.1. `App.tsx` - メインコンポーネント

**役割**: アプリケーション全体の統括。LIFF初期化、API通信、状態管理を担当。

#### 主要な状態
```typescript
const [items, setItems] = useState<Item[]>([]);        // 買い物リストのアイテム配列
const [lineUserId, setLineUserId] = useState<string>(''); // LINE User ID
const [liffError, setLiffError] = useState<string>('');   // LIFF初期化エラーメッセージ
```

#### 主要な機能
| 関数名 | 説明 |
| :--- | :--- |
| `initLiff()` | LIFF SDKの初期化、ログイン状態確認、プロフィール取得 |
| `loadItems()` | サーバーからリストを取得 (5秒ごとのポーリング) |
| `addItem(text: string)` | 新しいアイテムをサーバーに追加 |
| `deleteItem(itemId: string)` | アイテムをサーバーから削除 |
| `toggleDone(itemId: string, done: boolean)` | アイテムの完了状態を切り替え |

#### useEffectフック
```typescript
// LIFF初期化 (マウント時に1回実行)
useEffect(() => {
  initLiff();
}, []);

// アイテムの定期取得 (lineUserId変更時に再実行)
useEffect(() => {
  loadItems();
  const intervalId = setInterval(loadItems, 5000); // 5秒ごとにポーリング
  return () => clearInterval(intervalId);         // クリーンアップ
}, [lineUserId]);
```

#### レンダリング
```tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ...">
  <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl rounded-2xl ...">
    <h1>買い物リスト</h1>
    {liffError && <span className="text-red-500">{liffError}</span>}
    <AddItemForm onAddItem={addItem} />
    <ShoppingList items={items} onToggleDone={toggleDone} onDeleteItem={deleteItem} />
  </div>
</div>
```

---

### 5.2. `types.ts` - TypeScript型定義

アプリケーションで使用する型を定義しています。

```typescript
export interface Item {
  itemId: string;   // アイテムの一意識別子 (UUID)
  text: string;     // アイテムのテキスト (例: "牛乳")
  done: boolean;    // 完了状態 (true: 完了, false: 未完了)
}
```

> **注意**: サーバーから返されるアイテムには `listId`, `createdAt`, `updatedAt` も含まれますが、
> フロントエンドでは使用しないため、型定義には含めていません。

---

### 5.3. `ShoppingList.tsx` - リストコンテナコンポーネント

**役割**: アイテムのリストをレンダリングし、各アイテムに対して`ShoppingListItem`コンポーネントを描画します。

#### Props定義
```typescript
interface ShoppingListProps {
  items: Item[];                                       // 表示するアイテムの配列
  onToggleDone: (itemId: string, done: boolean) => void; // 完了切り替えのコールバック
  onDeleteItem: (itemId: string) => void;              // 削除のコールバック
}
```

#### 実装
```tsx
const ShoppingList: React.FC<ShoppingListProps> = ({ items, onToggleDone, onDeleteItem }) => {
  return (
    <ul className="space-y-3">
      {items.map(item => (
        <ShoppingListItem
          key={item.itemId}
          item={item}
          onToggleDone={onToggleDone}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </ul>
  );
};
```

#### 使用例
```tsx
<ShoppingList 
  items={items} 
  onToggleDone={toggleDone} 
  onDeleteItem={deleteItem} 
/>
```

---

### 5.4. `ShoppingListItem.tsx` - 個別アイテムコンポーネント

**役割**: 買い物リストの個別アイテムを表示し、チェックボックス、テキスト、削除ボタンを提供します。

#### Props定義
```typescript
interface ShoppingListItemProps {
  item: Item;                                          // 表示するアイテム
  onToggleDone: (itemId: string, done: boolean) => void; // 完了切り替えのコールバック
  onDeleteItem: (itemId: string) => void;              // 削除のコールバック
}
```

#### 主要な振る舞い
- **チェックボックスクリック**: `item.done`を反転させて`onToggleDone`を呼び出す
- **削除ボタン**: `item.done === true`のときのみ表示される
- **見た目の切り替え**:
  - 未完了: 通常の太字テキスト、グレーのチェックボックス枠
  - 完了: 取り消し線 + グレーアウト、インディゴ色の背景 + チェックマーク

#### 実装のポイント
```tsx
// チェックボックスのカスタムデザイン
<div className={`... ${item.done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
  {item.done && (
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )}
</div>

// テキストのスタイル切り替え
<span className={`... ${item.done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
  {item.text}
</span>

// 削除ボタンの条件付き表示
{item.done && (
  <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.itemId); }}>
    {/* ゴミ箱アイコン */}
  </button>
)}
```

#### 使用例
```tsx
<ShoppingListItem
  item={{ itemId: '123', text: '牛乳', done: false }}
  onToggleDone={(id, done) => console.log(`Toggle ${id} to ${done}`)}
  onDeleteItem={(id) => console.log(`Delete ${id}`)}
/>
```

---

### 5.5. `AddItemForm.tsx` - アイテム追加フォームコンポーネント

**役割**: 新しいアイテムをリストに追加するための入力フォームを提供します。

#### Props定義
```typescript
interface AddItemFormProps {
  onAddItem: (text: string) => void;  // アイテム追加のコールバック
}
```

#### 主要な状態
```typescript
const [text, setText] = useState('');  // 入力フィールドのテキスト
```

#### 主要な振る舞い
- **フォーム送信**:
  - `e.preventDefault()`でページリロードを防ぐ
  - `text.trim()`が空でない場合、`onAddItem(text)`を呼び出す
  - 送信後、入力フィールドをクリア (`setText('')`)
- **追加ボタン**:
  - `text.trim()`が空の場合は無効化 (`disabled={!text.trim()}`)

#### 実装
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (text.trim()) {
    onAddItem(text);
    setText('');
  }
};

return (
  <form onSubmit={handleSubmit} className="relative">
    <div className="flex shadow-sm rounded-lg overflow-hidden ...">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="新しいアイテムを追加..."
      />
      <button type="submit" disabled={!text.trim()}>
        追加
      </button>
    </div>
  </form>
);
```

#### 使用例
```tsx
<AddItemForm onAddItem={(text) => console.log(`Add: ${text}`)} />
```

---

## 6. 状態管理

このアプリケーションは、シンプルな状態管理のために**React Hooks** (`useState`, `useEffect`) を使用しています。
外部ライブラリ (Redux, Zustand等) は使用していません。

### 状態の種類

| 状態 | 型 | 管理場所 | 説明 |
| :--- | :--- | :--- | :--- |
| `items` | `Item[]` | `App.tsx` | 買い物リストのアイテム配列 |
| `lineUserId` | `string` | `App.tsx` | LINE User ID (LIFF初期化後に取得) |
| `liffError` | `string` | `App.tsx` | LIFF初期化エラーメッセージ |
| `text` | `string` | `AddItemForm.tsx` | 入力フォームのテキスト (ローカル状態) |

### 状態の流れ (Data Flow)

```
App.tsx (親コンポーネント)
  ├── items: Item[]
  │   ├── loadItems() → サーバーからGET → setItems()
  │   ├── addItem() → サーバーにPOST → loadItems()
  │   ├── deleteItem() → サーバーにDELETE → loadItems()
  │   └── toggleDone() → サーバーにPUT → loadItems()
  │
  ├── [Props Down] items, onToggleDone, onDeleteItem
  │   └─→ ShoppingList.tsx
  │         └─→ ShoppingListItem.tsx (各アイテムに対して)
  │
  └── [Props Down] onAddItem
      └─→ AddItemForm.tsx
```

### 更新フロー
1. ユーザーがアクション (追加/削除/完了切り替え) を実行
2. 対応する関数 (`addItem`, `deleteItem`, `toggleDone`) がサーバーにリクエストを送信
3. サーバーからのレスポンス後、`loadItems()`を呼び出してリストを再取得
4. `setItems()`で状態を更新
5. Reactが再レンダリングを実行し、UIが更新される

---

## 7. スタイリング (Tailwind CSS v4)

このプロジェクトは **Tailwind CSS v4** を使用しており、ユーティリティクラスを直接JSX内に記述する方式です。

### 7.1. Tailwind CSS v4の特徴

Tailwind CSS v4では、以下の変更点があります：
- **PostCSSプラグインの使用**: `@tailwindcss/postcss`, `@tailwindcss/vite`を使用
- **設定ファイル不要**: 従来の`tailwind.config.js`は不要 (Viteプラグインが自動設定)
- **CSSインポート**: `index.css`に`@import "tailwindcss";`を記述するだけ

### 7.2. セットアップ

#### `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // Tailwind CSS v4のViteプラグイン
  ],
})
```

#### `index.css`
```css
@import "tailwindcss";
```

### 7.3. スタイリングのパターン

#### グラデーション背景
```tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
```

#### グラスモーフィズム (Glassmorphism)
```tsx
<div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
```

#### ホバーエフェクト
```tsx
<button className="hover:bg-indigo-700 transition-colors duration-200">
```

#### 条件付きスタイル
```tsx
<span className={`text-lg ${item.done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
```

### 7.4. デザインシステム

| 要素 | スタイル | 説明 |
| :--- | :--- | :--- |
| **メインカラー** | `indigo-500`, `indigo-600`, `indigo-700` | ボタン、チェックボックス |
| **背景色** | `blue-50`, `indigo-100` | グラデーション背景 |
| **テキスト** | `slate-700`, `slate-800`, `slate-900` | 通常のテキスト |
| **無効化テキスト** | `slate-400` | 完了済みアイテム |
| **ホワイトスペース** | `space-y-3`, `space-y-8` | 縦方向の余白 |
| **角丸** | `rounded-xl`, `rounded-2xl` | カード、ボタン |
| **影** | `shadow-sm`, `shadow-xl` | 立体感 |

---

## 8. LIFF連携

LINE Front-end Framework (LIFF) は、LINEアプリ内でWebアプリケーションを動作させるためのSDKです。

### 8.1. LIFF初期化フロー

```typescript
const initLiff = async () => {
  try {
    const liffId = import.meta.env.VITE_LIFF_ID || 'YOUR_LIFF_ID';
    await liff.init({ liffId });  // LIFF SDKの初期化

    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();  // プロフィール取得
      console.log('LINE ID:', profile.userId);
      setLineUserId(profile.userId);
    } else {
      console.log('LINE ID: Not Logged In');
      setLineUserId('');
    }
  } catch (error) {
    console.error('LIFF Initialization failed', error);
    setLiffError('LIFF Init Failed');
  }
};
```

### 8.2. ログイン状態の判定

| メソッド | 戻り値 | 説明 |
| :--- | :--- | :--- |
| `liff.isLoggedIn()` | `boolean` | LINEにログイン済みかどうか |
| `liff.getProfile()` | `Promise<Profile>` | ユーザーのプロフィール情報 (userId, displayName, pictureUrl等) |
| `liff.login()` | `void` | LINEログイン画面へリダイレクト |
| `liff.logout()` | `void` | ログアウト |

### 8.3. APIリクエストへのLINE User IDの付与

```typescript
const headers: HeadersInit = {};
if (lineUserId) {
  headers['X-Line-User-Id'] = lineUserId;
}
const response = await fetch(`${apiUrl}/lists/${listId}`, { headers });
```

### 8.4. エラーハンドリング

LIFF初期化に失敗した場合、`liffError`状態にエラーメッセージが設定され、画面中央に赤字で表示されます。

```tsx
{liffError && <span className="text-red-500">{liffError}</span>}
```

#### 発生しうるエラー
- **ネットワークエラー**: LIFF SDKの読み込み失敗
- **無効なLIFF ID**: `.env`ファイルの設定ミス
- **LINEアプリ外での実行**: LIFFの一部機能が制限される

---

## 9. API通信

アプリケーションは、AWS API Gatewayを経由してバックエンドAPIと通信します。

### 9.1. API Base URL

```typescript
const apiUrl = 'https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod';
const listId = 'myFamilyList';  // リストIDは固定
```

### 9.2. APIエンドポイント

| メソッド | エンドポイント | 説明 |
| :--- | :--- | :--- |
| **GET** | `/lists/{listId}` | リストの全アイテムを取得 |
| **POST** | `/lists/{listId}/items` | 新しいアイテムを追加 |
| **PUT** | `/lists/{listId}/items/{itemId}` | アイテムを更新 (完了状態の切り替え) |
| **DELETE** | `/lists/{listId}/items/{itemId}` | アイテムを削除 |

> **詳細**: [API仕様書](/docs/api/api-spec.md) を参照してください。

### 9.3. リスト取得 (GET)

```typescript
const loadItems = async () => {
  try {
    const headers: HeadersInit = {};
    if (lineUserId) {
      headers['X-Line-User-Id'] = lineUserId;
    }
    const response = await fetch(`${apiUrl}/lists/${listId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch items.');
    const loadedItems: Item[] = await response.json();
    setItems(loadedItems);
  } catch (error) {
    console.error('Error loading items:', error);
  }
};
```

### 9.4. アイテム追加 (POST)

```typescript
const addItem = async (text: string) => {
  try {
    const response = await fetch(`${apiUrl}/lists/${listId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
      },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Failed to add item.');
    loadItems();  // リストを再取得
  } catch (error) {
    console.error('Error adding item:', error);
  }
};
```

### 9.5. アイテム更新 (PUT)

```typescript
const toggleDone = async (itemId: string, done: boolean) => {
  try {
    const response = await fetch(`${apiUrl}/lists/${listId}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
      },
      body: JSON.stringify({ done }),
    });
    if (!response.ok) throw new Error('Failed to update item.');
    loadItems();  // リストを再取得
  } catch (error) {
    console.error('Error updating item:', error);
  }
};
```

### 9.6. アイテム削除 (DELETE)

```typescript
const deleteItem = async (itemId: string) => {
  try {
    const response = await fetch(`${apiUrl}/lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
      }
    });
    if (!response.ok) throw new Error('Failed to delete item.');
    loadItems();  // リストを再取得
  } catch (error) {
    console.error('Error deleting item:', error);
  }
};
```

### 9.7. 自動更新 (ポーリング)

5秒ごとにサーバーから最新のリストを取得します。

```typescript
useEffect(() => {
  loadItems();
  const intervalId = setInterval(loadItems, 5000);  // 5秒ごとに実行
  return () => clearInterval(intervalId);          // クリーンアップ
}, [lineUserId]);
```

---

## 10. 環境変数の設定

このプロジェクトは、Viteの環境変数機能を使用しています。

### 10.1. 環境変数ファイル

- **`.env.example`**: サンプルファイル (Gitにコミット済み)
- **`.env`**: 実際の環境変数 (Gitignore済み)

### 10.2. 環境変数の定義

`.env`ファイルに以下を記述します：

```env
VITE_LIFF_ID=YOUR_LIFF_ID_HERE
```

> **注意**: Viteでは、環境変数は必ず`VITE_`プレフィックスが必要です。

### 10.3. コード内での使用

```typescript
const liffId = import.meta.env.VITE_LIFF_ID || 'YOUR_LIFF_ID';
```

- `import.meta.env.VITE_LIFF_ID` でアクセス
- 環境変数が未定義の場合はフォールバック値を使用

### 10.4. LIFF IDの取得方法

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーとLINEログインチャネルを作成
3. LIFF アプリを作成し、LIFF IDを取得
4. `.env`ファイルに設定

---

## 11. ビルド・実行・デプロイ

### 11.1. 開発サーバーの起動

```bash
npm run dev
```

- Viteの開発サーバーが起動 (`http://localhost:5173`)
- ホットリロード (HMR) 有効
- TypeScriptエラーがブラウザとターミナルに表示される

### 11.2. ビルド

```bash
npm run build
```

- TypeScriptのコンパイルチェック実行
- 本番用の最適化されたファイルを`dist/`に出力
- 静的ファイルとして配信可能

#### ビルド出力
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js   # JavaScriptバンドル
│   ├── index-[hash].css  # CSSバンドル
│   └── ...
```

### 11.3. プレビュー (ビルド後の動作確認)

```bash
npm run preview
```

- ビルド後のファイルをローカルサーバーで確認 (`http://localhost:4173`)

### 11.4. リント (コード品質チェック)

```bash
npm run lint
```

- ESLintによるコードチェック
- TypeScriptおよびReact Hooksのルール違反を検出

### 11.5. デプロイ

#### AWS S3 + CloudFrontへのデプロイ (推奨)
1. `npm run build`でビルド
2. `dist/`ディレクトリの内容をS3バケットにアップロード
3. CloudFrontディストリビューションを作成し、S3をオリジンに設定
4. HTTPS経由でアクセス可能に

#### 注意事項
- **LIFF ID**: 本番環境用の`.env`ファイルを用意し、本番用LIFF IDを設定
- **API URL**: 本番環境のAPI GatewayのURLに変更 (必要に応じて環境変数化)

---

## 12. 開発時のtips

### 12.1. TypeScriptの型チェック

Viteは開発時にTypeScriptのコンパイルチェックを行いますが、エディタ (VSCodeなど) でリアルタイムに型エラーを確認することを推奨します。

### 12.2. React Developer Tools

[React Developer Tools](https://react.dev/learn/react-developer-tools) をブラウザ拡張機能としてインストールすると、コンポーネントの状態やPropsをデバッグできます。

### 12.3. LIFF開発時の注意点

- **LINEアプリ外でのテスト**: LIFFはLINEアプリ内で動作することを前提としていますが、ブラウザでも一部機能をテストできます。
- **ローカル開発**: LIFF IDは`https://`のURLを必要とするため、ローカル開発時は`https://localhost`をLIFF URLに登録する必要があります (Viteは`https`をサポート)。
- **LIFF Simulatorの利用**: [LIFF Playground](https://liff-playground.netlify.app/) でLIFFの動作を確認できます。

### 12.4. よくある問題と解決方法

#### 問題: `VITE_LIFF_ID is not defined`
- **原因**: `.env`ファイルが存在しない、または環境変数が定義されていない
- **解決**: `.env.example`を参考に`.env`を作成し、LIFF IDを設定

#### 問題: APIリクエストが失敗する (CORS エラー)
- **原因**: バックエンドAPIがCORSヘッダーを返していない
- **解決**: API GatewayでCORSを有効化 (詳細は [API仕様書](/docs/api/api-spec.md) 参照)

#### 問題: ビルド時に`Module not found`エラー
- **原因**: 依存関係がインストールされていない
- **解決**: `npm install`を実行

#### 問題: Tailwind CSSのスタイルが反映されない
- **原因**: `index.css`に`@import "tailwindcss";`が記述されていない、または`main.tsx`でインポートされていない
- **解決**: `index.css`と`main.tsx`の記述を確認

### 12.5. パフォーマンス最適化

- **ポーリング間隔の調整**: 現在5秒ごとにリストを取得していますが、必要に応じて間隔を変更してください。
- **useCallback/useMemoの活用**: 大量のアイテムを扱う場合は、`useCallback`や`useMemo`で最適化を検討してください。
- **Lazy Loadingの検討**: 将来的にコンポーネントが増えた場合は、`React.lazy()`で遅延読み込みを検討してください。

---

## 参考リンク

- [React 公式ドキュメント](https://react.dev/)
- [Vite 公式ドキュメント](https://vitejs.dev/)
- [Tailwind CSS v4 ドキュメント](https://tailwindcss.com/docs)
- [LINE LIFF SDK ドキュメント](https://developers.line.biz/ja/docs/liff/overview/)
- [TypeScript 公式ドキュメント](https://www.typescriptlang.org/)

---

## サポート

質問や問題が発生した場合は、以下のドキュメントも参照してください：
- [画面設計書](/docs/design/screen-design.md)
- [画面遷移図](/docs/design/screen-transition.md)
- [API仕様書](/docs/api/api-spec.md)
- [インフラ構成図](/docs/infra/architecture.md)
