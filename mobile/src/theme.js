/**
 * Design tokens – leaf green and white, with soil brown as the second accent.
 * Status colours are always paired with an icon and a word (never colour alone).
 *
 * Light and dark palettes share the same token names. `colors` is a live object whose values
 * are swapped by applyScheme(); styles built with themed() are rebuilt on the next read.
 * `on*` tokens are the text/icon colour to use on top of the matching accent fill.
 */
import { StyleSheet } from 'react-native';

const light = {
  primary: '#1E6B43', // leaf green
  onPrimary: '#FFFFFF',
  primaryDark: '#134A2E',
  primarySoft: '#DCEBDD',
  soil: '#7A4E2D', // soil brown
  onSoil: '#FFFFFF',
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
  onDanger: '#FFFFFF',
  dangerSoft: '#FBE3E1',
  info: '#245C8F',
  infoSoft: '#E1ECF7',
  backdrop: 'rgba(19,74,46,0.35)',
  white: '#FFFFFF',
};

// Night garden: deep green-black surfaces, accents lightened so they read as text on dark,
// with dark text on top of accent fills.
const dark = {
  primary: '#6FCF97',
  onPrimary: '#0B1A11',
  primaryDark: '#4FAF77',
  primarySoft: '#1D3326',
  soil: '#DDA778',
  onSoil: '#1F140B',
  soilSoft: '#36281C',
  bg: '#0D1410',
  surface: '#16201A',
  ink: '#E4EEE7',
  inkSoft: '#B1C2B7',
  muted: '#8A9A8F',
  line: '#2A3A30',
  pending: '#F0BE5C',
  pendingSoft: '#362B12',
  verified: '#6FCF97',
  verifiedSoft: '#1D3326',
  danger: '#F28B82',
  onDanger: '#2A0C09',
  dangerSoft: '#3A1D1A',
  info: '#8AC0F0',
  infoSoft: '#18283A',
  backdrop: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
};

/** Fixed brand green for the splash screen (matches the native splash in app.json). */
export const BRAND = '#1E6B43';

export const colors = { ...light };
let currentScheme = 'light';
let version = 0;

export function applyScheme(scheme) {
  const next = scheme === 'dark' ? 'dark' : 'light';
  if (next === currentScheme) return;
  Object.assign(colors, next === 'dark' ? dark : light);
  currentScheme = next;
  version += 1;
}

export const getScheme = () => currentScheme;

/**
 * Like StyleSheet.create, but rebuilt after the colour scheme changes.
 * Usage: const styles = themed(() => ({ card: { backgroundColor: colors.surface } }));
 */
export function themed(build) {
  let cache = null;
  let builtFor = -1;
  return new Proxy(
    {},
    {
      get(_t, key) {
        if (builtFor !== version) {
          cache = StyleSheet.create(build());
          builtFor = version;
        }
        return cache[key];
      },
    }
  );
}

/** Lazily rebuilt non-style value (lists, maps of colours). Call it: buttonVariants(). */
export function themedValue(build) {
  let cache = null;
  let builtFor = -1;
  return () => {
    if (builtFor !== version) {
      cache = build();
      builtFor = version;
    }
    return cache;
  };
}

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
