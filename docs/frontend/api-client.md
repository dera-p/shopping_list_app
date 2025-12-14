# APIクライアント実装ガイド

買い物リストアプリケーションのフロントエンドからバックエンドAPIへの通信実装の詳細を説明します。

## 📚 目次
- [概要](#概要)
- [API基本情報](#api基本情報)
- [実装パターン](#実装パターン)
- [エンドポイント別実装](#エンドポイント別実装)
- [エラーハンドリング](#エラーハンドリング)
- [認証・ヘッダー管理](#認証ヘッダー管理)
- [ポーリング実装](#ポーリング実装)
- [ベストプラクティス](#ベストプラクティス)
- [今後の改善案](#今後の改善案)

## 概要

フロントエンドは RESTful API を使用してバックエンドと通信します。現在の実装では、`App.tsx` に API 通信ロジックが集約されています。

### 使用技術
- **Fetch API**: ブラウザ標準のHTTPクライアント
- **async/await**: 非同期処理の記述
- **TypeScript**: 型安全なAPI通信

## API基本情報

### Base URL
```typescript
const apiUrl = 'https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod';
```

### リストID
```typescript
const listId = 'myFamilyList';
```

**注意**: 現在は固定値ですが、将来的には以下のような実装が考えられます：
- 環境変数化 (`VITE_LIST_ID`)
- ユーザーごとの動的リストID
- 複数リストのサポート

### エンドポイント一覧

| メソッド | パス | 用途 |
|---------|------|------|
| `GET` | `/lists/{listId}` | リスト取得 |
| `POST` | `/lists/{listId}/items` | アイテム追加 |
| `PUT` | `/lists/{listId}/items/{itemId}` | アイテム更新 |
| `DELETE` | `/lists/{listId}/items/{itemId}` | アイテム削除 |

詳細は [API仕様書](../api/api-spec.md) を参照してください。

## 実装パターン

### Fetch APIの基本構文

```typescript
const response = await fetch(url, {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'X-Line-User-Id': lineUserId,
  },
  body: JSON.stringify(data), // POST/PUTの場合
});

if (!response.ok) {
  throw new Error('Request failed');
}

const result = await response.json();
```

### 共通ヘッダーの構築

```typescript
const headers: HeadersInit = {};

// Content-Type (POST/PUTの場合)
if (method === 'POST' || method === 'PUT') {
  headers['Content-Type'] = 'application/json';
}

// LINE User ID (任意)
if (lineUserId) {
  headers['X-Line-User-Id'] = lineUserId;
}
```

## エンドポイント別実装

### 1. リスト取得 (GET)

#### 用途
サーバーから買い物リストの全アイテムを取得します。

#### 実装
```typescript
const loadItems = async () => {
  try {
    // ヘッダーの構築
    const headers: HeadersInit = {};
    if (lineUserId) {
      headers['X-Line-User-Id'] = lineUserId;
    }

    // GETリクエスト
    const response = await fetch(`${apiUrl}/lists/${listId}`, { headers });
    
    // エラーチェック
    if (!response.ok) {
      throw new Error('Failed to fetch items.');
    }

    // レスポンスのパース
    const loadedItems: Item[] = await response.json();
    
    // 状態の更新
    setItems(loadedItems);
  } catch (error) {
    console.error('Error loading items:', error);
  }
};
```

#### レスポンス例
```json
[
  {
    "listId": "myFamilyList",
    "itemId": "uuid-1234",
    "text": "牛乳",
    "done": false,
    "createdAt": "2023-11-24T12:00:00.000Z",
    "updatedAt": "2023-11-24T12:00:00.000Z"
  },
  {
    "listId": "myFamilyList",
    "itemId": "uuid-5678",
    "text": "卵",
    "done": true,
    "createdAt": "2023-11-24T12:05:00.000Z",
    "updatedAt": "2023-11-24T12:10:00.000Z"
  }
]
```

#### 型定義
```typescript
// types.ts
export interface Item {
  itemId: string;
  text: string;
  done: boolean;
}
```

**注意**: `createdAt` と `updatedAt` はバックエンドから返されますが、フロントエンドでは現在使用していません。

---

### 2. アイテム追加 (POST)

#### 用途
新しいアイテムをリストに追加します。

#### 実装
```typescript
const addItem = async (text: string) => {
  try {
    // POSTリクエスト
    const response = await fetch(`${apiUrl}/lists/${listId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
      },
      body: JSON.stringify({ text }),
    });

    // エラーチェック
    if (!response.ok) {
      throw new Error('Failed to add item.');
    }

    // リストの再取得
    loadItems();
  } catch (error) {
    console.error('Error adding item:', error);
  }
};
```

#### リクエストボディ
```json
{
  "text": "牛乳"
}
```

#### レスポンス例
```json
{
  "listId": "myFamilyList",
  "itemId": "new-uuid-9999",
  "text": "牛乳",
  "done": false,
  "createdAt": "2023-11-24T12:15:00.000Z",
  "updatedAt": "2023-11-24T12:15:00.000Z"
}
```

#### ポイント
- レスポンスボディは返されますが、現在は使用していません
- `loadItems()` を呼び出してリスト全体を再取得
- これにより、サーバー側で生成されたデータ（タイムスタンプなど）を確実に反映

---

### 3. アイテム更新 (PUT)

#### 用途
アイテムの完了状態を切り替えます。

#### 実装
```typescript
const toggleDone = async (itemId: string, done: boolean) => {
  try {
    // PUTリクエスト
    const response = await fetch(`${apiUrl}/lists/${listId}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
      },
      body: JSON.stringify({ done }),
    });

    // エラーチェック
    if (!response.ok) {
      throw new Error('Failed to update item.');
    }

    // リストの再取得
    loadItems();
  } catch (error) {
    console.error('Error updating item:', error);
  }
};
```

#### リクエストボディ
```json
{
  "done": true
}
```

**注意**: API仕様上は `text` フィールドも更新可能ですが、現在のUIでは `done` のみを変更します。

#### 使用例
```typescript
// ShoppingListItem.tsx
<div onClick={() => onToggleDone(item.itemId, !item.done)}>
  {/* チェックボックス */}
</div>
```

---

### 4. アイテム削除 (DELETE)

#### 用途
完了済みアイテムをリストから削除します。

#### 実装
```typescript
const deleteItem = async (itemId: string) => {
  try {
    // DELETEリクエスト
    const response = await fetch(`${apiUrl}/lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
      }
    });

    // エラーチェック
    if (!response.ok) {
      throw new Error('Failed to delete item.');
    }

    // リストの再取得
    loadItems();
  } catch (error) {
    console.error('Error deleting item:', error);
  }
};
```

#### レスポンス
```
HTTP/1.1 204 No Content
```

**注意**: DELETEリクエストは成功時にボディを返しません（204 No Content）。

#### 使用例
```typescript
// ShoppingListItem.tsx
{item.done && (
  <button onClick={() => onDeleteItem(item.itemId)}>
    {/* 削除アイコン */}
  </button>
)}
```

---

## エラーハンドリング

### 基本パターン

```typescript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  // 成功処理
} catch (error) {
  console.error('API Error:', error);
  // エラー処理
}
```

### HTTPステータスコード別対応

```typescript
const handleResponse = async (response: Response) => {
  if (response.ok) {
    return await response.json();
  }

  // エラーレスポンスの処理
  switch (response.status) {
    case 400:
      throw new Error('Bad Request - リクエストが不正です');
    case 404:
      throw new Error('Not Found - リソースが見つかりません');
    case 500:
      throw new Error('Internal Server Error - サーバーエラーが発生しました');
    default:
      throw new Error(`HTTP Error: ${response.status}`);
  }
};
```

### ネットワークエラーの処理

```typescript
try {
  const response = await fetch(url);
  // ...
} catch (error) {
  if (error instanceof TypeError) {
    // ネットワークエラー（オフライン、CORS、DNS失敗など）
    console.error('Network error:', error);
  } else {
    // その他のエラー
    console.error('Unknown error:', error);
  }
}
```

### ユーザーへのフィードバック

**現在の実装**: コンソールログのみ

**改善案**:
```typescript
const [error, setError] = useState<string>('');

// エラー発生時
catch (error) {
  console.error('Error:', error);
  setError('通信エラーが発生しました。しばらくしてから再度お試しください。');
}

// UI表示
{error && (
  <div className="text-red-500 text-sm mt-2">
    {error}
  </div>
)}
```

---

## 認証・ヘッダー管理

### X-Line-User-Id ヘッダー

#### 目的
- ユーザーの識別（ログ記録用）
- 将来的な認証・認可の基盤

#### 実装パターン

**パターン1: スプレッド構文**
```typescript
headers: {
  'Content-Type': 'application/json',
  ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
}
```

**パターン2: 条件付き追加**
```typescript
const headers: HeadersInit = {
  'Content-Type': 'application/json'
};
if (lineUserId) {
  headers['X-Line-User-Id'] = lineUserId;
}
```

#### ヘッダーの有無による動作

| 状態 | X-Line-User-Id | 動作 |
|------|---------------|------|
| ログイン済み | あり | ユーザー情報がログに記録される |
| 未ログイン | なし | 匿名アクセスとして扱われる |

**注意**: 現在のAPI仕様では、ヘッダーがなくてもリクエストは成功します（認可チェックなし）。

---

## ポーリング実装

### 概要
5秒ごとにサーバーから最新データを取得し、リアルタイム同期を実現します。

### 実装
```typescript
useEffect(() => {
  // 初回実行
  loadItems();
  
  // 5秒ごとに実行
  const intervalId = setInterval(loadItems, 5000);
  
  // クリーンアップ
  return () => clearInterval(intervalId);
}, [lineUserId]);
```

### ポイント

#### 1. 依存配列
```typescript
}, [lineUserId]);
```
- `lineUserId` が変更されたときに再実行
- LIFF初期化完了後にポーリングが開始される

#### 2. クリーンアップ
```typescript
return () => clearInterval(intervalId);
```
- コンポーネントのアンマウント時にタイマーを停止
- メモリリークを防止

#### 3. 初回実行
```typescript
loadItems();  // すぐに実行
const intervalId = setInterval(loadItems, 5000);  // 5秒後から定期実行
```

### ポーリング間隔の考慮事項

| 間隔 | メリット | デメリット |
|-----|---------|----------|
| 1秒 | ほぼリアルタイム | サーバー負荷が高い |
| 5秒 | バランスが良い | 若干の遅延 |
| 10秒 | 負荷が低い | 遅延が目立つ |

**現在の選択**: 5秒（リアルタイム性とサーバー負荷のバランス）

### 将来の改善案

#### WebSocketの導入
```typescript
const ws = new WebSocket('wss://api.example.com/ws');

