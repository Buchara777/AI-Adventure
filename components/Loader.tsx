
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-t-amber-500 border-r-amber-500/50 border-b-amber-500/50 border-l-amber-500/50 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-amber-300 text-lg">Твоя доля кується...</p>
      </div>
    </div>
  );
};

export default Loader;
