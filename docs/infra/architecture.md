# インフラ構成図

本プロジェクトはAWS CDKを使用してデプロイされるサーバーレスアーキテクチャを採用しています。

```mermaid
graph TD
    User[ユーザー (ブラウザ)]
    
    subgraph Frontend Hosting
        CF[CloudFront]
        S3[S3 Bucket (Web Hosting)]
    end

    subgraph Backend API
        APIGW[API Gateway]
        Lambda[Lambda Function (Node.js)]
        DynamoDB[(DynamoDB Table)]
    end

    User -->|HTTPS| CF
    CF -->|Origin| S3
    
    User -->|API Request| APIGW
    APIGW -->|Proxy| Lambda
    Lambda -->|Read/Write| DynamoDB
```

## リソース詳細

### Frontend
- **S3 Bucket**: Reactアプリケーションの静的アセット (HTML, CSS, JS) をホスティング。
- **CloudFront**: コンテンツ配信ネットワーク (CDN)。HTTPSでのセキュアな配信とキャッシュを提供。

### Backend
- **API Gateway**: REST APIのエンドポイントを提供。CORS設定済み。
- **Lambda Function**: Node.jsランタイムで動作するバックエンドロジック。APIリクエストを処理し、DynamoDBへのCRUD操作を行う。
- **DynamoDB**: NoSQLデータベース。買い物リストのデータを永続化する。
