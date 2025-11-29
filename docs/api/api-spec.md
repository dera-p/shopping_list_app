# API仕様書

## 概要
買い物リストアプリケーションのバックエンドAPI。AWS Lambda + API Gatewayで構築されている。

- **Base URL**: `https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod` (環境により異なる)

## エンドポイント一覧

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

### 4. アイテム削除
リストからアイテムを削除する。

- **Method**: `DELETE`
- **Path**: `/lists/{listId}/items/{itemId}`
- **Parameters**:
    - `listId` (Path, Required): リストの識別子
    - `itemId` (Path, Required): アイテムの識別子
- **Response**:
    - **204 No Content**: 成功 (ボディなし)
