/** Screen 4 – Plant categories */
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../lib/i18n';
import { useApi } from '../lib/useApi';
import { ErrorView, Loading, Screen, Txt } from '../components/ui';
import { colors, radius, shadow, space } from '../theme';

export default function Categories() {
  const { t, loc } = useI18n();
  const { data, error, loading, reload, refreshing } = useApi('/categories');
  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={styles.grid}>
        {data.items.map((c) => (
          <Pressable
            key={c._id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/search', params: { category: c.slug, title: loc(c.name) } })}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
          >
            <View style={[styles.band, { backgroundColor: c.color }]}>
              <Ionicons name={c.icon || 'leaf'} size={40} color={colors.white} />
              <Ionicons name="leaf" size={110} color="rgba(255,255,255,0.1)" style={styles.watermark} />
            </View>
            <View style={{ padding: space.md }}>
              <Txt variant="bodyLg" weight="bold">
                {loc(c.name)}
              </Txt>
              <Txt variant="caption" color={colors.inkSoft} numberOfLines={2}>
                {loc(c.description)}
              </Txt>
              <Txt variant="caption" weight="semibold" color={colors.primary} style={{ marginTop: 4 }}>
                {t('plantsCount', { n: c.plantCount })}
              </Txt>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: { width: '47.5%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow },
  band: { height: 96, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  watermark: { position: 'absolute', right: -24, bottom: -30 },
});
