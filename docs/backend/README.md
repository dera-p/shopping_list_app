# バックエンドドキュメント

このディレクトリには、Kaimono List App（買い物リストアプリ）のバックエンド実装に関するドキュメントが含まれています。

## ドキュメント一覧

### [バックエンド開発ガイド](./development-guide.md)
Lambda関数の実装詳細、エラーハンドリング、ロギング戦略などの開発者向けガイド

**内容**:
- アーキテクチャと技術スタック
- Lambda関数の構造
- DynamoDBとのインタラクション
- エラーハンドリング戦略
- ロギング戦略
- CORS設定
- 開発・デバッグ方法
- ベストプラクティス

**対象者**: バックエンド開発者、メンテナー

### [Lambda関数詳細](./lambda-functions.md)
各エンドポイントの詳細な動作説明、リクエスト/レスポンス形式、エラーケース

**内容**:
- 各エンドポイントの詳細仕様
- リクエスト/レスポンス例
- エラーケースとハンドリング
- DynamoDB操作の詳細
- パフォーマンス特性
- セキュリティ考慮事項
- トラブルシューティング

**対象者**: API利用者、バックエンド開発者、フロントエンド開発者

## 関連ドキュメント

### API仕様
- [API仕様書](../api/api-spec.md) - エンドポイント一覧とAPIの使い方

### インフラ
- [インフラ構成図](../infra/architecture.md) - システムアーキテクチャの概要
- [データベース設計書](../infra/db-schema.md) - DynamoDBテーブル設計

### デザイン
- [画面設計](../design/screen-design.md) - フロントエンドの画面設計
- [画面遷移図](../design/screen-transition.md) - 画面遷移フロー

## 開発フロー

### 1. まず読むべきドキュメント
新規参画者は以下の順序でドキュメントを読むことを推奨します：

1. [インフラ構成図](../infra/architecture.md) - システム全体像の把握
2. [API仕様書](../api/api-spec.md) - APIエンドポイントの理解
3. [バックエンド開発ガイド](./development-guide.md) - 実装詳細の理解
4. [データベース設計書](../infra/db-schema.md) - データモデルの理解

### 2. 機能追加・変更時
機能を追加または変更する際は、以下のドキュメントを更新してください：

- Lambda関数の変更 → [バックエンド開発ガイド](./development-guide.md)、[Lambda関数詳細](./lambda-functions.md)
- エンドポイントの追加・変更 → [API仕様書](../api/api-spec.md)、[Lambda関数詳細](./lambda-functions.md)
- データモデルの変更 → [データベース設計書](../infra/db-schema.md)

### 3. トラブルシューティング
問題が発生した場合は、[Lambda関数詳細](./lambda-functions.md)の「トラブルシューティング」セクションを参照してください。

## 技術スタック概要

| カテゴリ | 技術 | 説明 |
|---------|------|------|
| **ランタイム** | Node.js (TypeScript) | Lambda関数の実行環境 |
| **データベース** | Amazon DynamoDB | NoSQLデータベース |
| **API** | Amazon API Gateway | REST APIエンドポイント |
| **デプロイ** | AWS CDK | インフラストラクチャコード |
| **AWS SDK** | @aws-sdk/client-dynamodb<br>@aws-sdk/lib-dynamodb | DynamoDB操作（v3） |
| **ユーティリティ** | uuid | アイテムID生成 |

## コード構成

```
/home/runner/work/shopping_list_app/shopping_list_app/
├── lambda/
│   └── index.ts              # Lambda関数のメインハンドラー
├── lib/
│   └── kaimono-list-cdk-stack.ts  # CDKスタック定義
├── docs/
│   ├── api/
│   │   └── api-spec.md       # API仕様書
│   ├── backend/
│   │   ├── README.md         # このファイル
│   │   ├── development-guide.md  # 開発ガイド
│   │   └── lambda-functions.md   # Lambda関数詳細
│   └── infra/
│       ├── architecture.md   # インフラ構成図
│       └── db-schema.md      # DB設計書
└── package.json              # 依存関係定義
```

## よくある質問（FAQ）

### Q1. Lambda関数をローカルでテストするには？
A1. SAM CLIを使用してローカルでLambda関数を起動できます。詳細は[バックエンド開発ガイド](./development-guide.md)の「開発・デバッグ」セクションを参照してください。

### Q2. DynamoDBのテーブル名はどこで確認できますか？
A2. 環境変数 `TABLE_NAME` に設定されています。CloudFormationスタックの出力、またはLambda関数のコンソールで確認できます。

### Q3. CORSエラーが発生します
A3. Lambda関数は全てのレスポンスで `Access-Control-Allow-Origin: *` ヘッダーを返しています。詳細なトラブルシューティングは[Lambda関数詳細](./lambda-functions.md)を参照してください。

### Q4. 認証機能はありますか？
A4. 現在、認証機能は実装されていません。将来的にAWS CognitoまたはLINE User IDベースの認証を追加する予定です。

### Q5. アイテムのソート順は？
A5. DynamoDBの仕様により、アイテムは `itemId`（ソートキー）順に返されます。UUIDのため、実質的にはランダムな順序になります。

## フィードバック

ドキュメントに不明瞭な点や誤りがある場合は、イシューを作成するか、プルリクエストを送信してください。
