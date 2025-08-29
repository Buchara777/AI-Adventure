import { GoogleGenAI } from "@google/genai";
import { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

export default async function (request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).send('Method Not Allowed');
  }

  try {
    const { history, action, systemInstruction, schema, prompt } = request.body;

    // Перевіряємо, чи це запит на генерацію сценарію (через наявність `prompt`)
    if (prompt) {
      const geminiResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          temperature: 0.9,
        },
      });
      return response.status(200).send(geminiResponse.text.trim());
    }

    // Якщо це не запит на сценарій, обробляємо як продовження історії
    const generateFullPrompt = (history: any[], action: string): string => {
      const historyText = history.map((turn: any) => `Минула дія: ${turn.action}\nРезультат: ${turn.story}`).join('\n\n');
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
    
    const fullPrompt = generateFullPrompt(history, action);
    
    const geminiResponse = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const jsonText = geminiResponse.text.trim();
    return response.status(200).send(jsonText);

  } catch (error) {
    console.error("Proxy function error:", error);
    return response.status(500).send('Server Error');
  }
}