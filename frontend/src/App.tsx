import React, { useState, useEffect } from 'react';
import ShoppingList from './ShoppingList';
import AddItemForm from './AddItemForm';
import { Item } from './types';

import liff from '@line/liff';

const apiUrl = 'https://r4qdrukhog.execute-api.ap-northeast-1.amazonaws.com/prod';
const listId = 'myFamilyList';

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [lineUserId, setLineUserId] = useState<string>('');
  const [liffError, setLiffError] = useState<string>('');

  useEffect(() => {
    // LIFF Initialization
    const initLiff = async () => {
      try {
        // Replace with your actual LIFF ID
        const liffId = import.meta.env.VITE_LIFF_ID || 'YOUR_LIFF_ID';
        await liff.init({ liffId });

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          console.log('LINE ID:', profile.userId);
          setLineUserId(profile.userId);
        } else {
          // Optional: Auto login or show login button
          // liff.login(); 
          console.log('LINE ID: Not Logged In');
          setLineUserId('');
        }
      } catch (error) {
        console.error('LIFF Initialization failed', error);
        setLiffError('LIFF Init Failed');
      }
    };

    initLiff();
  }, []);

  useEffect(() => {
    loadItems();
    const intervalId = setInterval(loadItems, 5000);
    return () => clearInterval(intervalId);
  }, [lineUserId]);

  const loadItems = async () => {
    try {
      const headers: HeadersInit = {};
      if (lineUserId) {
        headers['X-Line-User-Id'] = lineUserId;
      }
      const response = await fetch(`${apiUrl}/lists/${listId}`, { headers });
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
        headers: {
          'Content-Type': 'application/json',
          ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
        },
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
        headers: {
          ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
        }
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
        headers: {
          'Content-Type': 'application/json',
          ...(lineUserId ? { 'X-Line-User-Id': lineUserId } : {})
        },
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
          <h1 className="text-3xl font-extrabold text-center text-slate-900 mb-2 tracking-tight">
            買い物リスト
          </h1>
          <p className="text-center text-slate-500 text-sm mb-8 break-all">
            {liffError && (
              <span className="text-red-500">{liffError}</span>
            )}
          </p>
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
