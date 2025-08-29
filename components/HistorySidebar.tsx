
import React, { useRef, useEffect } from 'react';
import type { GameTurn } from '../types';

interface HistorySidebarProps {
  history: GameTurn[];
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history }) => {
    const endOfHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

  return (
    <div className="w-full lg:w-1/3 bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg border border-slate-700 flex flex-col">
        <h2 className="text-xl font-bold text-amber-400 mb-4 border-b border-slate-600 pb-2">Ваша подорож</h2>
        <div className="overflow-y-auto flex-grow pr-2">
            {history.length === 0 && <p className="text-slate-400">Історія вашої пригоди з'явиться тут...</p>}
            {history.map((turn) => (
                <div key={turn.id} className="mb-6">
                    <p className="text-amber-500 font-semibold italic mb-1">› {turn.action}</p>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{turn.story}</p>
                </div>
            ))}
            <div ref={endOfHistoryRef} />
        </div>
    </div>
  );
};

export default HistorySidebar;