ws.onmessage = (event) => {
  const items = JSON.parse(event.data);
  setItems(items);
};
```

**メリット**:
- 真のリアルタイム同期
- サーバープッシュによる即座な更新
- ポーリングよりも効率的

**導入コスト**:
- バックエンドの変更（API Gateway WebSocket対応）
- 再接続ロジックの実装

---

## ベストプラクティス

### 1. 型安全性の確保

```typescript
// 型定義
interface Item {
  itemId: string;
  text: string;
  done: boolean;
}

// 型アサーション
const loadedItems: Item[] = await response.json();
```

### 2. エラーハンドリングの徹底

```typescript
try {
  // API呼び出し
} catch (error) {
  console.error('Error:', error);
  // ユーザーへのフィードバック
}
```

### 3. レスポンスの検証

```typescript
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
```

### 4. 状態更新後のデータ取得

```typescript
// アイテム追加後、リスト全体を再取得
await addItem(text);
loadItems();
```

**理由**:
- サーバー側で生成されたデータ（ID、タイムスタンプ）を反映
- データの一貫性を保証

### 5. ヘッダーの適切な管理

```typescript
// Content-Type の必要性
const headers: HeadersInit = {};
if (method === 'POST' || method === 'PUT') {
  headers['Content-Type'] = 'application/json';
}
```

### 6. async/await の使用

```typescript
// ❌ 避けるべき
fetch(url).then(response => response.json()).then(data => ...);

