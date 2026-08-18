// Catálogo de Voces Oficiales Predeterminadas de ElevenLabs (100% compatibles con la API Gratuita)
export const CHARACTER_VOICES: Record<string, { id: string; name: string; desc: string }> = {
  BELLA: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Panda Dulce)', desc: 'Voz tierna, suave y alegre para niños' },
  GIGI: { id: 'jBpfOiLJlfdOoWvoflAa', name: 'Gigi (Cuento de Hadas)', desc: 'Voz infantil, mágica y divertida' },
  MIMI: { id: 'zrHiDhphv95cyQqftM9H', name: 'Mimi (Oso Pequeño)', desc: 'Voz muy tierna tipo peluche' },
  RACHEL: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Amiga Panda)', desc: 'Voz dulce y calmada para antes de dormir' },
  FREYA: { id: 'jsCqWAovK2LkecYy1ClR', name: 'Freya (Princesa/Hada)', desc: 'Voz alegre y expresiva' },
  GLINDA: { id: 'z9fAnlkznG4ndvfOBYJU', name: 'Glinda (Mágica)', desc: 'Voz de personaje de fantasía' },
  GIOVANNI: { id: 'zcAAsDuNqEBlko7h1jiB', name: 'Giovanni (Panda Explorador)', desc: 'Voz animada masculina de caricatura' },
  DOMI: { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Aventurera)', desc: 'Voz enérgica y juguetona' },
  CHARLIE: { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Chico Divertido)', desc: 'Voz juvenil amigable' },
  FINN: { id: 'D38z5RcWu1voky8WS1ja', name: 'Finn (Caricatura)', desc: 'Voz graciosa de personaje animado' },
};

const FREE_PREMADE_VOICE_IDS = Object.values(CHARACTER_VOICES).map((v) => v.id);

// Fallback gratuito de respaldo (Google Translate TTS - 100% Gratis sin API Key)
const getFreeFallbackTTS = async (text: string): Promise<string> => {
  try {
    console.log('🔄 Generando audio de respaldo con TTS gratuito...');
    const encodedText = encodeURIComponent(text.slice(0, 300));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=es&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:audio/mpeg;base64,${base64}`;
    }
  } catch (err) {
    console.error('❌ Error en TTS de respaldo:', err);
  }
  return '';
};

export const generateSpeechFromText = async (text: string, voiceId?: string): Promise<string> => {
  try {
    const apiKey = (process.env.ELEVENLABS_API_KEY || '').trim();

    // Si se pasa una voz o se configura en .env, verificar que esté en el catálogo premade
    const defaultVoiceId = CHARACTER_VOICES.BELLA.id; // Bella: la voz más tierna e infantil
    let targetVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || defaultVoiceId;

    if (!FREE_PREMADE_VOICE_IDS.includes(targetVoiceId)) {
      console.warn(`⚠️ La voz ${targetVoiceId} no es oficial premade. Cambiando automáticamente a Bella (${defaultVoiceId}) para evitar cobros.`);
      targetVoiceId = defaultVoiceId;
    }

    if (!apiKey) {
      console.warn('⚠️ ELEVENLABS_API_KEY no configurada. Usando voz de respaldo gratuita.');
      return await getFreeFallbackTTS(text);
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.35,        // Menos estabilidad = más emoción y juego en la voz
          similarity_boost: 0.85, // Mayor nitidez del personaje
          style: 0.45,            // Estilo expresivo para niños
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error respuesta ElevenLabs:', response.status, errorText);

      if (response.status === 402 || response.status === 401 || response.status === 429) {
        console.warn('⚠️ Activando voz de respaldo gratuita tras restricción de plan en ElevenLabs...');
        return await getFreeFallbackTTS(text);
      }
      return await getFreeFallbackTTS(text);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error: any) {
    console.error('❌ Error en ElevenLabs TTS:', error?.message || error);
    return await getFreeFallbackTTS(text);
  }
};
