
import React, { useState } from 'react';

interface CustomInputProps {
  onSubmit: (action: string) => void;
  disabled: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({ onSubmit, disabled }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label htmlFor="custom-action" className="text-slate-400 text-sm mb-2 block">
        Або введіть власну дію:
      </label>
      <div className="flex items-center gap-2">
        <input
          id="custom-action"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Що ви робите?"
          disabled={disabled}
          className="flex-grow bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !inputValue.trim()}
          className="px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Надіслати
        </button>
      </div>
    </form>
  );
};

export default CustomInput;
