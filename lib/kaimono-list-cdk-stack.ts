import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'


export class KaimonoListCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. 静的ウェブサイトホスティング用のS3バケットを作成
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `kaimono-list-frontend-${cdk.Stack.of(this).account}`, // ユニークなバケット名
      removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時にバケットも削除 (開発用、本番ではRETAINが推奨)
      autoDeleteObjects: true, // スタック削除時にバケット内のオブジェクトも削除 (開発用)
      publicReadAccess: false, // CloudFront経由でアクセスするため、直接パブリックアクセスは不要
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // S3バケットへの直接的なパブリックアクセスをブロック
    });

    // 2. CloudFront OAI (Origin Access Identity) を作成
    //    これにより、CloudFrontのみがS3バケットにアクセスできるようになる
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOAI');
    websiteBucket.grantRead(cloudfrontOAI); // OAIにS3バケットの読み取り権限を付与

    // 3. CloudFrontディストリビューションを作成
    const distribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
      defaultRootObject: 'index.html', // ルートパスにアクセスしたときに表示されるファイル
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: cloudfrontOAI, // OAIを使ってS3にアクセス
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // HTTPアクセスをHTTPSにリダイレクト
      },
      errorResponses: [
        {
          httpStatus: 403, // 403エラーを
          responseHttpStatus: 200, // 200 OKとして
          responsePagePath: '/index.html', // index.htmlにリダイレクト (SPA対応)
        },
        {
          httpStatus: 404, // 404エラーも
          responseHttpStatus: 200, // 200 OKとして
          responsePagePath: '/index.html', // index.htmlにリダイレクト (SPA対応)
        }
      ]
    });

    // 4. フロントエンドファイルをS3バケットにデプロイ
    new s3Deployment.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3Deployment.Source.asset('./frontend')], // './frontend' フォルダの内容をデプロイ
      destinationBucket: websiteBucket,
      distribution: distribution, // CloudFrontキャッシュを無効化
      distributionPaths: ['/*'], // 全パスのキャッシュを無効化
    });

    // 5. CloudFrontのURLをCDKの出力として表示
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: distribution.distributionDomainName,
      description: 'The CloudFront distribution URL',
    });

    // 6. DynamoDBテーブルを作成
    // 買い物リストのデータ構造を考慮してテーブルを設計します。
    // 例: リスト自体を識別するID (listId) と、リスト内の各項目を識別するID (itemId) を使います。
    // listId をパーティションキー、itemId をソートキーとすることで、
    // 特定のリストの全項目を効率的に取得できるようになります。
    const shoppingListTable = new dynamodb.Table(this, 'ShoppingListTable', {
      tableName: 'KaimonoList', // テーブル名
      partitionKey: { name: 'listId', type: dynamodb.AttributeType.STRING }, // パーティションキー
      sortKey: { name: 'itemId', type: dynamodb.AttributeType.STRING }, // ソートキー
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // オンデマンドキャパシティ (コスト効率が良い)
      removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時にテーブルも削除 (開発用、本番ではRETAIN推奨)
    });

    // 7. DynamoDBテーブル名をCDKの出力として表示
    new cdk.CfnOutput(this, 'DynamoDbTableName', {
      value: shoppingListTable.tableName,
      description: 'The name of the DynamoDB table for shopping lists',
    });

        // 8. Lambda関数を作成
    const apiLambda = new NodejsFunction(this, 'KaimonoListApiLambda', {
      functionName: 'KaimonoListApiHandler',
      entry: 'lambda/index.ts', // Lambda関数のソースコードのパス
      handler: 'handler', // Lambda関数でエクスポートしているハンドラー名
      runtime: lambda.Runtime.NODEJS_18_X, // Node.jsのランタイムバージョン
      environment: {
        TABLE_NAME: shoppingListTable.tableName, // 環境変数でDynamoDBテーブル名を渡す
      },
      bundling: { // esbuildの設定
        externalModules: ['@aws-sdk'], // AWS SDKはLambdaランタイムに含まれるのでバンドルしない
      },
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
    });

    // 9. Lambda関数にDynamoDBへの読み書き権限を付与
    shoppingListTable.grantReadWriteData(apiLambda);

    // 10. API Gatewayを作成
    const api = new apigw.RestApi(this, 'KaimonoListApi', {
      restApiName: 'KaimonoListService',
      description: 'API for Kaimono List App',
      deployOptions: {
        stageName: 'prod', // デプロイステージ名
      },
    });

    const optionsLambda = new NodejsFunction(this, 'OptionsLambda', {
      entry: 'lambda/options-handler.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
    });

    const optionsIntegration = new apigw.LambdaIntegration(optionsLambda);

    // 11. API GatewayのパスとLambda関数を紐付け
    // /lists/{listId}
    const listsResource = api.root.addResource('lists');
    listsResource.addMethod('OPTIONS', optionsIntegration);
    const listIdResource = listsResource.addResource('{listId}');
    listIdResource.addMethod('OPTIONS', optionsIntegration);
    listIdResource.addMethod('GET', new apigw.LambdaIntegration(apiLambda)); // GET /lists/{listId}

    // /lists/{listId}/items
    const itemsResource = listIdResource.addResource('items');
    itemsResource.addMethod('OPTIONS', optionsIntegration);
    itemsResource.addMethod('POST', new apigw.LambdaIntegration(apiLambda)); // POST /lists/{listId}/items

    // /lists/{listId}/items/{itemId}
    const itemIdResource = itemsResource.addResource('{itemId}');
    itemIdResource.addMethod('OPTIONS', optionsIntegration);
    itemIdResource.addMethod('GET', new apigw.LambdaIntegration(apiLambda)); // GET /lists/{listId}/items/{itemId}
    itemIdResource.addMethod('PUT', new apigw.LambdaIntegration(apiLambda)); // PUT /lists/{listId}/items/{itemId}
    itemIdResource.addMethod('DELETE', new apigw.LambdaIntegration(apiLambda)); // DELETE /lists/{listId}/items/{itemId}


    // 12. API GatewayのURLをCDKの出力として表示
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'The URL of the API Gateway',
    });
  }
}
