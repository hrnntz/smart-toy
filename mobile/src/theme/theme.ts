export const colors = {
  // Light Mode (PandaAI Design System - Coral Cálido)
  light: {
    background: '#F2F4F8',
    card: '#FFFFFF',
    text: '#101218',
    textSecondary: '#757A89',
    primary: '#E8533F', // Coral Cálido PandaAI
    secondary: '#171B26', // Azul Marino
    border: '#E0E3EC',
    error: '#EF4444',
    success: '#22C55E',
    surface: '#F0F2F7',
  },
  // Dark Mode (PandaAI Design System - Azul Marino Profundo)
  dark: {
    background: '#0D0F16',
    card: '#171B26',
    text: '#EEF0F5',
    textSecondary: '#6B7280',
    primary: '#FF7A68', // Coral Luminoso PandaAI
    secondary: '#1D2230',
    border: '#252B3A',
    error: '#F87171',
    success: '#34D399',
    surface: '#1E2335',
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
