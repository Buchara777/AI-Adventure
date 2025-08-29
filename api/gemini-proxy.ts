import { GoogleGenAI } from "@google/genai";
import { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export default async function (request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).send('Method Not Allowed');
  }

  try {
    const { history, action, systemInstruction, schema, prompt, model } = request.body;
    
    // Перевіряємо, чи це запит на генерацію сценарію (через наявність `prompt`)
    if (prompt) {
      if (!model) {
          return response.status(400).send('Model is required for scenario generation.');
      }
      const aiModel = ai.getGenerativeModel({ model: model });
      const result = await aiModel.generateContent(prompt);
      return response.status(200).send(result.response.text);
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
    
    if (!model || !schema) {
        return response.status(400).send('Model and schema are required for story continuation.');
    }
    
    const aiModel = ai.getGenerativeModel({
      model: model,
      systemInstruction: systemInstruction,
    });
    
    const result = await aiModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8,
        topP: 0.95,
      },
    });
    
    return response.status(200).send(result.response.text);

  } catch (error) {
    console.error("Proxy function error:", error);
    return response.status(500).send('Server Error');
  }
}
