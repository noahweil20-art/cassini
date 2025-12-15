import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Initialize only if key exists to avoid immediate errors, handle gracefully in UI
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getCasinoHostResponse = async (userMessage: string, currentBalance: number): Promise<string> => {
  if (!ai) {
    return "Desculpe, meu cérebro de IA não está conectado (API Key ausente). Mas boa sorte no jogo!";
  }

  try {
    const model = "gemini-2.5-flash";
    const systemInstruction = `
      Você é o 'Pit Boss', um anfitrião de cassino carismático, elegante e engraçado.
      O nome do cassino é "Cassino Royal Mock".
      O usuário está jogando com dinheiro fictício.
      O saldo atual do usuário é $${currentBalance}.
      
      Se o usuário ganhou, celebre. Se perdeu, console-o de forma engraçada.
      Responda sempre em Português do Brasil.
      Mantenha as respostas curtas (máximo 2 frases).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
      }
    });

    return response.text || "Opa, não consegui ouvir você com todo esse barulho de fichas!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Estou tendo um momento de silêncio técnico. Tente novamente.";
  }
};
