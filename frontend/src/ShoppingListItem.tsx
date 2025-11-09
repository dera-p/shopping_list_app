import React from 'react';
import { Item } from './types';

interface ShoppingListItemProps {
  item: Item;
  onToggleDone: (itemId: string, done: boolean) => void;
  onDeleteItem: (itemId: string) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({ item, onToggleDone, onDeleteItem }) => {
  return (
    <li className={`flex items-center p-2 border-b ${item.done ? 'text-gray-500 line-through' : ''}`}>
      <input
        type="checkbox"
        checked={item.done}
        onChange={() => onToggleDone(item.itemId, !item.done)}
        className="mr-2"
      />
      <span className="flex-grow">{item.text}</span>
      <button
        onClick={() => onDeleteItem(item.itemId)}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
      >
        Delete
      </button>
    </li>
  );
};

export default ShoppingListItem;
