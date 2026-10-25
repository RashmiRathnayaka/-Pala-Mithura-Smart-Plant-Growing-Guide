/**
 * Design tokens – leaf green and white, with soil brown as the second accent.
 * Status colours are always paired with an icon and a word (never colour alone).
 */
export const colors = {
  primary: '#1E6B43', // leaf green
  primaryDark: '#134A2E',
  primarySoft: '#DCEBDD',
  soil: '#7A4E2D', // soil brown
  soilSoft: '#F1E6DC',
  bg: '#F2F6F0', // faint leaf tint
  surface: '#FFFFFF',
  ink: '#16241B',
  inkSoft: '#4A5A50',
  muted: '#7C8A81',
  line: '#D9E3DA',
  pending: '#9A6200', // amber (text-safe contrast on white)
  pendingSoft: '#FFF1D6',
  verified: '#1E6B43',
  verifiedSoft: '#DCEBDD',
  danger: '#B3261E',
  dangerSoft: '#FBE3E1',
  info: '#245C8F',
  infoSoft: '#E1ECF7',
  white: '#FFFFFF',
};

export const fonts = {
  regular: 'NotoSansSinhala_400Regular',
  medium: 'NotoSansSinhala_500Medium',
  semibold: 'NotoSansSinhala_600SemiBold',
  bold: 'NotoSansSinhala_700Bold',
};

// Sinhala script needs generous line height to avoid clipped vowel signs.
export const type = {
  caption: { fontSize: 13, lineHeight: 20 },
  body: { fontSize: 15, lineHeight: 24 },
  bodyLg: { fontSize: 17, lineHeight: 27 },
  title: { fontSize: 20, lineHeight: 30 },
  heading: { fontSize: 25, lineHeight: 36 },
  display: { fontSize: 31, lineHeight: 44 },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// Hierarchy through radius: large surfaces are softer than small controls.
export const radius = { sm: 8, md: 12, lg: 18, xl: 26, pill: 999 };

export const shadow = {
  shadowColor: '#134A2E',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

export const categoryColor = (cat) => cat?.color || colors.primary;
