import { Pressable, View } from 'react-native';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '../lib/appearance';
import { useI18n } from '../lib/i18n';
import { colors, radius, space, themed } from '../theme';
import { Txt } from './ui';

const OPTIONS = [
  ['light', 'sunny', 'themeLight'],
  ['dark', 'moon', 'themeDark'],
  ['system', 'phone-portrait', 'themeSystem'],
];

/** Light / Dark / System segmented switch. */
export function ThemeSwitch() {
  const { pref, setPref } = useAppearance();
  const { t } = useI18n();
  const pathname = usePathname();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {OPTIONS.map(([key, icon, label]) => {
        const active = pref === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => !active && setPref(key, pathname)}
            style={[styles.item, active && styles.active]}
          >
            <Ionicons name={active ? icon : `${icon}-outline`} size={18} color={active ? colors.onPrimary : colors.primary} />
            <Txt variant="caption" weight="semibold" color={active ? colors.onPrimary : colors.primary}>
              {t(label)}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themed(() => ({
  wrap: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, overflow: 'hidden' },
  item: { flex: 1, flexDirection: 'row', gap: space.xs, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  active: { backgroundColor: colors.primary },
}));
