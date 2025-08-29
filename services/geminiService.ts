import type { GameTurn, GeminiResponse } from '../types';
import { Type } from "@google/genai";

// This is a workaround to get environment variables in a simple static setup.
// The user must create an `env.js` file at the root.

const schema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: 'Наступна частина історії українською мовою. Опиши оточення та події, що відбуваються. Має бути 2-4 речення.'
    },
    choices: {
      type: Type.ARRAY,
      description: 'Масив з трьох можливих, коротких і чітких варіантів дій для гравця українською мовою.',
      items: {
        type: Type.STRING
      }
    }
  },
  required: ['story', 'choices']
};

export const DEFAULT_SYSTEM_INSTRUCTION = `Ти — майстер гри у текстовій пригодницькій грі в жанрі темного фентезі. Твоє завдання — створювати захоплюючу історію, реагуючи на дії гравця. Завжди відповідай українською мовою. Твій стиль має бути описовим, атмосферним і трохи таємничим. Ніколи не ламай характер. Завжди надавай відповідь у форматі JSON, що відповідає наданій схемі. Опис ситуації має бути не більше 3-4 речень. Варіанти дій мають бути короткими та спонукати до дії. Не звертайся до гравця на "ти" або "ви" у варіантах дій, використовуй інфінітиви (напр. "Піти далі", а не "Іди далі").`;

const generateFullPrompt = (history: GameTurn[], action: string): string => {
  const historyText = history.map(turn => `Минула дія: ${turn.action}\nРезультат: ${turn.story}`).join('\n\n');
  return `
---
Історія до цього моменту:
${historyText.length > 0 ? historyText : 'Це початок пригоди.'}
---
Поточна дія гравця: ${action}
---
Продовжуй історію. Опиши, що відбувається далі, і запропонуй три можливі варіанти дій для гравця.
  `;
};

export const getNextStorySegment = async (history: GameTurn[], action: string, systemInstruction: string = DEFAULT_SYSTEM_INSTRUCTION): Promise<GeminiResponse> => {
  const response = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      history,
      action,
      systemInstruction,
      schema,
      model: 'gemini-1.5-flash-latest',
    }),
  });

  if (!response.ok) {
    throw new Error('Помилка сервера при генерації відповіді');
  }

  const text = await response.text();
  const parsed = JSON.parse(text);
  return parsed as GeminiResponse;
};

export const generateInitialScenario = async (userPrompt?: string): Promise<string> => {
  const response = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userPrompt,
      model: 'gemini-1.5-flash-latest',
    }),
  });

  if (!response.ok) {
    throw new Error('Помилка сервера при генерації стартового сценарію');
  }

  return await response.text();
};
