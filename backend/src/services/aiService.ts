import Groq from 'groq-sdk';

// Inicializar Groq con tu API Key (debe estar en .env)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============================================
// 1. CHAT CON JUGUETES (usado en toyController)
// ============================================
export const getAIResponse = async (
  message: string,
  toyName: string,
  personality?: string | null,
  context?: string | null
): Promise<string> => {
  try {
    const systemPrompt = `
Eres ${toyName}, un juguete inteligente y amigable para niños.
${personality ? `Tu personalidad es: ${personality}.` : 'Eres amable, divertido y siempre ayudas a los niños.'}
${context ? `Contexto adicional: ${context}.` : ''}
Responde de manera breve, cálida y adecuada para un niño de 6 años. Usa un tono alegre y sencillo.
Nunca uses lenguaje técnico ni complejo. Siempre responde en español.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: 200,
    });

    return chatCompletion.choices[0]?.message?.content || 'No pude entender eso.';
  } catch (error) {
    console.error('❌ Error en Groq chat:', error);
    return 'Lo siento, tuve un problema. Intenta de nuevo.';
  }
};

// ============================================
// 2. GENERAR HISTORIA CON IMAGEN (usado en storyController)
// ============================================
export const generateStoryWithImage = async (
  tema: string,
  duracion: string,
  personajes?: string,
  enseñanza?: string
): Promise<{ titulo: string; contenido: string; imagen: string }> => {
  try {
    // Prompt para Groq
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

    // Generar imagen con Pollinations (gratuito, sin API key)
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