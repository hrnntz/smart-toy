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

// Cache dinámico de modelos de Groq para evitar llamar a modelos dados de baja
let cachedGroqModels: string[] = [];
let lastGroqModelsFetch = 0;

export const getGroqTextModels = async (): Promise<string[]> => {
  const now = Date.now();
  if (cachedGroqModels.length > 0 && now - lastGroqModelsFetch < 15 * 60 * 1000) {
    return cachedGroqModels;
  }

  // Modelos preferidos activos en Groq (2026)
  const preferred = [
    process.env.GROQ_TEXT_MODEL,
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'meta-llama/llama-4-scout-17b-16e-instruct',
  ].filter(Boolean) as string[];

  try {
    const listRes = await groq.models.list();
    const activeIds = (listRes.data || [])
      .map((m: any) => m.id)
      .filter(
        (id: string) =>
          id &&
          !id.includes('whisper') &&
          !id.includes('guard') &&
          !id.includes('vision') &&
          !id.includes('tts') &&
          !id.includes('playai')
      );

    if (activeIds.length > 0) {
      // Priorizar los preferidos que coincidan con la cuenta
      const matched = preferred.filter((m) => activeIds.includes(m));
      const others = activeIds.filter((id: string) => !matched.includes(id));
      cachedGroqModels = [...matched, ...others];
      lastGroqModelsFetch = now;
      console.log(`🤖 Modelos de texto activos en Groq detectados (${cachedGroqModels.length}):`, cachedGroqModels);
      return cachedGroqModels;
    }
  } catch (err: any) {
    console.warn(`⚠️ No se pudo consultar groq.models.list(): ${err?.message || err}. Usando lista preferida.`);
  }

  cachedGroqModels = preferred;
  return cachedGroqModels;
};

