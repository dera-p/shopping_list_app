# バックエンド開発ガイド

## 概要
本ドキュメントは、Kaimono List App（買い物リストアプリ）のバックエンド開発に関する技術詳細を記載しています。Lambda関数の実装詳細、エラーハンドリング、ロギング戦略、DynamoDBとのインタラクション方法について説明します。

## アーキテクチャ

### 技術スタック
- **ランタイム**: Node.js（TypeScript）
- **フレームワーク**: AWS Lambda
- **データベース**: Amazon DynamoDB
- **API**: Amazon API Gateway (REST API)
- **デプロイ**: AWS CDK

### 主要な依存ライブラリ
```json
{
  "@aws-sdk/client-dynamodb": "^3.901.0",
  "@aws-sdk/lib-dynamodb": "^3.901.0",
  "uuid": "^13.0.0"
}
```

## Lambda関数の構造

### ファイル構成
```
lambda/
└── index.ts    # メインハンドラー関数
```

### エントリーポイント
Lambda関数のエントリーポイントは `handler` 関数です。

```typescript
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
```

- **入力**: `APIGatewayProxyEvent` - API Gatewayから送信されるイベントオブジェクト
- **出力**: `APIGatewayProxyResult` - HTTPステータスコード、ヘッダー、レスポンスボディを含むオブジェクト

## 環境変数

### TABLE_NAME
DynamoDBテーブル名を指定する環境変数です。CDKスタックで自動的に設定されます。

```typescript
const TABLE_NAME = process.env.TABLE_NAME || 'KaimonoList';
```

デフォルト値として `'KaimonoList'` が設定されていますが、本番環境ではCDKによって動的に生成されたテーブル名が使用されます。

## DynamoDBとのインタラクション

### クライアント初期化
AWS SDK v3の `DynamoDBDocumentClient` を使用してDynamoDBとやり取りします。

```typescript
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
```

`DynamoDBDocumentClient` を使用することで、JavaScriptネイティブな型（オブジェクト、配列など）を直接使用でき、低レベルのDynamoDB形式への変換が不要になります。

### CRUD操作

#### Query（リスト全体の取得）
特定の `listId` に紐づく全てのアイテムを取得します。

```typescript
const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "listId = :listId",
    ExpressionAttributeValues: {
        ":listId": listId
    }
});
const { Items } = await docClient.send(command);
```

#### GetItem（単一アイテムの取得）
`listId` と `itemId` を指定して特定のアイテムを取得します。

```typescript
const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { listId, itemId }
});
const { Item } = await docClient.send(command);
```

#### PutItem（アイテムの追加）
新しいアイテムをテーブルに追加します。`itemId` はUUIDv4で自動生成されます。

```typescript
const newItem = {
    listId,
    itemId: uuidv4(),
    text: body.text,
    done: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: newItem,
});
await docClient.send(command);
```

#### UpdateItem（アイテムの更新）
既存のアイテムの属性を部分的に更新します。動的に `UpdateExpression` を構築することで、送信されたフィールドのみを更新します。

```typescript
const updateExpressionParts: string[] = [];
const expressionAttributeNames: { [key: string]: string } = {
    '#U': 'updatedAt',
};
const expressionAttributeValues: { [key: string]: any } = {};

if (body.text !== undefined) {
    updateExpressionParts.push('#T = :text');
    expressionAttributeValues[':text'] = body.text;
    expressionAttributeNames['#T'] = 'text';
}
if (body.done !== undefined) {
    updateExpressionParts.push('#D = :done');
    expressionAttributeValues[':done'] = body.done;
    expressionAttributeNames['#D'] = 'done';
}

updateExpressionParts.push('#U = :updatedAt');
expressionAttributeValues[':updatedAt'] = new Date().toISOString();

const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { listId, itemId },
    UpdateExpression: 'SET ' + updateExpressionParts.join(', '),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
});
const { Attributes } = await docClient.send(command);
```

**重要なポイント**:
- `ExpressionAttributeNames` を使用して予約語やスペシャル文字を含む属性名を扱います
- `ReturnValues: "ALL_NEW"` により更新後のアイテム全体が返されます
- `updatedAt` は常に現在時刻で更新されます

#### DeleteItem（アイテムの削除）
指定された `listId` と `itemId` のアイテムを削除します。

```typescript
const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { listId, itemId },
});
await docClient.send(command);
```

## ルーティングとパス解析

### パス構造
Lambda関数は以下のパス構造をサポートしています：

| パス | 説明 |
|------|------|
| `/lists/{listId}` | 特定リストの全アイテム取得 |
| `/lists/{listId}/items` | リストへのアイテム追加 |
| `/lists/{listId}/items/{itemId}` | 特定アイテムの取得/更新/削除 |

### パスパラメータの抽出
URLパスから `listId` と `itemId` を動的に抽出します：

```typescript
const pathParts = path.split('/').filter(part => part !== '');
let listId: string | undefined;
let itemId: string | undefined;

if (pathParts[0] === 'lists') {
    if (pathParts.length > 1) {
        listId = pathParts[1];
    }
    if (pathParts.length > 3 && pathParts[2] === 'items') {
        itemId = pathParts[3];
    }
}
```

この実装により、柔軟なパスマッチングが可能になります。

## エラーハンドリング

### エラーハンドリング戦略
全ての処理は `try-catch` ブロックで囲まれており、予期しないエラーを適切にキャッチします。

```typescript
try {
    // メイン処理
} catch (error: any) {
    console.error("Error:", error);
    return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: error.message || 'Internal Server Error' }),
    };
}
```

