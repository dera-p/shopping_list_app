import React, { useState } from 'react';

interface AddItemFormProps {
  onAddItem: (text: string) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItem }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddItem(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex shadow-sm rounded-lg overflow-hidden ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-200">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="新しいアイテムを追加..."
          className="flex-grow px-4 py-3 text-slate-700 placeholder-slate-400 bg-white border-none outline-none focus:ring-0"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          追加
        </button>
      </div>
    </form>
  );
};

export default AddItemForm;
