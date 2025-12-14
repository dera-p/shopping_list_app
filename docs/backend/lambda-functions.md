# Lambda関数詳細ドキュメント

## 概要
本ドキュメントは、Kaimono List Appのバックエンドを構成するLambda関数の各エンドポイントについて、詳細な動作説明とエラーケースを記載しています。

## Lambda関数の基本情報

### 関数名
`KaimonoListLambda`（CDKによってサフィックスが付与される場合があります）

### ランタイム
Node.js（TypeScript）

### ハンドラー
`index.handler`

### メモリとタイムアウト
- メモリ: デフォルト（128MB〜）
- タイムアウト: 30秒（API Gatewayのデフォルト制限）

## エンドポイント詳細

### 1. リスト全体の取得

#### 基本情報
- **HTTPメソッド**: `GET`
- **パス**: `/lists/{listId}`
- **説明**: 指定されたリストIDに紐づく全てのアイテムを取得します

#### パスパラメータ
| パラメータ名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `listId` | string | Yes | リストの識別子（例: `myFamilyList`, `userId123`） |

#### リクエストヘッダー
| ヘッダー名 | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `X-Line-User-Id` | string | No | LINE User ID（ログ出力用） |

#### リクエスト例
```http
GET /lists/myFamilyList HTTP/1.1
Host: <API_GATEWAY_ENDPOINT>
X-Line-User-Id: U1234567890abcdef
```

#### 成功レスポンス
**ステータスコード**: `200 OK`

**レスポンスボディ**:
```json
[
  {
    "listId": "myFamilyList",
    "itemId": "550e8400-e29b-41d4-a716-446655440000",
    "text": "牛乳",
    "done": false,
    "createdAt": "2023-11-24T12:00:00.000Z",
    "updatedAt": "2023-11-24T12:00:00.000Z"
  },
  {
    "listId": "myFamilyList",
    "itemId": "660e8400-e29b-41d4-a716-446655440001",
    "text": "卵",
    "done": true,
    "createdAt": "2023-11-24T12:05:00.000Z",
    "updatedAt": "2023-11-24T13:00:00.000Z"
  }
]
```

**特記事項**:
- アイテムが1つも存在しない場合は空配列 `[]` を返します
- アイテムは `itemId`（ソートキー）順にソートされて返されます

#### エラーレスポンス

**ケース1: listIdが指定されていない**
```http
GET /lists HTTP/1.1
```
**ステータスコード**: `400 Bad Request`
```json
{
  "message": "Missing listId for GET operation"
}
```

**ケース2: 不正なパス**
```http
GET /invalid HTTP/1.1
```
**ステータスコード**: `404 Not Found`
```json
{
  "message": "Not Found"
}
```

**ケース3: DynamoDBエラー**
**ステータスコード**: `500 Internal Server Error`
```json
{
  "message": "Internal Server Error"
}
```

#### DynamoDB操作
```typescript
QueryCommand({
  TableName: TABLE_NAME,
  KeyConditionExpression: "listId = :listId",
  ExpressionAttributeValues: {
    ":listId": listId
  }
})
```

### 2. 特定アイテムの取得

#### 基本情報
- **HTTPメソッド**: `GET`
- **パス**: `/lists/{listId}/items/{itemId}`
- **説明**: 指定されたリストIDとアイテムIDに該当するアイテムを1件取得します

#### パスパラメータ
| パラメータ名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `listId` | string | Yes | リストの識別子 |
| `itemId` | string | Yes | アイテムの識別子（UUID形式） |

#### リクエスト例
```http
GET /lists/myFamilyList/items/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: <API_GATEWAY_ENDPOINT>
```

#### 成功レスポンス
**ステータスコード**: `200 OK`

**レスポンスボディ**:
```json
{
  "listId": "myFamilyList",
  "itemId": "550e8400-e29b-41d4-a716-446655440000",
  "text": "牛乳",
  "done": false,
  "createdAt": "2023-11-24T12:00:00.000Z",
  "updatedAt": "2023-11-24T12:00:00.000Z"
}
```

#### エラーレスポンス

**ケース1: アイテムが存在しない**
**ステータスコード**: `404 Not Found`
```json
{
  "message": "Item not found"
}
```

#### DynamoDB操作
```typescript
GetCommand({
  TableName: TABLE_NAME,
  Key: { listId, itemId }
})
```

### 3. アイテムの追加

#### 基本情報
- **HTTPメソッド**: `POST`
- **パス**: `/lists/{listId}/items`
- **説明**: 指定されたリストに新しいアイテムを追加します

#### パスパラメータ
| パラメータ名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `listId` | string | Yes | リストの識別子 |

#### リクエストボディ
| フィールド名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `text` | string | Yes | アイテムのテキスト内容 |

#### リクエスト例
```http
POST /lists/myFamilyList/items HTTP/1.1
Host: <API_GATEWAY_ENDPOINT>
Content-Type: application/json

{
  "text": "バナナ"
}
```

