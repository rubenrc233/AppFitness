// Shared design tokens - Minimal & Elegant dark aesthetic
export const palette = {
  // Fondos oscuros neutros
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceAlt: '#242424',
  surfaceHighlight: '#2E2E2E',
  inputBg: '#1E1E1E',
  
  // Bordes neutros
  border: '#333333',
  borderLight: '#404040',
  
  // Colores principales
  primary: '#E85D04',
  primaryLight: '#FF7A1A',
  primaryMuted: '#E85D0440',
  primaryGlow: '#E85D0430',
  accent: '#D62828',
  accentMuted: '#D6282840',
  
  // Texto
  text: '#FAFAFA',
  textWarm: '#FFE4D6',
  muted: '#999999',
  mutedAlt: '#666666',
  
  // Estados
  success: '#22C55E',
  danger: '#EF4444',
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  full: 999,
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
};
