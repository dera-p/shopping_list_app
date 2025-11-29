# データベース設計書

## 1. 概要
本アプリケーションでは、AWS DynamoDBをデータストアとして使用します。

- **テーブル名**: `KaimonoList` (CDKにより自動生成されるサフィックスが付く場合があります)
- **課金モード**: PAY_PER_REQUEST (オンデマンド)

## 2. キー設計
| キー種別 | 属性名 | データ型 | 説明 |
| :--- | :--- | :--- | :--- |
| **Partition Key** | `listId` | String | リストを識別するID (例: `myFamilyList`)。リスト単位でデータをパーティショニングします。 |
| **Sort Key** | `itemId` | String | アイテムを一意に識別するUUID。リスト内でアイテムを並べ替えるために使用します。 |

## 3. 属性一覧
| 属性名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `text` | String | 買い物アイテムの内容 (例: "牛乳") |
| `done` | Boolean | 完了フラグ (`true`: 完了, `false`: 未完了) |
| `createdAt` | String | 作成日時 (ISO 8601形式) |
| `updatedAt` | String | 更新日時 (ISO 8601形式) |

## 4. アクセスパターン
| 操作 | キー条件 | 説明 |
| :--- | :--- | :--- |
| **Get List** | `listId = :listId` | 特定のリストに含まれる全アイテムを取得 (Query) |
| **Get Item** | `listId = :listId` AND `itemId = :itemId` | 特定のアイテムを取得 (GetItem) |
| **Add Item** | - | 新しいアイテムを追加 (PutItem) |
| **Update Item** | `listId = :listId` AND `itemId = :itemId` | アイテムの属性 (`text`, `done`) を更新 (UpdateItem) |
| **Delete Item** | `listId = :listId` AND `itemId = :itemId` | アイテムを削除 (DeleteItem) |
