import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid'; // itemId生成用

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// DynamoDBテーブル名 (環境変数で渡される想定)
const TABLE_NAME = process.env.TABLE_NAME || 'KaimonoList';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
        const path = event.path;
        const httpMethod = event.httpMethod;

        // URLパスからリストIDと項目IDを抽出
        const pathParts = path.split('/').filter(part => part !== '');
        let listId: string | undefined;
        let itemId: string | undefined;

        // パス構造: /lists (GET, POST)
        //            /lists/{listId} (GET, DELETE)
        //            /lists/{listId}/items (POST)
        //            /lists/{listId}/items/{itemId} (GET, PUT, DELETE)

        if (pathParts[0] === 'lists') {
            if (pathParts.length > 1) {
                listId = pathParts[1];
            }
            if (pathParts.length > 3 && pathParts[2] === 'items') {
                itemId = pathParts[3];
            }
        } else {
            return {
                statusCode: 404,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Not Found' }),
            };
        }

        switch (httpMethod) {
            // --- リスト全体または特定のリストの全項目を取得 ---
            case 'GET':
                if (listId && !itemId) {
                    // 特定のリストの全項目を取得
                    const command = new QueryCommand({
                        TableName: TABLE_NAME,
                        KeyConditionExpression: "listId = :listId",
                        ExpressionAttributeValues: {
                            ":listId": listId
                        }
                    });
                    const { Items } = await docClient.send(command);
                    return {
                        statusCode: 200,
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify(Items || []),
                    };
                } else if (!listId && !itemId) {
                    // 全てのリストを識別するAPIは今回は作成しない (listIdを固定するか、ユーザーIDを使う想定のため)
                    // ここは空で返すか、400エラーが適切
                    return {
                        statusCode: 400,
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({ message: 'Missing listId for GET operation' }),
                    };
                } else if (listId && itemId) {
                    // 特定の項目を取得 (GET /lists/{listId}/items/{itemId})
                    const command = new GetCommand({
                        TableName: TABLE_NAME,
                        Key: { listId, itemId }
                    });
                    const { Item } = await docClient.send(command);
                    if (Item) {
                        return {
                            statusCode: 200,
                            headers: { 'Access-Control-Allow-Origin': '*' },
                            body: JSON.stringify(Item),
                        };
                    } else {
                        return {
                            statusCode: 404,
                            headers: { 'Access-Control-Allow-Origin': '*' },
                            body: JSON.stringify({ message: 'Item not found' }),
                        };
                    }
                }
                break;

            // --- 項目をリストに追加 ---
            case 'POST':
                if (listId && pathParts[2] === 'items' && !itemId) {
                    const body = JSON.parse(event.body || '{}');
                    const newItem = {
                        listId,
                        itemId: uuidv4(), // 新しい項目IDを生成
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
                    return {
                        statusCode: 201,
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify(newItem),
                    };
                } else if (!listId) {
                     // リストの新規作成は今回対象外
                    return {
                        statusCode: 400,
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({ message: 'Missing listId for POST operation on items' }),
                    };
                }
                break;

            // --- 項目を更新 ---
            case 'PUT':
                if (listId && itemId) {
                    const body = JSON.parse(event.body || '{}');
                    const updateExpressionParts: string[] = [];
                    const expressionAttributeValues: { [key: string]: any } = {};

                    if (body.text !== undefined) {
                        updateExpressionParts.push('SET #T = :text');
                        expressionAttributeValues[':text'] = body.text;
                    }
                    if (body.done !== undefined) {
                        updateExpressionParts.push('SET #D = :done');
                        expressionAttributeValues[':done'] = body.done;
                    }

                    updateExpressionParts.push('SET #U = :updatedAt');
                    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

                    if (updateExpressionParts.length === 0) {
                        return {
                            statusCode: 400,
                            headers: { 'Access-Control-Allow-Origin': '*' },
                            body: JSON.stringify({ message: 'No update parameters provided' }),
                        };
                    }

                    const command = new UpdateCommand({
                        TableName: TABLE_NAME,
                        Key: { listId, itemId },
                        UpdateExpression: updateExpressionParts.join(', '),
                        ExpressionAttributeNames: {
                            '#T': 'text',
                            '#D': 'done',
                            '#U': 'updatedAt',
                        },
                        ExpressionAttributeValues: expressionAttributeValues,
                        ReturnValues: "ALL_NEW", // 更新後のアイテムを返す
                    });
                    const { Attributes } = await docClient.send(command);
                    return {
                        statusCode: 200,
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify(Attributes),
                    };
                }
                break;

            // --- 項目を削除 ---
            case 'DELETE':
                if (listId && itemId) {
                    const command = new DeleteCommand({
                        TableName: TABLE_NAME,
                        Key: { listId, itemId },
                    });
                    await docClient.send(command);
                    return {
                        statusCode: 204, // No Content
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: '',
                    };
                } else if (listId && !itemId) {
                    // リストID指定でリスト全体を削除 (今回は未実装、必要なら追加)
                    return {
                        statusCode: 400,
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({ message: 'Delete entire list not supported in this version' }),
                    };
                }
                break;

            default:
                return {
                    statusCode: 405,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ message: 'Method Not Allowed' }),
                };
        }
    } catch (error: any) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: error.message || 'Internal Server Error' }),
        };
    }

    // ここに到達しないはずだが、念のため
    return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Unhandled API path or method' }),
    };
};
