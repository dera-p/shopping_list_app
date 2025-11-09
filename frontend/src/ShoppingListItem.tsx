import React from 'react';
import { Item } from './types';

interface ShoppingListItemProps {
  item: Item;
  onToggleDone: (itemId: string, done: boolean) => void;
  onDeleteItem: (itemId: string) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({ item, onToggleDone, onDeleteItem }) => {
  return (
    <li className={`flex items-center p-2.5 border-b border-gray-200 ${item.done ? 'text-gray-400' : ''}`}>
      <input
        type="checkbox"
        checked={item.done}
        onChange={() => onToggleDone(item.itemId, !item.done)}
        className="mr-2.5"
      />
      <span className={`flex-grow ${item.done ? 'line-through' : ''}`}>{item.text}</span>
      <button
        onClick={() => onDeleteItem(item.itemId)}
        className="bg-[#dc3545] text-white border-none rounded py-1 px-2.5 cursor-pointer hover:bg-[#c82333]"
      >
        削除
      </button>
    </li>
  );
};

export default ShoppingListItem;
