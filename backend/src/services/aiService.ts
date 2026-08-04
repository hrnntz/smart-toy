import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================
// 1. CHAT CON JUGUETES CON HISTORIAL (toyController)
// ============================================
export const getAIResponse = async (
  message: string,
  toyName: string,
  personality?: string | null,
  context?: string | null,
  history: ChatHistoryMessage[] = []
): Promise<string> => {
  try {
    const systemPrompt = `
Eres ${toyName}, un juguete inteligente y amigable para niños.
${personality ? `Tu personalidad es: ${personality}.` : 'Eres amable, divertido y siempre ayudas a los niños.'}
${context ? `Contexto adicional: ${context}.` : ''}
Responde de manera breve, cálida y adecuada para un niño de 6 años. Usa un tono alegre y sencillo.
Recuerda lo conversado anteriormente en el chat para mantener la continuidad.
Nunca uses lenguaje técnico ni complejo. Siempre responde en español.
`;

    const formattedHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: message },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 300,
    });

    return chatCompletion.choices[0]?.message?.content || 'No pude entender eso.';
  } catch (error) {
    console.error('❌ Error en Groq chat con historial:', error);
    return 'Lo siento, tuve un problema. Intenta de nuevo.';
  }
};

// ============================================
// 2. GENERAR HISTORIA CON IMAGEN (storyController)
// ============================================
export const generateStoryWithImage = async (
  tema: string,
  duracion: string,
  personajes?: string,
  enseñanza?: string
): Promise<{ titulo: string; contenido: string; imagen: string }> => {
  try {
    const prompt = `
Crea una historia infantil corta basada en los siguientes datos:
- Tema: ${tema}
- Duración aproximada: ${duracion}
${personajes ? `- Personajes sugeridos: ${personajes}` : ''}
${enseñanza ? `- Enseñanza o mensaje: ${enseñanza}` : ''}

La historia debe tener un título llamativo y un contenido de aproximadamente 200-300 palabras.
Formato de respuesta:
TÍTULO: <título>
---
<contenido de la historia>
`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: 800,
    });

    const fullText = response.choices[0]?.message?.content || '';
    const [tituloRaw, ...contenidoParts] = fullText.split('---');
    const titulo = tituloRaw.replace('TÍTULO:', '').trim() || 'Historia generada';
    const contenido = contenidoParts.join('---').trim() || fullText;

    const imagePrompt = encodeURIComponent(
      `ilustración infantil de ${tema}, cuento, dibujo colorido, estilo cuento infantil, personajes lindos`
    );
    const imagen = `https://image.pollinations.ai/prompt/${imagePrompt}?width=512&height=512&seed=${encodeURIComponent(tema)}`;

    return { titulo, contenido, imagen };
  } catch (error) {
    console.error('❌ Error en generateStoryWithImage:', error);
    throw new Error('Error al generar la historia con IA');
  }
};

// ============================================
// 3. GENERAR PREGUNTAS DE MINIJUEGOS CON IA
// ============================================
export interface GameQuestion {
  question: string;
  options: string[];
  answer: number;
}

export const generateGameQuestions = async (
  gameName: string,
  category: string,
  count = 10
): Promise<GameQuestion[]> => {
  try {
    const prompt = `
Genera exactamente ${count} preguntas de opción múltiple divertidas y educativas para niños de 5 a 10 años.
Juego: "${gameName}"
Categoría: "${category}"

DEBES responder ÚNICAMENTE en formato JSON plano (un arreglo de objetos), SIN bloques de markdown (\`\`\`json ... \`\`\`), SIN texto antes ni después.
Estructura exacta por objeto:
{
  "question": "Texto de la pregunta corta",
  "options": ["Opción 1", "Opción 2", "Opción 3"],
  "answer": 0
}
Donde "answer" es el índice numérico (0, 1 o 2) de la opción correcta dentro de "options".
`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '[]';
    // Limpiar markdown si viniera formateado
    const cleanedJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions: GameQuestion[] = JSON.parse(cleanedJson);

    return questions.slice(0, count);
  } catch (error) {
    console.error('❌ Error en generateGameQuestions:', error);
    // Fallback por defecto si falla la llamada
    return [
      { question: '¿Cuál de estos es un animal doméstico?', options: ['Perro', 'León', 'Tiburón'], answer: 0 },
      { question: '¿Cuánto es 2 + 2?', options: ['3', '4', '5'], answer: 1 },
      { question: '¿De qué color es el cielo soleado?', options: ['Azul', 'Rojo', 'Verde'], answer: 0 },
    ];
  }
};