import React from 'react';
import { Item } from './types';

interface ShoppingListItemProps {
  item: Item;
  onToggleDone: (itemId: string, done: boolean) => void;
  onDeleteItem: (itemId: string) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({ item, onToggleDone, onDeleteItem }) => {
  return (
    <li className={`group flex items-center justify-between p-4 mb-3 bg-white rounded-xl border transition-all duration-200 ${item.done ? 'border-slate-100 bg-slate-50' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200'}`}>
      <div className="flex items-center gap-4 flex-grow cursor-pointer" onClick={() => onToggleDone(item.itemId, !item.done)}>
        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${item.done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
          {item.done && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={`text-lg transition-all duration-200 ${item.done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
          {item.text}
        </span>
      </div>
      {item.done && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteItem(item.itemId);
          }}
          className="ml-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
          aria-label="削除"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </li>
  );
};

export default ShoppingListItem;
