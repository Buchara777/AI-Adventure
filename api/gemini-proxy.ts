import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY не знайдений у середовищі!');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { prompt, history, action, systemInstruction, schema, model } = req.body;
    const selectedModel = model || 'gemini-1.5-flash-latest';
    const modelInstance = genAI.getGenerativeModel({ model: selectedModel });

    let content: any = {};

    if (prompt) {
      // Генерація тексту для початкового сценарію
      const result = await modelInstance.generateContent(prompt);
      content = result.response.text();
    } else if (history && action) {
      // Генерація наступного кроку історії
      const historyText = history
        .map((turn: any, index: number) => `Крок ${index + 1} — Дія: ${turn.action}; Історія: ${turn.story}`)
        .join('\n');

      const fullPrompt = `
${systemInstruction}
Історія до цього моменту:
${historyText}

Дія гравця:
${action}
`;

      const result = await modelInstance.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: schema ? { responseMimeType: 'application/json', responseSchema: schema } : undefined,
      });

      content = schema ? JSON.parse(result.response.text()) : result.response.text();
    } else {
      return res.status(400).send('Некоректний запит: не вказано ні prompt, ні history/action.');
    }

    res.status(200).send(content);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    res.status(500).send(error?.message || 'Внутрішня помилка сервера');
  }
}
