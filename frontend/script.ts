
const apiUrl = 'https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod';
const listId = 'default-list'; // 仮のリストID

const itemInput = document.getElementById('item-input') as HTMLInputElement;
const addButton = document.getElementById('add-button');
const itemList = document.getElementById('item-list');

// アイテムの型定義
interface Item {
  itemId: string;
  text: string;
  done: boolean;
}

// 画面ロード時にアイテムを読み込む
document.addEventListener('DOMContentLoaded', () => {
  loadItems();
});

// アイテムをサーバーから読み込んで表示
async function loadItems() {
  try {
    const response = await fetch(`${apiUrl}/lists/${listId}/items`);
    if (!response.ok) {
      throw new Error('Failed to fetch items.');
    }
    const items: Item[] = await response.json();
    renderItems(items);
  } catch (error) {
    console.error('Error loading items:', error);
  }
}

// アイテムリストを画面に描画
function renderItems(items: Item[]) {
  if (!itemList) return;
  itemList.innerHTML = ''; // リストをクリア
  items.forEach(item => {
    const li = document.createElement('li');
    li.dataset.itemId = item.itemId;
    if (item.done) {
      li.classList.add('done');
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.done;
    checkbox.addEventListener('change', () => toggleDone(item.itemId, !item.done));

    const itemText = document.createElement('span');
    itemText.className = 'item-text';
    itemText.textContent = item.text;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '削除';
    deleteButton.addEventListener('click', () => deleteItem(item.itemId));

    li.appendChild(checkbox);
    li.appendChild(itemText);
    li.appendChild(deleteButton);
    itemList.appendChild(li);
  });
}

// アイテムの追加
async function addItem() {
  const text = itemInput.value.trim();
  if (text === '') return;

  try {
    const response = await fetch(`${apiUrl}/lists/${listId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      throw new Error('Failed to add item.');
    }
    itemInput.value = ''; // 入力欄をクリア
    loadItems(); // リストを再読み込み
  } catch (error) {
    console.error('Error adding item:', error);
  }
}

// アイテムの削除
async function deleteItem(itemId: string) {
  try {
    const response = await fetch(`${apiUrl}/lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete item.');
    }
    loadItems(); // リストを再読み込み
  } catch (error) {
    console.error('Error deleting item:', error);
  }
}

// 完了状態の切り替え
async function toggleDone(itemId: string, done: boolean) {
  try {
    const response = await fetch(`${apiUrl}/lists/${listId}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ done }),
    });
    if (!response.ok) {
      throw new Error('Failed to update item.');
    }
    loadItems(); // リストを再読み込み
  } catch (error) {
    console.error('Error updating item:', error);
  }
}

// 追加ボタンのクリックイベント
addButton?.addEventListener('click', addItem);

// Enterキーでアイテム追加
itemInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addItem();
  }
});
