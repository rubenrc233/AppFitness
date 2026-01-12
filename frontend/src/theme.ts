// Shared design tokens - Minimal & Elegant "Incinerador" aesthetic
export const palette = {
  // Fondos con tinte rojizo equilibrado
  background: '#100D0D',
  surface: '#1A1515',
  surfaceAlt: '#221B1B',
  surfaceHighlight: '#2A2222',
  inputBg: '#1E1818',
  
  // Bordes con calidez rojiza
  border: '#362929',
  borderLight: '#453535',
  
  // Colores principales
  primary: '#E85D04',
  primaryLight: '#FF7A1A',
  primaryMuted: '#E85D0440',
  primaryGlow: '#E85D0430',
  accent: '#D62828',
  accentMuted: '#D6282840',
  
  // Texto
  text: '#FAF7F5',
  textWarm: '#FFE4D6',
  muted: '#A18F8F',
  mutedAlt: '#645656',
  
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
