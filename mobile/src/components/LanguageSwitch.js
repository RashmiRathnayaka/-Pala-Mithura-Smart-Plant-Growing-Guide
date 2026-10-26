import { Pressable, View } from 'react-native';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { colors, radius, themed } from '../theme';
import { Txt } from './ui';

/** සිං | EN segmented switch. Also saves the choice to the profile when logged in. */
export function LanguageSwitch() {
  const { lang, setLang } = useI18n();
  const { user, updateProfile } = useAuth();
  const choose = (l) => {
    setLang(l);
    if (user && user.language !== l) updateProfile({ language: l }).catch(() => {});
  };
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {[
        ['si', 'සිං'],
        ['en', 'EN'],
      ].map(([code, label]) => (
        <Pressable
          key={code}
          accessibilityRole="radio"
          accessibilityState={{ selected: lang === code }}
          onPress={() => choose(code)}
          style={[styles.item, lang === code && styles.active]}
        >
          <Txt weight="semibold" color={lang === code ? colors.onPrimary : colors.primary}>
            {label}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

const styles = themed(() => ({
  wrap: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.pill, overflow: 'hidden' },
  item: { paddingHorizontal: 14, minHeight: 36, justifyContent: 'center' },
  active: { backgroundColor: colors.primary },
}));
