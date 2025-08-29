// src/services/geminiService.ts
import type { GameTurn, GeminiResponse } from '../types';

export const DEFAULT_SYSTEM_INSTRUCTION = `Ти — майстер гри у текстовій пригодницькій грі в жанрі темного фентезі. Твоє завдання — створювати захоплюючу історію, реагуючи на дії гравця. Завжди відповідай українською мовою. Твій стиль має бути описовим, атмосферним і трохи таємничим. Ніколи не ламай характер. Завжди надавай відповідь у форматі JSON, що відповідає наданій схемі. Опис ситуації має бути не більше 3-4 речень. Варіанти дій мають бути короткими та спонукати до дії. Не звертайся до гравця на "ти" або "ви" у варіантах дій, використовуй інфінітиви (напр. "Піти далі", а не "Іди далі").`;

const generateFullPrompt = (history: GameTurn[], action: string): string => {
  const historyText = history
    .map(
      (turn) =>
        `Минула дія: ${turn.action}\nРезультат: ${turn.story}`
    )
    .join('\n\n');

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

export const getNextStorySegment = async (
  history: GameTurn[],
  action: string,
  systemInstruction: string = DEFAULT_SYSTEM_INSTRUCTION
): Promise<GeminiResponse> => {
  const prompt = generateFullPrompt(history, action);

  const res = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // схему більше НЕ шлемо — вона тепер на сервері
      history,
      action,
      systemInstruction,
      promptForServer: prompt, // явний prompt, щоб на сервері не будувати заново (але можна і там)
      mode: 'continue',        // явний режим
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Не вдалося отримати відповідь від ШІ. Спробуйте ще раз.');
  }

  // сервер завжди повертає валідний JSON-рядок
  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Від ШІ прийшов некоректний JSON.');
  }

  // мінімальна валідація на клієнті (сервер уже валідовує)
  if (
    !parsed ||
    typeof parsed.story !== 'string' ||
    !Array.isArray(parsed.choices)
  ) {
    throw new Error('Некоректна структура відповіді ШІ.');
  }

  // UI очікує рівно 3 варіанти
  if (parsed.choices.length !== 3) {
    parsed.choices = (parsed.choices as string[]).slice(0, 3);
    while (parsed.choices.length < 3) {
      parsed.choices.push('Зробити обачну паузу');
    }
  }

  return parsed as GeminiResponse;
};

export const generateInitialScenario = async (userPrompt?: string): Promise<string> => {
  const prompt = userPrompt
    ? `Згенеруй стартову умову для текстової гри, базуючись на цьому: "${userPrompt}". Відповідь має бути одним-двома реченнями, без жодних префіксів чи пояснень.`
    : `Придумай випадкову, цікаву та коротку стартову умову (1-2 речення) для текстової гри в жанрі темного фентезі. Відповідь має бути без жодних префіксів чи пояснень.`;

  const res = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, mode: 'seed' }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Не вдалося згенерувати сценарій. Спробуйте ще раз.');
  }

  return (await res.text()).trim();
};
