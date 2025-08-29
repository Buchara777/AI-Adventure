import React, { useState, useCallback } from 'react';
import StoryDisplay from './components/StoryDisplay';
import ChoiceButton from './components/ChoiceButton';
import CustomInput from './components/CustomInput';
import HistorySidebar from './components/HistorySidebar';
import Loader from './components/Loader';
import MainMenu from './components/MainMenu';
import Settings from './components/Settings';
import { getNextStorySegment, DEFAULT_SYSTEM_INSTRUCTION } from './services/geminiService';
import type { GameTurn } from './types';

const App: React.FC = () => {
  // Game state
  const [history, setHistory] = useState<GameTurn[]>([]);
  const [currentStory, setCurrentStory] = useState<string>('');
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // App flow state
  const [gameState, setGameState] = useState<'menu' | 'settings' | 'game'>('menu');
  
  // Settings state
  const [startCondition, setStartCondition] = useState<string>('Ви прокидаєтесь у сирій, темній камері. Єдине джерело світла - невелике заґратоване вікно високо на стіні.');
  const [systemInstruction, setSystemInstruction] = useState<string>(DEFAULT_SYSTEM_INSTRUCTION);

  const processAction = useCallback(async (action: string, sysInstruction: string, currentHistory: GameTurn[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getNextStorySegment(currentHistory, action, sysInstruction);
      
      const newTurn: GameTurn = { id: currentHistory.length, action, story: response.story };
      setHistory([...currentHistory, newTurn]);

      setCurrentStory(response.story);
      setChoices(response.choices);
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStartGame = (settings: { startCondition: string; systemInstruction: string }) => {
    setStartCondition(settings.startCondition);
    setSystemInstruction(settings.systemInstruction);
    setGameState('game');
    processAction(settings.startCondition, settings.systemInstruction, []);
  };
  
  const handleAction = (action: string) => {
    if (!isLoading) {
      processAction(action, systemInstruction, history);
    }
  };

  const renderContent = () => {
    switch(gameState) {
      case 'menu':
        return (
          <MainMenu 
            onStartGame={() => handleStartGame({ startCondition, systemInstruction })}
            onGoToSettings={() => setGameState('settings')}
          />
        );
      case 'settings':
        return (
          <Settings 
            onBack={() => setGameState('menu')}
            onSaveAndStart={handleStartGame}
            initialStartCondition={startCondition}
            initialSystemInstruction={systemInstruction}
          />
        );
      case 'game':
        return (
          <div className="w-full max-w-7xl mx-auto animate-fade-in">
            <header className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-amber-400 tracking-wider">
                Текстова Пригода з AI
              </h1>
              <p className="text-slate-400 mt-2">Ваша історія, написана ШІ.</p>
            </header>
            
            <main className="flex flex-col lg:flex-row gap-8 relative">
              {isLoading && <Loader />}
              <div className="w-full lg:w-2/3 flex flex-col gap-4">
                <StoryDisplay text={currentStory} />
                {error && <div className="bg-red-900/70 border border-red-700 text-red-200 p-4 rounded-lg">{error}</div>}
                <div className="grid grid-cols-1 gap-3">
                  {choices.map((choice, index) => (
                    <ChoiceButton
                      key={index}
                      text={choice}
                      onClick={() => handleAction(choice)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                <CustomInput onSubmit={handleAction} disabled={isLoading} />
              </div>
              <HistorySidebar history={history} />
            </main>
          </div>
        );
      default:
        return <div>Помилка: Невідомий стан гри.</div>
    }
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      {renderContent()}
    </div>
  );
};

export default App;
