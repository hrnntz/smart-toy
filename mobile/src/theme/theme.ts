export const colors = {
  // Light Mode (Inspirado en Klarna / Family)
  light: {
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#717171',
    primary: '#06B6D4', // Vibrante Cyan
    secondary: '#8B5CF6', // Vibrante Violeta
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    surface: '#F3F4F6', // Para modales o inputs
  },
  // Dark Mode (Inspirado en Tesla)
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    primary: '#00FF88', // Verde Neón (Tesla vibe)
    secondary: '#06B6D4', // Cyan vibrante
    border: '#374151',
    error: '#F87171',
    success: '#34D399',
    surface: '#27272A',
  },
};

export const typography = {
  fontFamily: {
    regular: 'System', // Cambiar si se agregan fuentes custom
    bold: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24, // 3xl equivalente (Family/Klarna)
  xxxl: 32, // 4xl equivalente para Bottom Sheets
  full: 9999,
};

export const shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  }
};
