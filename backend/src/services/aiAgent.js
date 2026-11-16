
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.AI_API_KEY?.trim();

if (!apiKey) {
  throw new Error("Falta la API key de Gemini.");
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    timeout: 120000,
  },
});

const MODEL = process.env.AI_MODEL || "gemini-3.8-flash";

export async function classifyComment(comment) {
  console.log("Enviando comentario a Gemini...");

  const prompt = `
Clasifica este comentario para un sistema de moderación.

Categorías:
- ok: comentario legítimo o crítica válida.
- spam: publicidad no solicitada o promoción engañosa.
- revisar: amenazas, insultos, datos personales o ambigüedad.

No clasifiques automáticamente como spam las críticas negativas.

Usuario: ${comment.usuario}
Comentario: ${comment.texto}
Reportes: ${comment.reportes}

Responde únicamente con JSON:
{
  "category": "ok, spam o revisar",
  "reason": "justificación breve en español"
}
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  console.log("Gemini respondió correctamente.");

  const text = response.text;

  if (!text) {
    throw new Error("Gemini devolvió una respuesta vacía.");
  }

  const result = JSON.parse(text);

  if (!["ok", "spam", "revisar"].includes(result.category)) {
    throw new Error("La categoría recibida no es válida.");
  }

  return {
    category: result.category,
    reason: result.reason,
  };
}
