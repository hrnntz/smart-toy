import {
  ENGLISH_THEMES,
  nivelPorPalabras,
  isPronunciationCorrect,
} from '../controllers/englishController';

describe('English Learning & Progression Unit Tests', () => {
  describe('ENGLISH_THEMES constant', () => {
    it('should define the 5 standard Duolingo-style thematic stages', () => {
      expect(ENGLISH_THEMES).toHaveLength(5);
      const keys = ENGLISH_THEMES.map((t) => t.key);
      expect(keys).toEqual(['colores', 'animales', 'casa', 'dia_a_dia', 'colegio']);
    });

    it('should have key, label, and emoji for every theme', () => {
      ENGLISH_THEMES.forEach((theme) => {
        expect(theme.key).toBeDefined();
        expect(theme.label).toBeDefined();
        expect(theme.emoji).toBeDefined();
      });
    });
  });

  describe('Level Progression by Words Learned (nivelPorPalabras)', () => {
    it('should assign A1 - Principiante for 0 to 14 words', () => {
      expect(nivelPorPalabras(0)).toBe('A1 - Principiante');
      expect(nivelPorPalabras(10)).toBe('A1 - Principiante');
      expect(nivelPorPalabras(14)).toBe('A1 - Principiante');
    });

    it('should assign A1 - Básico for 15 to 29 words', () => {
      expect(nivelPorPalabras(15)).toBe('A1 - Básico');
      expect(nivelPorPalabras(25)).toBe('A1 - Básico');
    });

    it('should assign A2 - Elemental for 30 to 44 words', () => {
      expect(nivelPorPalabras(30)).toBe('A2 - Elemental');
      expect(nivelPorPalabras(44)).toBe('A2 - Elemental');
    });

    it('should assign A2 - Intermedio bajo for 45 to 59 words', () => {
      expect(nivelPorPalabras(45)).toBe('A2 - Intermedio bajo');
    });

    it('should cap at B1 - Intermedio for 60+ words', () => {
      expect(nivelPorPalabras(60)).toBe('B1 - Intermedio');
      expect(nivelPorPalabras(150)).toBe('B1 - Intermedio');
    });
  });

  describe('Pronunciation Evaluation (isPronunciationCorrect)', () => {
    it('should accept exact matching words', () => {
      expect(isPronunciationCorrect('apple', 'apple')).toBe(true);
    });

    it('should ignore case differences and punctuation', () => {
      expect(isPronunciationCorrect('Hello!', 'hello')).toBe(true);
      expect(isPronunciationCorrect('Yellow.', 'YELLOW')).toBe(true);
    });

    it('should tolerate child speech containing articles or substrings', () => {
      expect(isPronunciationCorrect('dog', 'the dog')).toBe(true);
      expect(isPronunciationCorrect('a big elephant', 'elephant')).toBe(true);
    });

    it('should reject completely wrong words', () => {
      expect(isPronunciationCorrect('cat', 'dog')).toBe(false);
      expect(isPronunciationCorrect('blue', 'red')).toBe(false);
    });

    it('should return false when input transcription is empty', () => {
      expect(isPronunciationCorrect('apple', '')).toBe(false);
    });
  });
});