// ✅ 推奨
const response = await fetch(url);
const data = await response.json();
```

---

## 今後の改善案

### 1. API通信ロジックの分離

#### 現在の実装
- すべてのAPI呼び出しが `App.tsx` に集約

#### 改善案: サービス層の作成
```typescript
// services/api.ts
export class ShoppingListAPI {
  constructor(private baseUrl: string, private listId: string) {}

  async getItems(userId?: string): Promise<Item[]> {
    const headers = this.buildHeaders(userId);
    const response = await fetch(`${this.baseUrl}/lists/${this.listId}`, { headers });
    return this.handleResponse<Item[]>(response);
  }

  async addItem(text: string, userId?: string): Promise<Item> {
    // ...
  }

  private buildHeaders(userId?: string): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (userId) headers['X-Line-User-Id'] = userId;
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }
}
```

#### 使用例
```typescript
// App.tsx
const api = new ShoppingListAPI(apiUrl, listId);
const items = await api.getItems(lineUserId);
```

### 2. カスタムフックの作成

```typescript
// hooks/useApi.ts
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const request = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError('');
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
};
```

#### 使用例
```typescript
const { request, loading, error } = useApi();

const loadItems = async () => {
  const items = await request(() => api.getItems(lineUserId));
  if (items) setItems(items);
};
```

### 3. リトライロジックの追加

```typescript
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};
```

### 4. キャッシュの実装

```typescript
const cache = new Map<string, { data: Item[], timestamp: number }>();

