# API仕様書

## 概要
買い物リストアプリケーションのバックエンドAPI。AWS Lambda + API Gatewayで構築されている。

- **Base URL**: `https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod` (環境により異なる)

## エンドポイント一覧

### 共通仕様

#### リクエストヘッダー
- **X-Line-User-Id** (Optional): アクセスしているユーザーのLINE User ID。ログ出力に使用される。

#### CORS (Cross-Origin Resource Sharing)
- 全てのエンドポイントで `OPTIONS` メソッドをサポートする。
- プリフライトリクエストに対し、以下のヘッダーを許可して `200 OK` を返す。
    - `Access-Control-Allow-Origin`: `*`
    - `Access-Control-Allow-Headers`: `Content-Type,X-Line-User-Id`
    - `Access-Control-Allow-Methods`: `GET,POST,PUT,DELETE,OPTIONS`

### 1. リスト取得
指定されたリストIDに紐づく全てのアイテムを取得する。

- **Method**: `GET`
- **Path**: `/lists/{listId}`
- **Parameters**:
    - `listId` (Path, Required): リストの識別子 (例: `myFamilyList`)
- **Response**:
    - **200 OK**: アイテムの配列
    ```json
    [
        {
            "listId": "myFamilyList",
            "itemId": "uuid-string",
            "text": "牛乳",
            "done": false,
            "createdAt": "2023-11-24T12:00:00.000Z",
            "updatedAt": "2023-11-24T12:00:00.000Z"
        }
    ]
    ```

### 2. アイテム追加
リストに新しいアイテムを追加する。

- **Method**: `POST`
- **Path**: `/lists/{listId}/items`
- **Parameters**:
    - `listId` (Path, Required): リストの識別子
- **Body**:
    ```json
    {
        "text": "卵"
    }
    ```
- **Response**:
    - **201 Created**: 作成されたアイテム
    ```json
    {
        "listId": "myFamilyList",
        "itemId": "new-uuid-string",
        "text": "卵",
        "done": false,
        "createdAt": "...",
        "updatedAt": "..."
    }
    ```

### 3. アイテム更新
アイテムの状態 (完了/未完了) やテキストを更新する。

- **Method**: `PUT`
- **Path**: `/lists/{listId}/items/{itemId}`
- **Parameters**:
    - `listId` (Path, Required): リストの識別子
    - `itemId` (Path, Required): アイテムの識別子
- **Body**:
    - 以下のフィールドのいずれか、または両方を含む
    ```json
    {
        "done": true,
        "text": "修正後のテキスト"
    }
    ```
- **Response**:
    - **200 OK**: 更新後のアイテム属性

### 4. 特定アイテム取得
特定のアイテムを1件取得する。

- **Method**: `GET`
- **Path**: `/lists/{listId}/items/{itemId}`
- **Parameters**:
    - `listId` (Path, Required): リストの識別子
    - `itemId` (Path, Required): アイテムの識別子
- **Response**:
    - **200 OK**: アイテムオブジェクト
    ```json
    {
        "listId": "myFamilyList",
        "itemId": "uuid-string",
        "text": "牛乳",
        "done": false,
        "createdAt": "2023-11-24T12:00:00.000Z",
        "updatedAt": "2023-11-24T12:00:00.000Z"
    }
    ```
    - **404 Not Found**: アイテムが存在しない場合
    ```json
    {
        "message": "Item not found"
    }
    ```

### 5. アイテム削除
リストからアイテムを削除する。

- **Method**: `DELETE`
- **Path**: `/lists/{listId}/items/{itemId}`
- **Parameters**:
    - `listId` (Path, Required): リストの識別子
    - `itemId` (Path, Required): アイテムの識別子
- **Response**:
    - **204 No Content**: 成功 (ボディなし)

## エラーコード

### HTTPステータスコード一覧

