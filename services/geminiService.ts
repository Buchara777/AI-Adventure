import { GoogleGenAI, Type } from "@google/genai";
import type { GameTurn, GeminiResponse } from '../types';

// This is a workaround to get environment variables in a simple static setup.
// The user must create an `env.js` file at the root.
declare global {
  interface Window {
    process: {
      env: {
        API_KEY?: string;
      };
    };
  }
}

const getApiKey = (): string => {
  const apiKey = window.process?.env?.API_KEY;
  if (!apiKey) {
    throw new Error(
      "API_KEY not found. Please create an `env.js` file in the root directory and add `window.process = { env: { API_KEY: 'YOUR_API_KEY' } };`"
    );
  }
  return apiKey;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const model = 'gemini-1.5-flash-latest';

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
    const prompt = generateFullPrompt(history, action);

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const jsonString = response.text.trim();
    const parsedResponse = JSON.parse(jsonString) as GeminiResponse;

    if (!parsedResponse.story || !Array.isArray(parsedResponse.choices) || parsedResponse.choices.length !== 3) {
      throw new Error("Invalid response structure from API.");
    }
    
    return parsedResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
       throw error;
    }
    throw new Error("Не вдалося отримати відповідь від ШІ. Спробуйте ще раз.");
  }
};

export const generateInitialScenario = async (userPrompt?: string): Promise<string> => {
  try {
    const prompt = userPrompt
      ? `Згенеруй стартову умову для текстової гри в жанрі темного фентезі, базуючись на цьому: "${userPrompt}". Відповідь має бути одним-двома реченнями, без жодних префіксів чи пояснень.`
      : `Придумай випадкову, цікаву та коротку стартову умову (1-2 речення) для текстової гри в жанрі темного фентезі. Відповідь має бути без жодних префіксів чи пояснень.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.9,
      },
    });
    
    return response.text.trim();

  } catch (error) {
    console.error("Error generating initial scenario:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
       throw error;
    }
    throw new Error("Не вдалося згенерувати сценарій. Спробуйте ще раз.");
  }
};
