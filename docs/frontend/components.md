# コンポーネント詳細仕様書

買い物リストアプリケーションのReactコンポーネントの詳細仕様です。

## 📚 目次
- [コンポーネント一覧](#コンポーネント一覧)
- [App](#app)
- [AddItemForm](#additemform)
- [ShoppingList](#shoppinglist)
- [ShoppingListItem](#shoppinglistitem)
- [型定義](#型定義)

## コンポーネント一覧

| コンポーネント | ファイル | 役割 |
|---------------|---------|------|
| `App` | `src/App.tsx` | ルートコンポーネント。状態管理とAPI連携を担当 |
| `AddItemForm` | `src/AddItemForm.tsx` | 新しいアイテムを追加するフォーム |
| `ShoppingList` | `src/ShoppingList.tsx` | アイテムリストの表示を担当 |
| `ShoppingListItem` | `src/ShoppingListItem.tsx` | 個別アイテムの表示と操作を担当 |

## App

### 概要
アプリケーションのルートコンポーネント。LIFF初期化、状態管理、API連携を一元的に管理します。

### ファイルパス
`src/App.tsx`

### 状態管理

#### State
```typescript
const [items, setItems] = useState<Item[]>([]);        // アイテムリスト
const [lineUserId, setLineUserId] = useState<string>(''); // LINE User ID
const [liffError, setLiffError] = useState<string>('');   // LIFFエラーメッセージ
```

### 主要機能

#### 1. LIFF初期化 (`useEffect`)
アプリケーション起動時にLINE Front-end Frameworkを初期化します。

```typescript
useEffect(() => {
  const initLiff = async () => {
    try {
      const liffId = import.meta.env.VITE_LIFF_ID || 'YOUR_LIFF_ID';
      await liff.init({ liffId });

      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
      } else {
        setLineUserId('');
      }
    } catch (error) {
      console.error('LIFF Initialization failed', error);
      setLiffError('LIFF Init Failed');
    }
  };
  initLiff();
}, []);
```

**フロー**:
1. 環境変数から LIFF ID を取得
2. `liff.init()` でSDKを初期化
3. ログイン状態を確認
4. ログイン済みの場合、プロフィールを取得してUser IDを保存
5. エラー時はエラーメッセージを設定

#### 2. データ自動更新 (`useEffect`)
5秒ごとにサーバーから最新データを取得します。

```typescript
useEffect(() => {
  loadItems();
  const intervalId = setInterval(loadItems, 5000);
  return () => clearInterval(intervalId);
}, [lineUserId]);
```

**ポイント**:
- 初回マウント時とlineUserIdの変更時に実行
- クリーンアップ関数でタイマーを解除

#### 3. データ取得 (`loadItems`)
サーバーからアイテムリストを取得します。

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

**ヘッダー**:
- ログイン済みの場合のみ `X-Line-User-Id` を付与

#### 4. アイテム追加 (`addItem`)
新しいアイテムをサーバーに送信します。

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
    loadItems();
  } catch (error) {
    console.error('Error adding item:', error);
  }
};
```

#### 5. アイテム削除 (`deleteItem`)
指定されたアイテムを削除します。

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
    loadItems();
  } catch (error) {
    console.error('Error deleting item:', error);
  }
};
```

#### 6. 完了状態切り替え (`toggleDone`)
アイテムの完了/未完了を切り替えます。

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
    loadItems();
  } catch (error) {
    console.error('Error updating item:', error);
  }
};
```

### UIレイアウト
```tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ...">
  <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl ...">
    <h1>買い物リスト</h1>
    {liffError && <span className="text-red-500">{liffError}</span>}
    <AddItemForm onAddItem={addItem} />
    <ShoppingList items={items} onToggleDone={toggleDone} onDeleteItem={deleteItem} />
  </div>
</div>
```

### Props
なし（ルートコンポーネント）

---

## AddItemForm

### 概要
新しいアイテムをリストに追加するためのフォームコンポーネント。

### ファイルパス
`src/AddItemForm.tsx`

### Props定義
```typescript
interface AddItemFormProps {
  onAddItem: (text: string) => void;  // アイテム追加時のコールバック関数
}
```

### 状態管理
```typescript
const [text, setText] = useState('');  // 入力フィールドの値
```

### 主要機能

#### フォーム送信処理
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (text.trim()) {
    onAddItem(text);
    setText('');  // 入力フィールドをクリア
  }
};
```

**動作**:
1. デフォルトのフォーム送信をキャンセル
2. 入力値が空でない場合のみ処理
3. 親コンポーネントのコールバックを呼び出し
4. 入力フィールドをクリア

### UI構造
```tsx
<form onSubmit={handleSubmit}>
  <div className="flex ...">
    <input 
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="新しいアイテムを追加..."
    />
    <button 
      type="submit"
      disabled={!text.trim()}
    >
      追加
    </button>
  </div>
</form>
```

### スタイリング
- **入力フィールド**: 
  - フォーカス時にインディゴ色のリング表示
  - プレースホルダーはグレー
- **ボタン**: 
  - インディゴ色の背景
  - 入力が空の場合は無効化（透明度50%）

### 使用例
```tsx
<AddItemForm onAddItem={(text) => console.log('Add:', text)} />
```

---

## ShoppingList

### 概要
アイテムのリストを表示するコンポーネント。各アイテムを `ShoppingListItem` にレンダリングします。

### ファイルパス
`src/ShoppingList.tsx`

### Props定義
```typescript
interface ShoppingListProps {
  items: Item[];                                        // 表示するアイテムの配列
  onToggleDone: (itemId: string, done: boolean) => void; // 完了状態切り替えコールバック
  onDeleteItem: (itemId: string) => void;               // 削除コールバック
}
```

### UI構造
```tsx
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
```

### 主要機能
- アイテム配列をマッピングして `ShoppingListItem` をレンダリング
- 各アイテムに `itemId` をkeyとして設定
- イベントハンドラーを子コンポーネントに伝播

### スタイリング
- リストアイテム間に適度なスペース (`space-y-3`)

### 使用例
```tsx
<ShoppingList 
  items={[
    { itemId: '1', text: '牛乳', done: false },
    { itemId: '2', text: '卵', done: true }
  ]}
  onToggleDone={(id, done) => console.log('Toggle:', id, done)}
  onDeleteItem={(id) => console.log('Delete:', id)}
/>
```

---

## ShoppingListItem

### 概要
個別のアイテムを表示し、チェックボックスと削除ボタンを提供するコンポーネント。

### ファイルパス
`src/ShoppingListItem.tsx`

### Props定義
```typescript
interface ShoppingListItemProps {
  item: Item;                                           // 表示するアイテム
  onToggleDone: (itemId: string, done: boolean) => void; // 完了状態切り替えコールバック
  onDeleteItem: (itemId: string) => void;               // 削除コールバック
}
```

### UI構造
```tsx
<li className={`group flex items-center justify-between ...`}>
  {/* チェックボックス＆テキスト */}
  <div onClick={() => onToggleDone(item.itemId, !item.done)}>
    <div className={`custom-checkbox ${item.done ? 'checked' : ''}`}>
      {item.done && <svg>✓</svg>}
    </div>
    <span className={item.done ? 'line-through text-gray-400' : ''}>
      {item.text}
    </span>
  </div>
  
  {/* 削除ボタン（完了済みアイテムのみ） */}
  {item.done && (
    <button onClick={() => onDeleteItem(item.itemId)}>
      <svg>🗑️</svg>
    </button>
  )}
</li>
```

### 主要機能

#### 1. 完了状態の表示
- **未完了**: グレーの枠線のチェックボックス
- **完了**: インディゴ色の背景 + 白いチェックマーク

#### 2. テキストの表示
- **未完了**: 通常表示（太字、スレート色）
- **完了**: 取り消し線 + グレーアウト

#### 3. 削除ボタンの条件表示
- 完了済み (`item.done === true`) の場合のみ表示
- ゴミ箱アイコン
- ホバー時に赤色に変化

### スタイリング

#### 未完了アイテム
```css
border: slate-200
background: white
shadow: sm
hover:shadow-md
checkbox: border-slate-300
text: slate-700, font-medium
```

#### 完了済みアイテム
```css
border: slate-100
background: slate-50
checkbox: bg-indigo-500, border-indigo-500
text: slate-400, line-through
```

### インタラクション
1. **クリック領域**: チェックボックスとテキスト全体
2. **削除ボタン**: `stopPropagation()` でクリックイベントの伝播を防止

### 使用例
```tsx
<ShoppingListItem 
  item={{ itemId: '1', text: '牛乳', done: false }}
  onToggleDone={(id, done) => console.log('Toggle:', id, done)}
  onDeleteItem={(id) => console.log('Delete:', id)}
/>
```

---

## 型定義

### ファイルパス
`src/types.ts`

### Item型
買い物リストのアイテムを表す型定義。

```typescript
export interface Item {
  itemId: string;  // 一意の識別子（UUID）
  text: string;    // アイテムのテキスト（例: "牛乳"）
  done: boolean;   // 完了状態（true: 完了, false: 未完了）
}
```

### 使用例
```typescript
import { Item } from './types';

const item: Item = {
  itemId: 'uuid-1234',
  text: '牛乳',
  done: false
};
```

---

## コンポーネント間のデータフロー

```
App (State: items, lineUserId, liffError)
 ├─ API連携 (loadItems, addItem, deleteItem, toggleDone)
 │
 ├─> AddItemForm
 │    └─ Props: onAddItem
 │    └─ Event: テキスト入力 → onAddItem(text) 呼び出し
 │
 └─> ShoppingList
      └─ Props: items, onToggleDone, onDeleteItem
      │
      └─> ShoppingListItem (各アイテム)
           └─ Props: item, onToggleDone, onDeleteItem
           └─ Event: 
              ・チェックボックスクリック → onToggleDone(itemId, !done)
              ・削除ボタンクリック → onDeleteItem(itemId)
```

---

## ベストプラクティス

### 1. 責務の分離
- **App**: 状態管理とAPI連携
- **AddItemForm**: フォーム管理
- **ShoppingList**: リスト表示
- **ShoppingListItem**: 個別アイテムの表示

### 2. Props Drilling の回避
現在の構成では階層が浅いため問題ありませんが、今後拡張する場合は Context API や状態管理ライブラリの導入を検討してください。

### 3. TypeScript型定義
すべてのPropsとStateに明示的な型定義を使用しています。

### 4. アクセシビリティ
- ボタンに `aria-label` 属性を設定
- フォームの適切な使用 (`<form>`, `type="submit"`)

### 5. パフォーマンス
- `key` 属性の適切な使用 (`itemId`)
- 不要な再レンダリングを避けるため、必要に応じて `React.memo` の使用を検討

---

## 関連ドキュメント
- [フロントエンドアーキテクチャ](./architecture.md)
- [APIクライアント実装ガイド](./api-client.md)
- [画面設計書](../design/screen-design.md)