#### 成功レスポンス
**ステータスコード**: `201 Created`

**レスポンスボディ**:
```json
{
  "listId": "myFamilyList",
  "itemId": "770e8400-e29b-41d4-a716-446655440002",
  "text": "バナナ",
  "done": false,
  "createdAt": "2023-11-24T14:00:00.000Z",
  "updatedAt": "2023-11-24T14:00:00.000Z"
}
```

**特記事項**:
- `itemId` は自動的にUUIDv4で生成されます
- `done` は自動的に `false` で初期化されます
- `createdAt` と `updatedAt` は現在時刻（ISO 8601形式）で設定されます

#### エラーレスポンス

**ケース1: listIdが指定されていない**
**ステータスコード**: `400 Bad Request`
```json
{
  "message": "Missing listId for POST operation on items"
}
```

**ケース2: リクエストボディが不正**
**ステータスコード**: `500 Internal Server Error`
```json
{
  "message": "Unexpected token ... in JSON at position ..."
}
```

#### DynamoDB操作
```typescript
PutCommand({
  TableName: TABLE_NAME,
  Item: {
    listId,
    itemId: uuidv4(),
    text: body.text,
    done: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
})
```

### 4. アイテムの更新

#### 基本情報
- **HTTPメソッド**: `PUT`
- **パス**: `/lists/{listId}/items/{itemId}`
- **説明**: 既存のアイテムの `text` や `done` フィールドを更新します

#### パスパラメータ
| パラメータ名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `listId` | string | Yes | リストの識別子 |
| `itemId` | string | Yes | アイテムの識別子（UUID形式） |

#### リクエストボディ
| フィールド名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `text` | string | No | 更新後のアイテムテキスト |
| `done` | boolean | No | 更新後の完了フラグ |

**注意**: `text` と `done` のいずれか、または両方を指定する必要があります。

#### リクエスト例

**例1: 完了状態の更新**
```http
PUT /lists/myFamilyList/items/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: <API_GATEWAY_ENDPOINT>
Content-Type: application/json

{
  "done": true
}
```

**例2: テキストと完了状態の両方を更新**
```http
PUT /lists/myFamilyList/items/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: <API_GATEWAY_ENDPOINT>
Content-Type: application/json

{
  "text": "低脂肪牛乳",
  "done": false
}
```

#### 成功レスポンス
**ステータスコード**: `200 OK`

**レスポンスボディ**:
```json
{
  "listId": "myFamilyList",
  "itemId": "550e8400-e29b-41d4-a716-446655440000",
  "text": "低脂肪牛乳",
  "done": false,
  "createdAt": "2023-11-24T12:00:00.000Z",
  "updatedAt": "2023-11-24T15:00:00.000Z"
}
```

**特記事項**:
- `updatedAt` は自動的に現在時刻に更新されます
- レスポンスには更新後のアイテム全体が含まれます（`ReturnValues: "ALL_NEW"`）
- 指定されたフィールドのみが更新され、他のフィールドは保持されます

#### エラーレスポンス

**ケース1: 更新パラメータが指定されていない**
```http
PUT /lists/myFamilyList/items/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Content-Type: application/json

{}
```
**ステータスコード**: `400 Bad Request`
```json
{
  "message": "No update parameters provided"
}
```

**ケース2: アイテムが存在しない**
**ステータスコード**: `200 OK`（DynamoDB UpdateCommandは存在しないキーに対しても成功します）

**注意**: 現在の実装では、存在しないアイテムへのPUTリクエストも200を返し、新しいアイテムが作成されます。存在確認が必要な場合は、事前に `GetCommand` を実行するか、`ConditionExpression` を使用します。

#### DynamoDB操作
```typescript
UpdateCommand({
  TableName: TABLE_NAME,
  Key: { listId, itemId },
  UpdateExpression: 'SET #T = :text, #D = :done, #U = :updatedAt',
  ExpressionAttributeNames: {
    '#T': 'text',
    '#D': 'done',
    '#U': 'updatedAt'
  },
  ExpressionAttributeValues: {
    ':text': body.text,
    ':done': body.done,
    ':updatedAt': new Date().toISOString()
  },
  ReturnValues: "ALL_NEW"
})
```

### 5. アイテムの削除

#### 基本情報
- **HTTPメソッド**: `DELETE`
- **パス**: `/lists/{listId}/items/{itemId}`
- **説明**: 指定されたアイテムをリストから削除します

#### パスパラメータ
| パラメータ名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `listId` | string | Yes | リストの識別子 |
| `itemId` | string | Yes | アイテムの識別子（UUID形式） |

#### リクエスト例
```http
DELETE /lists/myFamilyList/items/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: <API_GATEWAY_ENDPOINT>
```

#### 成功レスポンス
**ステータスコード**: `204 No Content`

