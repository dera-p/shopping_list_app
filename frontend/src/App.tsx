import React, { useState, useEffect } from 'react';
import ShoppingList from './ShoppingList';
import AddItemForm from './AddItemForm';
import { Item } from './types';

const apiUrl = 'https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod';
const listId = 'myFamilyList';

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await fetch(`${apiUrl}/lists/${listId}`);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/50">
        <div className="px-6 py-8 sm:p-10">
          <h1 className="text-3xl font-extrabold text-center text-slate-900 mb-8 tracking-tight">
            買い物リスト
          </h1>
          <div className="space-y-8">
            <AddItemForm onAddItem={addItem} />
            <div className="mt-8">
              <ShoppingList items={items} onToggleDone={toggleDone} onDeleteItem={deleteItem} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
