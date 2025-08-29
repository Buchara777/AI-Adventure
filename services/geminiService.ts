import { GoogleGenAI, Type } from "@google/genai";
import type { GameTurn, GeminiResponse } from '../types';

// This is a workaround to get environment variables in a simple static setup.
// The user must create an `env.js` file at the root.

const model = 'gemini-2.5-flash';

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
  try {
    const response = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history,
        action,
        systemInstruction,
        model,
        schema
      }),
    });

    if (!response.ok) {
      throw new Error("Не вдалося отримати відповідь від ШІ. Спробуйте ще раз.");
    }

    const jsonString = await response.text();
    const parsedResponse = JSON.parse(jsonString) as GeminiResponse;

    return parsedResponse;

  } catch (error) {
    console.error("Error calling proxy API:", error);
    throw new Error("Не вдалося отримати відповідь від ШІ. Спробуйте ще раз.");
  }
};

export const generateInitialScenario = async (userPrompt?: string): Promise<string> => {
  try {
    const prompt = userPrompt
      ? `Згенеруй стартову умову для текстової гри, базуючись на цьому: "${userPrompt}". Відповідь має бути одним-двома реченнями, без жодних префіксів чи пояснень.`
      : `Придумай випадкову, цікаву та коротку стартову умову (1-2 речення) для текстової гри в жанрі темного фентезі. Відповідь має бути без жодних префіксів чи пояснень.`;

    const response = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt, // Ми передаємо prompt, щоб проксі знав, що це запит на генерацію сценарію
      }),
    });
  
    if (!response.ok) {
      throw new Error("Не вдалося отримати відповідь від ШІ. Спробуйте ще раз.");
    }

    const text = await response.text(); // Чекаємо на отримання тексту відповіді
    return text.trim();

  } catch (error) {
    console.error("Error calling proxy API:", error);
    throw new Error("Не вдалося отримати відповідь від ШІ. Спробуйте ще раз.");
  }
};
