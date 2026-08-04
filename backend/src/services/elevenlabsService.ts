const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel / Cute voice default

export const generateSpeechFromText = async (text: string, voiceId = DEFAULT_VOICE_ID): Promise<string> => {
  try {
    if (!ELEVENLABS_API_KEY) {
      console.warn('⚠️ ELEVENLABS_API_KEY no configurada. Se omitirá la síntesis de voz.');
      return '';
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error respuesta ElevenLabs:', response.status, errorText);
      return '';
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error: any) {
    console.error('❌ Error en ElevenLabs TTS:', error?.message || error);
    return '';
  }
};
