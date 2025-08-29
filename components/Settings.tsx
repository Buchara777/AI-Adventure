import React, { useState } from 'react';
import { generateInitialScenario } from '../services/geminiService';

interface SettingsProps {
  onBack: () => void;
  onSaveAndStart: (settings: { startCondition: string; systemInstruction: string }) => void;
  initialStartCondition: string;
  initialSystemInstruction: string;
}

const Settings: React.FC<SettingsProps> = ({ onBack, onSaveAndStart, initialStartCondition, initialSystemInstruction }) => {
  const [startCondition, setStartCondition] = useState(initialStartCondition);
  const [systemInstruction, setSystemInstruction] = useState(initialSystemInstruction);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRandomize = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const prompt = startCondition.trim().length > 0 ? startCondition : undefined;
      const newScenario = await generateInitialScenario(prompt);
      setStartCondition(newScenario);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStart = () => {
    if (startCondition.trim() && systemInstruction.trim()) {
      onSaveAndStart({ startCondition: startCondition.trim(), systemInstruction: systemInstruction.trim() });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-screen animate-fade-in">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-amber-400 tracking-wider">
          Налаштування гри
        </h1>
        <p className="text-slate-400 mt-2">Налаштуйте свою пригоду.</p>
      </header>
      
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-lg border border-slate-700 flex flex-col gap-6">
        <div>
          <label htmlFor="start-condition" className="text-slate-300 text-lg font-semibold mb-2 block">
            Стартова умова
          </label>
          <p className="text-slate-400 text-sm mb-3">Опишіть, з чого почнеться ваша історія. Або згенеруйте випадкову.</p>
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <textarea
              id="start-condition"
              value={startCondition}
              onChange={(e) => setStartCondition(e.target.value)}
              placeholder="Наприклад: Ви прокидаєтесь у темній печері без спогадів..."
              rows={3}
              className="flex-grow w-full bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
            />
            <button
              onClick={handleRandomize}
              disabled={isGenerating}
              className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-wait"
            >
              {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              ) : (
                'Згенерувати випадково'
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="system-instruction" className="text-slate-300 text-lg font-semibold mb-2 block">
            Інструкції для ШІ (Майстра Гри)
          </label>
          <p className="text-slate-400 text-sm mb-3">Тут ви можете змінити поведінку ШІ. Для досвідчених гравців.</p>
          <textarea
            id="system-instruction"
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            rows={8}
            className="w-full bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
          />
        </div>
        
        {error && <div className="bg-red-900/70 border border-red-700 text-red-200 p-3 rounded-lg text-sm">{error}</div>}
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
           <button
            onClick={onBack}
            className="w-full sm:w-1/2 text-center px-6 py-3 bg-slate-700/80 border border-slate-600 rounded-lg text-slate-200 font-bold hover:bg-slate-600/80 hover:border-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Назад до меню
          </button>
          <button
            onClick={handleStart}
            disabled={!startCondition.trim() || !systemInstruction.trim()}
            className="w-full sm:w-1/2 text-center px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Зберегти і почати гру
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