// Motor de respaldo inteligente (Pollinations AI) si Groq falla o agota cuota
const callBackupAI = async (systemPrompt: string, userMessage: string): Promise<string | null> => {
  try {
    const prompt = `${systemPrompt}\n\nNiño: ${userMessage}\nPanda:`;
    const encoded = encodeURIComponent(prompt);
    const res = await fetch(`https://text.pollinations.ai/${encoded}?model=openai&seed=42`, {
      method: 'GET',
      headers: { 'User-Agent': 'SmartToy/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
  } catch (err: any) {
    console.warn('⚠️ Backup AI (Pollinations) no disponible:', err?.message || err);
  }
  return null;
};

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

    const candidateModels = await getGroqTextModels();

    for (const model of candidateModels) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            ...formattedHistory,
            { role: 'user', content: message },
          ],
          model,
          temperature: 0.7,
          max_tokens: 200,
        });

        const reply = chatCompletion.choices[0]?.message?.content;
        if (reply && reply.trim().length > 0) {
          return reply.trim();
        }
      } catch (err: any) {
        console.warn(`⚠️ Groq modelo "${model}" falló: ${err?.message || err}. Probando siguiente modelo...`);
      }
    }

    // Si todos los modelos de Groq fallan, intentar con la IA de respaldo libre
    const backupReply = await callBackupAI(systemPrompt, message);
    if (backupReply) {
      console.log('✨ Respuesta generada exitosamente por IA de respaldo libre.');
      return backupReply;
    }

    // Fallback inteligente y cariñoso si no hay ninguna conexión a IA disponible
    const lower = message.toLowerCase();
    if (lower.includes('hola') || lower.includes('cómo estás') || lower.includes('buenos')) {
      return `¡Hola, amiguito! Qué lindo escucharte. Soy ${toyName}, ¡estoy muy feliz de hablar contigo hoy! 🐼✨`;
    }
    if (lower.includes('adivinanza') || lower.includes('juego')) {
      return '¡Tengo una adivinanza! Tengo agujas pero no sé coser, tengo números pero no sé leer. ¿Qué soy? ... ¡El reloj! ⏰';
    }
    if (lower.includes('abrazo')) {
      return '¡Te mando un abrazo enorme y suave como de oso panda! Eres mi mejor amigo. 🐼🤗';
    }
    return `¡Qué divertido lo que me dices! Me encanta ser tu compañero y aprender juntos todos los días. 🐼`;
  } catch (error) {
    console.error('❌ Error en chat con historial:', error);
    return `¡Hola! Soy ${toyName}, tu amigo inteligente. ¡Qué lindo jugar contigo hoy! 🐼`;
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

    // Si el archivo no tiene extensión de audio válida, asegurar que termine en .m4a
    if (!path.extname(filePath)) {
      targetPath = `${filePath}.m4a`;
      fs.renameSync(filePath, targetPath);
    }

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(targetPath),
      model: 'whisper-large-v3',
      language: 'es',
      response_format: 'json',
      temperature: 0.0,
      prompt: 'Voz de un niño pequeño hablando en español con su peluche inteligente Panda. Frases comunes: Hola Panda, cuéntame un cuento, cómo estás, vamos a jugar, tengo una pregunta, quiero aprender inglés, qué haces, te quiero mucho.',
    });

    const recognizedText = transcription.text?.trim() || '';
    console.log(`🎤 Whisper STT reconoció: "${recognizedText}"`);
    return recognizedText;
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

    const candidateModels = await getGroqTextModels();
    for (const model of candidateModels) {
      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          temperature: 0.7,
          max_tokens: 2000,
        });

        const content = response.choices[0]?.message?.content || '[]';
        const cleanedJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const questions: GameQuestion[] = JSON.parse(cleanedJson);
        if (Array.isArray(questions) && questions.length > 0) {
          return questions.slice(0, count);
        }
      } catch (err: any) {
        console.warn(`⚠️ Groq preguntas modelo "${model}" falló: ${err?.message || err}`);
      }
    }
    throw new Error('Todos los modelos de Groq fallaron para preguntas');
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

    // 1. Intentar generación instrumental de música original con Meta MusicGen AI (Hugging Face Router API)
    const hfToken = (process.env.HUGGINGFACE_API_KEY || '').trim();
    if (hfToken) {
      try {
        const hfUrl = 'https://router.huggingface.co/hf-inference/models/facebook/musicgen-small';
        const hfRes = await fetch(hfUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken}`,
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
        }
      } catch (hfErr: any) {
        console.warn(`ℹ️ Meta MusicGen API no disponible (${hfErr?.message || 'Offline'}). Usando compositor inteligente Groq...`);
      }
    }

    // 2. Si la petición es sobre un tema ambiental específico (lluvia, mar, bosque, ruido blanco, etc.)
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

    // 3. Composición poética de canción de cuna personalizada con Groq Llama 3.3 + Voz Dulce Cantada (ElevenLabs/TTS)
    const { generateSpeechFromText } = require("./elevenlabsService");
    const systemPrompt = `Eres un compositor experto en nanas e historias musicales infantiles. 
Genera una nana de cuna muy dulce de 4 versos rítmicos basada en el tema: "${prompt}". 
Solo responde con la letra de la canción de cuna en español, poética, tierna y con rima para niños. Sin introducciones.`;

    let songLyrics = `Duérmete mi niño, duérmete mi amor, las estrellas brillan con su resplandor. ${prompt}`;
    const musicModels = await getGroqTextModels();
    for (const model of musicModels) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'system', content: systemPrompt }],
          model,
          temperature: 0.7,
          max_tokens: 150,
        });
        if (chatCompletion.choices[0]?.message?.content) {
          songLyrics = chatCompletion.choices[0].message.content;
          break;
        }
      } catch (err: any) {
        console.warn(`⚠️ Groq música modelo "${model}" falló: ${err?.message || err}`);
      }
    }
    
    // Sintetizar la nana cantada por la voz dulce e infantil de Gigi / ElevenLabs / TTS
    const audioUrl = await generateSpeechFromText(`🎶 ${songLyrics}`, 'jBpfOiLJlfdOoWvoflAa');

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
// 6. GENERAR PALABRAS DE UN TEMA DE INGLÉS (englishController)
// ============================================
export interface EnglishWordItem {
  english: string;
  spanish: string;
}

export const generateEnglishThemeWords = async (
  themeLabel: string,
  count = 6
): Promise<EnglishWordItem[]> => {
  try {
    const prompt = `
Genera exactamente ${count} palabras o frases MUY simples en inglés para enseñarle a un niño que no sabe absolutamente nada de inglés, sobre el tema: "${themeLabel}".
Deben ser palabras concretas y fáciles de imaginar/dibujar (sustantivos simples como "dog", "red", "table"), o frases cortas de máximo 4 palabras si el tema lo pide (ej. "Good morning", "How are you").
No repitas palabras. Ordénalas de la más fácil a la más difícil.
DEBES responder ÚNICAMENTE en formato JSON plano (un arreglo de objetos), SIN bloques de markdown (\`\`\`json ... \`\`\`), SIN texto antes ni después.
Estructura exacta por objeto:
{
  "english": "palabra o frase en inglés",
  "spanish": "su traducción exacta al español"
}
`;

    const englishModels = await getGroqTextModels();
    for (const model of englishModels) {
      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          temperature: 0.6,
          max_tokens: 800,
        });

        const content = response.choices[0]?.message?.content || '[]';
        const cleanedJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const words: EnglishWordItem[] = JSON.parse(cleanedJson);
        if (Array.isArray(words) && words.length > 0) {
          return words.slice(0, count);
        }
      } catch (err: any) {
        console.warn(`⚠️ Groq inglés modelo "${model}" falló: ${err?.message || err}`);
      }
    }
    throw new Error('Todos los modelos de Groq fallaron para inglés');
  } catch (error) {
    console.error('❌ Error en generateEnglishThemeWords:', error);
    // Respaldo fijo para que la lección nunca se quede vacía si la IA falla
    return [
      { english: 'Hello', spanish: 'Hola' },
      { english: 'Yes', spanish: 'Sí' },
      { english: 'No', spanish: 'No' },
      { english: 'Please', spanish: 'Por favor' },
      { english: 'Thank you', spanish: 'Gracias' },
    ];
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

    let fullText = '';
    const storyModels = await getGroqTextModels();
    for (const model of storyModels) {
      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          temperature: 0.8,
          max_tokens: 800,
        });
        if (response.choices[0]?.message?.content) {
          fullText = response.choices[0].message.content;
          break;
        }
      } catch (err: any) {
        console.warn(`⚠️ Groq historia modelo "${model}" falló: ${err?.message || err}`);
      }
    }
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