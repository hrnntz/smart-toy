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
// 4. GENERADOR DE MÚSICA Y CANCIONES DE CUNA CON IA
// ============================================
// ============================================
// 4. GENERADOR DE MÚSICA IA REAL (META MUSICGEN & GROQ/ELEVENLABS)
// ============================================
export const generateAIMusicTrack = async (prompt: string): Promise<{ title: string; uri: string; duration: string }> => {
  try {
    const lowerPrompt = prompt.toLowerCase();
    console.log(`🎶 Generando música con IA para el prompt: "${prompt}"...`);

    // 1. Intentar generación instrumental de música original con Meta MusicGen AI (Hugging Face)
    const hfToken = process.env.HUGGINGFACE_API_KEY || '';
    if (hfToken) {
      try {
        console.log('🤖 Llamando a Meta MusicGen AI (facebook/musicgen-small)...');
        const hfRes = await fetch('https://api-inference.huggingface.co/models/facebook/musicgen-small', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        });

        if (hfRes.ok) {
          const arrayBuffer = await hfRes.arrayBuffer();
          const base64Audio = Buffer.from(arrayBuffer).toString('base64');
          console.log('✅ ¡Pista de música instrumental generada con éxito por Meta MusicGen AI!');
          return {
            title: `Música IA: ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}`,
            uri: `data:audio/wav;base64,${base64Audio}`,
            duration: '30 seg',
          };
        } else {
          console.warn('⚠️ Meta MusicGen no respondió OK, pasando a generador de nana cantada...', hfRes.status);
        }
      } catch (hfErr) {
        console.error('⚠️ Error llamando a Meta MusicGen:', hfErr);
      }
    }

    // 2. Si la petición es sobre un tema ambiental específico (lluvia, mar, bosque, ruido blanco)
    const ambientLibrary: Record<string, string> = {
      lluvia: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
      mar: 'https://actions.google.com/sounds/v1/water/ocean_waves.ogg',
      olas: 'https://actions.google.com/sounds/v1/water/ocean_waves.ogg',
      agua: 'https://actions.google.com/sounds/v1/water/ocean_waves.ogg',
      bosque: 'https://actions.google.com/sounds/v1/ambiences/outdoor_forest.ogg',
      naturaleza: 'https://actions.google.com/sounds/v1/ambiences/outdoor_forest.ogg',
      pajaro: 'https://actions.google.com/sounds/v1/ambiences/outdoor_forest.ogg',
      piano: 'https://cdn.freesound.org/previews/518/518888_11306353-lq.mp3',
      caja: 'https://cdn.freesound.org/previews/462/462092_9159316-lq.mp3',
      relajante: 'https://cdn.freesound.org/previews/462/462092_9159316-lq.mp3',
      dormir: 'https://actions.google.com/sounds/v1/ambiences/white_noise.ogg',
      ruido: 'https://actions.google.com/sounds/v1/ambiences/white_noise.ogg',
      viento: 'https://actions.google.com/sounds/v1/weather/wind_synthetic.ogg',
      kalimba: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba-Lullaby-Sound.mp3',
    };

    for (const key of Object.keys(ambientLibrary)) {
      if (lowerPrompt.includes(key)) {
        return {
          title: `Sonido Real: ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}`,
          uri: ambientLibrary[key],
          duration: '15 min',
        };
      }
    }

    // 3. Composición de canción de cuna personalizada con Groq Llama 3.3 + Voz Cantada con ElevenLabs/TTS
    const { generateSpeechFromText } = require("./elevenlabsService");
    const systemPrompt = `Eres un compositor experto en nanas e historias musicales infantiles. 
Genera una nana de cuna muy dulce de 4 versos rítmicos basada en el tema: "${prompt}". 
Solo responde con la letra de la canción de cuna, de forma poética y tierna. Sin introducciones.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 150,
    });

    const songLyrics = chatCompletion.choices[0]?.message?.content || `Duérmete mi niño, duérmete mi amor, las estrellas brillan con su resplandor. ${prompt}`;
    
    // Sintetizar la nana cantada por la voz dulce de Bella / ElevenLabs / TTS
    const audioUrl = await generateSpeechFromText(`🎶 ${songLyrics}`, 'EXAVITQu4vr4xnSDxMaL');

    return {
      title: `Nana IA: ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}`,
      uri: audioUrl || 'https://actions.google.com/sounds/v1/ambiences/white_noise.ogg',
      duration: '3 min',
    };
  } catch (error) {
    console.error('❌ Error en generateAIMusicTrack:', error);
    return {
      title: 'Canción de Cuna Panda',
      uri: 'https://actions.google.com/sounds/v1/ambiences/white_noise.ogg',
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