**レスポンスボディ**: なし

**特記事項**:
- レスポンスボディは空です
- アイテムが存在しない場合でも204を返します（DynamoDBの仕様）

#### エラーレスポンス

**ケース1: itemIdが指定されていない（リスト全体の削除）**
```http
DELETE /lists/myFamilyList HTTP/1.1
```
**ステータスコード**: `400 Bad Request`
```json
{
  "message": "Delete entire list not supported in this version"
}
```

#### DynamoDB操作
```typescript
DeleteCommand({
  TableName: TABLE_NAME,
  Key: { listId, itemId }
})
```

### 6. CORSプリフライト

#### 基本情報
- **HTTPメソッド**: `OPTIONS`
- **パス**: 全てのパス
- **説明**: ブラウザからのCORSプリフライトリクエストに応答します

#### リクエスト例
```http
OPTIONS /lists/myFamilyList/items HTTP/1.1
Host: <API_GATEWAY_ENDPOINT>
Origin: https://example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type,X-Line-User-Id
```

#### 成功レスポンス
**ステータスコード**: `200 OK`

**レスポンスヘッダー**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type,X-Line-User-Id
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

**レスポンスボディ**: なし

**特記事項**:
- 全てのオリジンからのアクセスを許可します（`*`）
- カスタムヘッダー `X-Line-User-Id` を許可します

## 共通エラーケース

### 1. サポートされていないHTTPメソッド
**ステータスコード**: `405 Method Not Allowed`

**リクエスト例**:
```http
PATCH /lists/myFamilyList/items/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
```

**レスポンス**:
```json
{
  "message": "Method Not Allowed"
}
```

### 2. 不正なパス
**ステータスコード**: `404 Not Found`

**リクエスト例**:
```http
GET /users/123 HTTP/1.1
```

**レスポンス**:
```json
{
  "message": "Not Found"
}
```

### 3. 予期しないサーバーエラー
**ステータスコード**: `500 Internal Server Error`

**レスポンス**:
```json
{
  "message": "エラーメッセージ or Internal Server Error"
}
```

**発生するケース**:
- DynamoDBへの接続エラー
- IAM権限不足
- リクエストボディのJSONパースエラー
- その他の予期しない例外

## パフォーマンス特性

### Query vs GetItem

| 操作 | 使用するAPI | パフォーマンス | ユースケース |
|------|-----------|--------------|-------------|
| リスト全体取得 | `QueryCommand` | O(N) | N = アイテム数 |
| 単一アイテム取得 | `GetCommand` | O(1) | 定数時間 |

### 読み込み整合性
DynamoDBのデフォルト設定では、結果整合性のある読み込みが使用されます。強い整合性が必要な場合は、`ConsistentRead: true` オプションを指定できます。

### スロットリング
DynamoDBはオンデマンドモードを使用しているため、通常はスロットリングは発生しませんが、急激なトラフィックスパイクには対応できない場合があります。

## セキュリティ考慮事項

### 現在の制限
- **認証なし**: 現在、エンドポイントには認証が実装されていません
- **認可なし**: 任意の `listId` にアクセス可能です
- **入力検証**: 最小限の検証のみ実装されています

### 推奨事項
1. **AWS Cognito** や **API Key** による認証の追加
2. **LINE User ID** ベースのアクセス制御
3. **入力値のサニタイゼーション** とバリデーション強化
4. **レート制限** の実装（API Gatewayのスロットリング設定）

## トラブルシューティング

### よくある問題

#### 1. CORSエラー
**症状**: ブラウザのコンソールに「CORS policy」エラーが表示される

**原因**:
- プリフライトリクエストが失敗している
- レスポンスヘッダーに `Access-Control-Allow-Origin` が含まれていない

**解決策**:
- Lambda関数が全てのレスポンスで `Access-Control-Allow-Origin: *` ヘッダーを返していることを確認
- API Gatewayの設定を確認

#### 2. 500エラーが頻発する
**症状**: 多くのリクエストが500エラーを返す

**原因**:
- DynamoDBテーブルが存在しない
- Lambda関数のIAMロールにDynamoDBへの権限がない
- 環境変数 `TABLE_NAME` が正しく設定されていない

**解決策**:
- CloudWatch Logsでエラーログを確認
- IAMロールの権限を確認
- 環境変数の設定を確認

#### 3. アイテムが取得できない
**症状**: GET リクエストで空配列が返される

**原因**:
- `listId` が一致していない（大文字小文字の違いなど）
- アイテムが実際に存在しない

**解決策**:
- CloudWatch Logsでリクエストパラメータを確認
- DynamoDB コンソールでテーブルの内容を直接確認

## 関連ドキュメント
- [バックエンド開発ガイド](./development-guide.md)
- [API仕様書](../api/api-spec.md)
- [データベース設計書](../infra/db-schema.md)
