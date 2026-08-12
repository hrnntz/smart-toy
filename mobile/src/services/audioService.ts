import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;
let currentPlayingUri: string | null = null;
let isPausedState: boolean = false;

export const playAudio = async (uri: string, onPlaybackStatusUpdate?: (status: any) => void): Promise<boolean> => {
  try {
    if (currentSound) {
      await stopAudio();
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );

    currentSound = sound;
    currentPlayingUri = uri;
    isPausedState = false;
    return true;
  } catch (error) {
    console.error('Error al reproducir audio:', error);
    return false;
  }
};

export const pauseAudio = async (): Promise<void> => {
  try {
    if (currentSound) {
      await currentSound.pauseAsync();
      isPausedState = true;
    }
  } catch (error) {
    console.error('Error al pausar audio:', error);
  }
};

export const resumeAudio = async (): Promise<void> => {
  try {
    if (currentSound) {
      await currentSound.playAsync();
      isPausedState = false;
    }
  } catch (error) {
    console.error('Error al reanudar audio:', error);
  }
};

export const stopAudio = async (): Promise<void> => {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
      currentPlayingUri = null;
      isPausedState = false;
    }
  } catch (error) {
    console.error('Error al detener audio:', error);
  }
};

export const getCurrentPlayingUri = (): string | null => {
  return currentPlayingUri;
};

export const isAudioPaused = (): boolean => {
  return isPausedState;
};