### HTTPステータスコード
Lambda関数は以下のHTTPステータスコードを返します：

| ステータスコード | 説明 | 使用ケース |
|------------------|------|------------|
| 200 OK | 成功（データ返却あり） | GET, PUT |
| 201 Created | リソース作成成功 | POST |
| 204 No Content | 成功（データ返却なし） | DELETE |
| 400 Bad Request | リクエストパラメータ不正 | 必須パラメータ欠如、不正なパス |
| 404 Not Found | リソースが見つからない | 存在しないアイテムへのGET、不正なパス |
| 405 Method Not Allowed | サポートされていないHTTPメソッド | GET/POST/PUT/DELETE/OPTIONS以外 |
| 500 Internal Server Error | サーバー内部エラー | 予期しない例外、DynamoDBエラー |

### エラーレスポンスフォーマット
エラー時は以下の形式のJSONを返します：

```json
{
    "message": "エラーの説明"
}
```

### バリデーション
現在の実装では以下のバリデーションを行っています：

1. **パスバリデーション**: `/lists` で始まるパス以外は404を返す
2. **パラメータバリデーション**: 必須の `listId` や `itemId` が欠けている場合は400を返す
3. **更新パラメータバリデーション**: PUT時に更新対象フィールドが何もない場合は400を返す

## ロギング戦略

### 標準出力ログ
CloudWatch Logsに記録されるログは `console.log` と `console.error` を使用します。

#### リクエストログ
全てのリクエストについて、イベント全体とヘッダーをログ出力します：

```typescript
console.log("Received event:", JSON.stringify(event, null, 2));
console.log("Headers:", JSON.stringify(event.headers, null, 2));
```

#### LINE User IDログ
カスタムヘッダー `X-Line-User-Id` が存在する場合、ユーザーIDをログに記録します：

```typescript
const lineUserId = event.headers?.['X-Line-User-Id'] || event.headers?.['x-line-user-id'];
if (lineUserId) {
    console.log("LINE User ID:", lineUserId);
}
```

これにより、フロントエンドからのリクエストをユーザーごとにトレースできます。

#### エラーログ
エラー発生時は詳細なエラー情報をログに記録します：

```typescript
console.error("Error:", error);
```

### ログの確認方法
AWS CloudWatch Logsでロググループ `/aws/lambda/<関数名>` を確認することで、Lambda関数のログを閲覧できます。

## CORS（Cross-Origin Resource Sharing）

### CORS設定
全てのエンドポイントで以下のCORSヘッダーを返します：

```typescript
headers: { 
    'Access-Control-Allow-Origin': '*' 
}
```

### プリフライトリクエスト
`OPTIONS` メソッドに対して、以下のヘッダーで応答します：

```typescript
return {
    statusCode: 200,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Line-User-Id',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: ''
};
```

これにより、ブラウザからのクロスオリジンAPIリクエストが許可されます。

## 開発・デバッグ

### ローカルテスト
Lambda関数をローカルでテストする方法：

1. **ユニットテスト**: Jest を使用してロジックをテストできます
2. **SAM CLI**: AWS SAM CLIを使用してローカルでLambda関数を起動できます
3. **モックイベント**: `APIGatewayProxyEvent` の形式に沿ったモックデータを作成してテストします

### デバッグのヒント

#### CloudWatch Logsの活用
- リクエスト全体をログ出力しているため、入力データを正確に確認できます
- エラーメッセージとスタックトレースから問題箇所を特定できます

#### DynamoDBの直接確認
AWS Management ConsoleまたはAWS CLIを使用して、DynamoDBテーブルの内容を直接確認できます：

```bash
aws dynamodb scan --table-name <テーブル名>
```

#### X-Rayトレーシング
より詳細なトレーシングが必要な場合は、AWS X-Rayを有効化してボトルネックやエラーの原因を特定できます。

## ベストプラクティス

### セキュリティ
1. **環境変数の使用**: 機密情報（テーブル名など）は環境変数で管理
2. **IAMロールの最小権限**: Lambda関数にはDynamoDBへの必要最小限の権限のみを付与
3. **入力検証**: リクエストボディやパラメータの妥当性を検証

### パフォーマンス
1. **DynamoDBクライアントの再利用**: グローバルスコープでクライアントを初期化し、複数の呼び出しで再利用
2. **Query vs Scan**: 可能な限り `Query` を使用し、`Scan` は避ける
3. **オンデマンド課金**: 負荷が不定期な場合はPAY_PER_REQUESTモードを使用

### コード品質
1. **TypeScript型定義**: AWS Lambda、DynamoDB、UUIDの型定義を活用
2. **エラーハンドリング**: 全ての非同期処理で適切なエラーハンドリングを実施
3. **ログ出力**: デバッグに必要な情報を適切にログに記録

## 今後の拡張

### 認証・認可
現在は認証機能がありませんが、将来的には以下の実装が考えられます：
- AWS Cognito との連携
- LINE User IDベースのアクセス制御
- API Keyによる認証

### バリデーション強化
- リクエストボディのスキーマ検証
- 入力値のサニタイゼーション
- 最大文字数制限などのビジネスルール検証

### 機能追加
- リスト全体の削除機能
- 複数リストの一覧取得機能
- リスト共有機能
- アイテムのソート・フィルタリング機能

## 関連ドキュメント
- [API仕様書](../api/api-spec.md)
- [データベース設計書](../infra/db-schema.md)
- [インフラ構成図](../infra/architecture.md)
- [Lambda関数詳細](./lambda-functions.md)
