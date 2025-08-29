// api/gemini-proxy.ts
import { GoogleGenAI, Type } from '@google/genai';
import { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is not set.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL = 'gemini-1.5-flash-latest';

// Серверна схема — щоб не ламався enum Type під час JSON-перекидання з клієнта
const serverSchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description:
        'Наступна частина історії українською мовою. Опиши оточення та події, що відбуваються. Має бути 2-4 речення.',
    },
    choices: {
      type: Type.ARRAY,
      description:
        'Масив з трьох можливих, коротких і чітких варіантів дій для гравця українською мовою.',
      items: { type: Type.STRING },
    },
  },
  required: ['story', 'choices'],
} as const;

// Витягує чистий JSON навіть якщо прийшов у ```json ... ```
function extractJson(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  // Вирізаємо найширший JSON-блок
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).send('Method Not Allowed');
  }

  try {
    const { mode, prompt, promptForServer, history, action, systemInstruction } = request.body || {};

    // 1) Генерація стартового сценарію (простий текст)
    if (mode === 'seed') {
      if (!prompt || typeof prompt !== 'string') {
        return response.status(400).send('Bad Request: prompt is required for seed mode.');
      }

      const seedRes = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { temperature: 0.9 },
      });

      return response.status(200).send((seedRes.text || '').trim());
    }

    // 2) Продовження історії (JSON за схемою)
    if (mode === 'continue') {
      if (!action || typeof action !== 'string') {
        return response.status(400).send('Bad Request: action is required for continue mode.');
      }

      // Дозволяємо або власний prompt з клієнта, або будуємо тут
      const fullPrompt: string =
        typeof promptForServer === 'string' && promptForServer.trim().length > 0
          ? promptForServer
          : (() => {
              const historyText = Array.isArray(history)
                ? history
                    .map(
                      (turn: any) =>
                        `Минула дія: ${turn?.action}\nРезультат: ${turn?.story}`
                    )
                    .join('\n\n')
                : '';
              return `
---
Історія до цього моменту:
${historyText.length > 0 ? historyText : 'Це початок пригоди.'}
---
Поточна дія гравця: ${action}
---
Продовжуй історію. Опиши, що відбувається далі, і запропонуй три можливі варіанти дій для гравця.
              `;
            })();

      const result = await ai.models.generateContent({
        model: MODEL,
        contents: fullPrompt,
        config: {
          systemInstruction: typeof systemInstruction === 'string' ? systemInstruction : undefined,
          responseMimeType: 'application/json',
          responseSchema: serverSchema,
          temperature: 0.8,
          topP: 0.95,
        },
      });

      const raw = (result.text || '').trim();

      // Нормалізація/валідація JSON
      const jsonStr = extractJson(raw);
      if (!jsonStr) {
        console.error('No JSON detected in model output:', raw);
        return response.status(502).send('ШІ повернув не-JSON відповідь.');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        console.error('JSON parse error:', e, 'raw:', raw);
        return response.status(502).send('Помилка парсингу JSON від ШІ.');
      }

      // Мінімальна валідація та доведення до очікуваної форми
      if (typeof parsed.story !== 'string') {
        return response.status(502).send('JSON не містить коректного поля "story".');
      }
      if (!Array.isArray(parsed.choices)) parsed.choices = [];
      parsed.choices = (parsed.choices as string[]).filter((c) => typeof c === 'string').map((c) => c.trim());

      // Гарантуємо рівно 3 варіанти (безпечно для UI)
      if (parsed.choices.length > 3) parsed.choices = parsed.choices.slice(0, 3);
      while (parsed.choices.length < 3) {
        const fallbacks = ['Озирнутися довкола', 'Рухатися обережно вперед', 'Прислухатися до звуків'];
        parsed.choices.push(fallbacks[parsed.choices.length] || 'Зробити обачну паузу');
      }

      // Повертаємо САМЕ JSON-рядок, щоб клієнт робив JSON.parse як і раніше
      return response.status(200).send(JSON.stringify({ story: parsed.story.trim(), choices: parsed.choices }));
    }

    return response.status(400).send('Bad Request: unknown mode.');
  } catch (error: any) {
    console.error('Proxy function error:', error);
    return response.status(500).send(error?.message || 'Server Error');
  }
}
