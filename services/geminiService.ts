import { GameTurn } from '@/types/game';
import { GeminiResponse } from '@/types/gemini';

const DEFAULT_SYSTEM_INSTRUCTION = `
Ти — генератор інтерактивних історій. Відповідай у форматі JSON згідно зі схемою.
Не додавай нічого зайвого, лише правильний JSON.
`;

export const getNextStorySegment = async (
  history: GameTurn[],
  action: string,
  systemInstruction: string = DEFAULT_SYSTEM_INSTRUCTION
): Promise<GeminiResponse> => {
  const response = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      history,
      action,
      systemInstruction,
      schema: {
        type: 'object',
        properties: {
          storySegment: { type: 'string' },
          options: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['storySegment', 'options'],
      },
      model: 'gemini-1.5-flash-latest',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Помилка сервера: ${errorText}`);
  }

  const result = await response.json();
  return result as GeminiResponse;
};

export const generateInitialScenario = async (
  userPrompt?: string
): Promise<string> => {
  const response = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userPrompt || 'Створіть короткий вступ до інтерактивної історії.',
      model: 'gemini-1.5-flash-latest',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Помилка сервера: ${errorText}`);
  }

  return await response.text();
};
