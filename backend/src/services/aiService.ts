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
Eres ${toyName}, un juguete inteligente y amigable para niÃ±os.
${personality ? `Tu personalidad es: ${personality}.` : 'Eres amable, divertido y siempre ayudas a los niÃ±os.'}
${context ? `Contexto adicional: ${context}.` : ''}
Responde de manera breve (mÃ¡ximo 2 oraciones), cÃ¡lida y adecuada para un niÃ±o de 6 aÃ±os. Usa un tono alegre y sencillo.
Recuerda lo conversado anteriormente en el chat para mantener la continuidad.
Nunca uses lenguaje tÃ©cnico ni complejo. Siempre responde en espaÃ±ol.
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
      model: 'openai/gpt-oss-20b',
      temperature: 0.7,
      max_tokens: 200,
    });

    return chatCompletion.choices[0]?.message?.content || 'No pude entender eso.';
  } catch (error) {
    console.error('âŒ Error en Groq chat con historial:', error);
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

    // Si el archivo no tiene extensiÃ³n .m4a, renombrarlo para que Groq valide el tipo
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
    console.error('âŒ Error en Groq Whisper STT:', error);
    return '';
  }
};

// ============================================
// 3. GENERAR PREGUNTAS DE MINIJUEGOS CON DIFICULTAD E EXPLICACIÃ“N
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
Genera exactamente ${count} preguntas de opciÃ³n mÃºltiple divertidas y educativas para niÃ±os.
Juego: "${gameName}"
CategorÃ­a: "${category}"
Nivel de Dificultad: "${difficulty}" (Adapta la complejidad del vocabulario y los cÃ¡lculos segÃºn esta dificultad).

DEBES responder ÃšNICAMENTE en formato JSON plano (un arreglo de objetos), SIN bloques de markdown (\`\`\`json ... \`\`\`), SIN texto antes ni despuÃ©s.
Estructura exacta por objeto:
{
  "question": "Texto de la pregunta",
  "options": ["OpciÃ³n A", "OpciÃ³n B", "OpciÃ³n C"],
  "answer": 0,
  "explanation": "ExplicaciÃ³n amable y educativa para un niÃ±o de por quÃ© esta es la respuesta correcta"
}
Donde "answer" es el Ã­ndice numÃ©rico (0, 1 o 2) de la opciÃ³n correcta.
`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const cleanedJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions: GameQuestion[] = JSON.parse(cleanedJson);

    return questions.slice(0, count);
  } catch (error) {
    console.error('âŒ Error en generateGameQuestions:', error);
    return [
      {
        question: 'Â¿CuÃ¡l de estos animales vive en el agua?',
        options: ['DelfÃ­n', 'Perro', 'PÃ¡jaro'],
        answer: 0,
        explanation: 'Â¡El delfÃ­n vive en el agua y nada muy rÃ¡pido en el ocÃ©ano!'
      },
      {
        question: 'Â¿CuÃ¡nto es 5 + 5?',
        options: ['8', '10', '12'],
        answer: 1,
        explanation: 'Â¡Si sumas 5 dedos de una mano mÃ¡s 5 dedos de la otra mano, obtienes 10!'
      },
    ];
  }
};

