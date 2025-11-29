import React from 'react';
import { Item } from './types';
import ShoppingListItem from './ShoppingListItem';

interface ShoppingListProps {
  items: Item[];
  onToggleDone: (itemId: string, done: boolean) => void;
  onDeleteItem: (itemId: string) => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ items, onToggleDone, onDeleteItem }) => {
  return (
    <ul className="space-y-3">
      {items.map(item => (
        <ShoppingListItem
          key={item.itemId}
          item={item}
          onToggleDone={onToggleDone}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </ul>
  );
};

export default ShoppingList;
