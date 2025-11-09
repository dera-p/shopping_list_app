import React, { useState, useEffect } from 'react';
import ShoppingList from './ShoppingList';
import AddItemForm from './AddItemForm';
import { Item } from './types';

const apiUrl = 'https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod';
const listId = 'default-list';

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await fetch(`${apiUrl}/lists/${listId}/items`);
      if (!response.ok) throw new Error('Failed to fetch items.');
      const loadedItems: Item[] = await response.json();
      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const addItem = async (text: string) => {
    try {
      const response = await fetch(`${apiUrl}/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error('Failed to add item.');
      loadItems();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`${apiUrl}/lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete item.');
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const toggleDone = async (itemId: string, done: boolean) => {
    try {
      const response = await fetch(`${apiUrl}/lists/${listId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      });
      if (!response.ok) throw new Error('Failed to update item.');
      loadItems();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen p-5">
      <div className="max-w-xl mx-auto bg-white p-5 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
        <h1 className="text-2xl font-bold text-center my-4 text-[#1d1d1f]">買い物リスト</h1>
        <AddItemForm onAddItem={addItem} />
        <ShoppingList items={items} onToggleDone={toggleDone} onDeleteItem={deleteItem} />
      </div>
    </div>
  );
};

export default App;
