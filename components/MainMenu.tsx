import React from 'react';

interface MainMenuProps {
  onStartGame: () => void;
  onGoToSettings: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onGoToSettings }) => {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen animate-fade-in">
      <header className="text-center mb-12">
        <h1 className="text-5xl sm:text-7xl font-bold text-amber-400 tracking-wider">
          Текстова Пригода з AI
        </h1>
        <p className="text-slate-400 mt-4 text-lg">Ваша історія, написана ШІ.</p>
      </header>
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <button
          onClick={onStartGame}
          className="w-full text-center px-8 py-4 bg-amber-600 text-white font-bold text-xl rounded-lg hover:bg-amber-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Почати гру
        </button>
        <button
          onClick={onGoToSettings}
          className="w-full text-center px-8 py-4 bg-slate-700/80 border border-slate-600 rounded-lg text-slate-200 font-bold text-xl hover:bg-slate-600/80 hover:border-slate-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Налаштування
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
