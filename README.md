# Kaimono List App (買い物リスト)

家族で共有できる、リアルタイム同期機能付きの買い物リストアプリケーションです。
AWS CDKを使用したサーバーレスアーキテクチャで構築されています。

## 特徴
- **リアルタイム同期**: 5秒ごとの自動更新により、家族間のリスト共有がスムーズ。
- **モダンなUI**: Tailwind CSS v4を採用した、使いやすく美しいデザイン。
- **サーバーレス**: AWS Lambda, API Gateway, DynamoDBを使用したスケーラブルなバックエンド。

## ドキュメント
詳細な設計書は `docs/` ディレクトリに格納されています。

- **[画面設計書](docs/design/screen-design.md)**: UIコンポーネントと仕様
- **[画面遷移図](docs/design/screen-transition.md)**: アプリケーションの状態遷移
- **[API仕様書](docs/api/api-spec.md)**: バックエンドAPIのエンドポイント定義
- **[インフラ構成図](docs/infra/architecture.md)**: AWSリソース構成
- **[データベース設計書](docs/infra/db-schema.md)**: DynamoDBテーブル設計

## 開発環境のセットアップ

### 前提条件
- Node.js (v18以上推奨)
- AWS CLI (設定済みであること)
- AWS CDK Toolkit

### インストール
```bash
# リポジトリのクローン
git clone <repository-url>
cd kaimono-list-cdk

# 依存関係のインストール
npm install
cd frontend
npm install
```

### ローカル開発
```bash
# フロントエンドの起動
cd frontend
npm run dev
```

### デプロイ
```bash
# プロジェクトルートで実行
cd ..
npm run build # フロントエンドのビルド
cdk deploy
```

## ライセンス
MIT
