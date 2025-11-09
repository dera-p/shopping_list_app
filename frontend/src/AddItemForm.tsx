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
    <form onSubmit={handleSubmit} className="flex gap-2.5 mb-5">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="買うものを入力..."
        className="flex-grow p-2.5 border border-gray-300 rounded text-base"
      />
      <button
        type="submit"
        className="p-2.5 px-5 bg-[#007bff] text-white border-none rounded cursor-pointer text-base hover:bg-[#0056b3]"
      >
        追加
      </button>
    </form>
  );
};

export default AddItemForm;