const loadItemsWithCache = async () => {
  const cached = cache.get(listId);
  const now = Date.now();
  
  // キャッシュが有効（5秒以内）
  if (cached && now - cached.timestamp < 5000) {
    return cached.data;
  }
  
  // APIから取得
  const items = await api.getItems(lineUserId);
  cache.set(listId, { data: items, timestamp: now });
  return items;
};
```

### 5. 楽観的UI更新

```typescript
const addItemOptimistic = async (text: string) => {
  // 一時的にUIを更新
  const tempItem: Item = {
    itemId: 'temp-' + Date.now(),
    text,
    done: false
  };
  setItems([...items, tempItem]);

  try {
    // サーバーに送信
    await api.addItem(text, lineUserId);
    // 成功後、正式なデータを取得
    loadItems();
  } catch (error) {
    // 失敗時、一時アイテムを削除
    setItems(items.filter(i => i.itemId !== tempItem.itemId));
  }
};
```

### 6. AbortController によるキャンセル

```typescript
useEffect(() => {
  const controller = new AbortController();

  const loadItems = async () => {
    try {
      const response = await fetch(url, {
        signal: controller.signal
      });
      // ...
    } catch (error) {
      if (error.name === 'AbortError') {
        // リクエストがキャンセルされた
        return;
      }
      throw error;
    }
  };

  loadItems();
  return () => controller.abort();
}, []);
```

---

## 関連ドキュメント
- [API仕様書](../api/api-spec.md) - バックエンドAPIの詳細仕様
- [コンポーネント詳細仕様書](./components.md) - API呼び出し元コンポーネント
- [フロントエンドアーキテクチャ](./architecture.md) - 全体設計