// ============================================
// 4. GENERADOR DE MÃšSICA Y CANCIONES DE CUNA CON IA
// ============================================
// ============================================
// 4. GENERADOR DE MÃšSICA IA REAL (META MUSICGEN & GROQ/ELEVENLABS)
// ============================================
export const generateAIMusicTrack = async (prompt: string): Promise<{ title: string; uri: string; duration: string }> => {
  try {
    const lowerPrompt = prompt.toLowerCase();
    console.log(`ðŸŽ¶ Generando mÃºsica con IA para el prompt: "${prompt}"...`);

    // 1. Intentar generaciÃ³n instrumental de mÃºsica original con Meta MusicGen AI (Hugging Face Router API)
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
          console.log('âœ… Â¡Pista de mÃºsica instrumental generada con Ã©xito por Meta MusicGen AI!');
          return {
            title: `MÃºsica IA: ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}`,
            uri: `data:audio/wav;base64,${base64Audio}`,
            duration: '30 seg',
          };
        }
      } catch (hfErr: any) {
        console.warn(`â„¹ï¸ Meta MusicGen API no disponible (${hfErr?.message || 'Offline'}). Usando compositor inteligente Groq...`);
      }
    }

    // 2. Si la peticiÃ³n es sobre un tema ambiental especÃ­fico (lluvia, mar, bosque, ruido blanco, etc.)
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

    // 3. ComposiciÃ³n poÃ©tica de canciÃ³n de cuna personalizada con Groq Llama 3.3 + Voz Dulce Cantada (ElevenLabs/TTS)
    const { generateSpeechFromText } = require("./elevenlabsService");
    const systemPrompt = `Eres un compositor experto en nanas e historias musicales infantiles. 
Genera una nana de cuna muy dulce de 4 versos rÃ­tmicos basada en el tema: "${prompt}". 
Solo responde con la letra de la canciÃ³n de cuna en espaÃ±ol, poÃ©tica, tierna y con rima para niÃ±os. Sin introducciones.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 150,
    });

    const songLyrics = chatCompletion.choices[0]?.message?.content || `DuÃ©rmete mi niÃ±o, duÃ©rmete mi amor, las estrellas brillan con su resplandor. ${prompt}`;
    
    // Sintetizar la nana cantada por la voz dulce de Bella / ElevenLabs / TTS
    const audioUrl = await generateSpeechFromText(`ðŸŽ¶ ${songLyrics}`, 'EXAVITQu4vr4xnSDxMaL');

    return {
      title: `Nana IA: ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}`,
      uri: audioUrl || 'https://actions.google.com/sounds/v1/ambiences/white_noise.ogg',
      duration: '3 min',
    };
  } catch (error) {
    console.error('âŒ Error en generateAIMusicTrack:', error);
    return {
      title: 'CanciÃ³n de Cuna Panda',
      uri: 'https://actions.google.com/sounds/v1/ambiences/white_noise.ogg',
      duration: '10 min',
    };
  }
};

// ============================================
// 6. GENERAR PALABRAS DE UN TEMA DE INGLÃ‰S (englishController)
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
Genera exactamente ${count} palabras o frases MUY simples en inglÃ©s para enseÃ±arle a un niÃ±o que no sabe absolutamente nada de inglÃ©s, sobre el tema: "${themeLabel}".
Deben ser palabras concretas y fÃ¡ciles de imaginar/dibujar (sustantivos simples como "dog", "red", "table"), o frases cortas de mÃ¡ximo 4 palabras si el tema lo pide (ej. "Good morning", "How are you").
No repitas palabras. OrdÃ©nalas de la mÃ¡s fÃ¡cil a la mÃ¡s difÃ­cil.
DEBES responder ÃšNICAMENTE en formato JSON plano (un arreglo de objetos), SIN bloques de markdown (\`\`\`json ... \`\`\`), SIN texto antes ni despuÃ©s.
Estructura exacta por objeto:
{
  "english": "palabra o frase en inglÃ©s",
  "spanish": "su traducciÃ³n exacta al espaÃ±ol"
}
`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.6,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const cleanedJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const words: EnglishWordItem[] = JSON.parse(cleanedJson);

    return words.slice(0, count);
  } catch (error) {
    console.error('âŒ Error en generateEnglishThemeWords:', error);
    // Respaldo fijo para que la lecciÃ³n nunca se quede vacÃ­a si la IA falla
    return [
      { english: 'Hello', spanish: 'Hola' },
      { english: 'Yes', spanish: 'SÃ­' },
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
  enseÃ±anza?: string
): Promise<{ titulo: string; contenido: string; imagen: string }> => {
  try {
    const prompt = `
Crea una historia infantil corta basada en los siguientes datos:
- Tema: ${tema}
- DuraciÃ³n aproximada: ${duracion}
${personajes ? `- Personajes sugeridos: ${personajes}` : ''}
${enseÃ±anza ? `- EnseÃ±anza o mensaje: ${enseÃ±anza}` : ''}

La historia debe tener un tÃ­tulo llamativo y un contenido de aproximadamente 200-300 palabras.
Formato de respuesta:
TÃTULO: <tÃ­tulo>
---
<contenido de la historia>
`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.8,
      max_tokens: 800,
    });

    const fullText = response.choices[0]?.message?.content || '';
    const [tituloRaw, ...contenidoParts] = fullText.split('---');
    const titulo = tituloRaw.replace('TÃTULO:', '').trim() || 'Historia generada';
    const contenido = contenidoParts.join('---').trim() || fullText;

    const imagePrompt = encodeURIComponent(
      `ilustraciÃ³n infantil de ${tema}, cuento, dibujo colorido, estilo cuento infantil, personajes lindos`
    );
    const imagen = `https://image.pollinations.ai/prompt/${imagePrompt}?width=512&height=512&seed=${encodeURIComponent(tema)}`;

    return { titulo, contenido, imagen };
  } catch (error) {
    console.error('âŒ Error en generateStoryWithImage:', error);
    throw new Error('Error al generar la historia con IA');
  }
};