| ステータスコード | 説明 | 発生ケース |
|------------------|------|------------|
| 200 OK | 成功（データ返却あり） | GET（リスト取得、アイテム取得）、PUT（アイテム更新） |
| 201 Created | リソース作成成功 | POST（アイテム追加） |
| 204 No Content | 成功（データ返却なし） | DELETE（アイテム削除） |
| 400 Bad Request | リクエストパラメータ不正 | 必須パラメータ欠如、更新パラメータなし |
| 404 Not Found | リソースが見つからない | 存在しないアイテムへのGET、不正なパス |
| 405 Method Not Allowed | サポートされていないHTTPメソッド | GET/POST/PUT/DELETE/OPTIONS以外 |
| 500 Internal Server Error | サーバー内部エラー | DynamoDBエラー、予期しない例外 |

### エラーレスポンス形式

全てのエラーレスポンスは以下の形式で返されます：

```json
{
    "message": "エラーの説明"
}
```

### 主なエラーケース

#### 1. 必須パラメータ欠如
**ステータスコード**: `400 Bad Request`

**例**: listIdなしでリスト取得を試みた場合
```json
{
    "message": "Missing listId for GET operation"
}
```

#### 2. 更新パラメータなし
**ステータスコード**: `400 Bad Request`

**例**: PUT時に更新対象フィールドが何もない場合
```json
{
    "message": "No update parameters provided"
}
```

#### 3. アイテムが存在しない
**ステータスコード**: `404 Not Found`

**例**: 存在しないアイテムを取得しようとした場合
```json
{
    "message": "Item not found"
}
```

#### 4. 不正なパス
**ステータスコード**: `404 Not Found`

**例**: `/lists` で始まらないパスへのアクセス
```json
{
    "message": "Not Found"
}
```

#### 5. サポートされていないHTTPメソッド
**ステータスコード**: `405 Method Not Allowed`

**例**: PATCH メソッドを使用した場合
```json
{
    "message": "Method Not Allowed"
}
```

#### 6. リスト全体の削除（未サポート）
**ステータスコード**: `400 Bad Request`

**例**: DELETE /lists/{listId} を実行した場合
```json
{
    "message": "Delete entire list not supported in this version"
}
```

#### 7. サーバーエラー
**ステータスコード**: `500 Internal Server Error`

**例**: DynamoDB接続エラー、IAM権限不足など
```json
{
    "message": "Internal Server Error"
}
```

## データモデル

### アイテムオブジェクト

| フィールド名 | データ型 | 必須 | 説明 |
|------------|---------|------|------|
| `listId` | string | Yes | リストの識別子（パーティションキー） |
| `itemId` | string | Yes | アイテムの識別子（ソートキー、UUIDv4） |
| `text` | string | Yes | アイテムのテキスト内容 |
| `done` | boolean | Yes | 完了フラグ（`true`: 完了, `false`: 未完了） |
| `createdAt` | string | Yes | 作成日時（ISO 8601形式） |
| `updatedAt` | string | Yes | 更新日時（ISO 8601形式） |

### 日時フォーマット
全ての日時フィールドはISO 8601形式で表現されます：
```
2023-11-24T12:00:00.000Z
```

## ベストプラクティス

### リクエスト送信時の注意点
1. **Content-Typeヘッダー**: POST/PUTリクエスト時は `Content-Type: application/json` を指定してください
2. **X-Line-User-Idヘッダー**: ログ追跡のため、可能であれば送信してください
3. **listIdの命名**: 英数字、ハイフン、アンダースコアを推奨します

### エラーハンドリング
クライアント側では以下のエラーハンドリングを推奨します：

```javascript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    console.error(`Error ${response.status}: ${error.message}`);
    // エラー処理
  }
  
  const data = await response.json();
  // 成功時の処理
} catch (error) {
  console.error('Network error:', error);
  // ネットワークエラー処理
}
```

## 関連ドキュメント
- [バックエンド開発ガイド](../backend/development-guide.md)
- [Lambda関数詳細](../backend/lambda-functions.md)
- [データベース設計書](../infra/db-schema.md)
- [インフラ構成図](../infra/architecture.md)
