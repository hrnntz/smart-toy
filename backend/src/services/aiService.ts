import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

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
Responde de manera breve (máximo 2 oraciones), cálida y adecuada para un niño de 6 años. Usa un tono alegre y sencillo.
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
      max_tokens: 200,
    });

    return chatCompletion.choices[0]?.message?.content || 'No pude entender eso.';
  } catch (error) {
    console.error('❌ Error en Groq chat con historial:', error);
    return 'Lo siento, tuve un problema. Intenta de nuevo.';
  }
};

// ============================================
// 2. RECONOCIMIENTO DE VOZ STT CON GROQ WHISPER
// ============================================
export const transcribeAudioWithWhisper = async (filePath: string): Promise<string> => {
  let targetPath = filePath;
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo de audio no existe');
    }

    // Si el archivo no tiene extensión .m4a, renombrarlo para que Groq valide el tipo
    if (!path.extname(filePath)) {
      targetPath = `${filePath}.m4a`;
      fs.renameSync(filePath, targetPath);
    }

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(targetPath),
      model: 'whisper-large-v3',
      language: 'es',
      response_format: 'json',
    });

    return transcription.text || '';
  } catch (error) {
    console.error('❌ Error en Groq Whisper STT:', error);
    return '';
  }
};

// ============================================
// 3. GENERAR PREGUNTAS DE MINIJUEGOS CON DIFICULTAD E EXPLICACIÓN
// ============================================
export interface GameQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const generateGameQuestions = async (
  gameName: string,
  category: string,
  difficulty = 'Medio',
  count = 10
): Promise<GameQuestion[]> => {
  try {
    const prompt = `
Genera exactamente ${count} preguntas de opción múltiple divertidas y educativas para niños.
Juego: "${gameName}"
Categoría: "${category}"
Nivel de Dificultad: "${difficulty}" (Adapta la complejidad del vocabulario y los cálculos según esta dificultad).

DEBES responder ÚNICAMENTE en formato JSON plano (un arreglo de objetos), SIN bloques de markdown (\`\`\`json ... \`\`\`), SIN texto antes ni después.
Estructura exacta por objeto:
{
  "question": "Texto de la pregunta",
  "options": ["Opción A", "Opción B", "Opción C"],
  "answer": 0,
  "explanation": "Explicación amable y educativa para un niño de por qué esta es la respuesta correcta"
}
Donde "answer" es el índice numérico (0, 1 o 2) de la opción correcta.
`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const cleanedJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions: GameQuestion[] = JSON.parse(cleanedJson);

    return questions.slice(0, count);
  } catch (error) {
    console.error('❌ Error en generateGameQuestions:', error);
    return [
      {
        question: '¿Cuál de estos animales vive en el agua?',
        options: ['Delfín', 'Perro', 'Pájaro'],
        answer: 0,
        explanation: '¡El delfín vive en el agua y nada muy rápido en el océano!'
      },
      {
        question: '¿Cuánto es 5 + 5?',
        options: ['8', '10', '12'],
        answer: 1,
        explanation: '¡Si sumas 5 dedos de una mano más 5 dedos de la otra mano, obtienes 10!'
      },
    ];
  }
};

// ============================================
// 4. GENERADOR DE MÚSICA IA Y AMBIENTE
// ============================================
export const generateAIMusicTrack = async (prompt: string): Promise<{ title: string; uri: string; duration: string }> => {
  try {
    const seed = encodeURIComponent(prompt.substring(0, 30));
    // URLs de streams ambientales de alta calidad
    const sampleUris = [
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    ];
    const randomIndex = Math.floor(Math.abs(prompt.length) % sampleUris.length);

    return {
      title: `Pista IA: ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}`,
      uri: sampleUris[randomIndex],
      duration: '15 min',
    };
  } catch (error) {
    console.error('❌ Error en generateAIMusicTrack:', error);
    return {
      title: 'Cuento de cuna tranquilo',
      uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: '10 min',
    };
  }
};

// ============================================
// 5. GENERAR HISTORIA CON IMAGEN (storyController)
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