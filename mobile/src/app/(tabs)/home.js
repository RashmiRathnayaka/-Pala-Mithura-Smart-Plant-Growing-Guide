/** Screen 3 – Home dashboard: search, categories, suggested, popular, recent, favourites. */
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { ErrorView, Loading, SectionTitle, Txt } from '../../components/ui';
import { PlantTile } from '../../components/plant';
import { colors, fonts, radius, shadow, space } from '../../theme';

function Carousel({ items }) {
  if (!items?.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.sm }}
      style={{ marginHorizontal: -space.lg }}
    >
      {items.map((p) => (
        <PlantTile key={p._id} plant={p} />
      ))}
    </ScrollView>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { t, loc } = useI18n();
  const [q, setQ] = useState('');
  const cats = useApi('/categories');
  const rec = useApi('/plants/recommended');
  const popular = useApi('/plants', { sort: 'popular', limit: 8 });
  const recent = useApi('/plants', { sort: 'recent', limit: 8 });
  const favs = useApi('/favorites');
  const notes = useApi('/notifications/unread-count');

  const refreshing = cats.refreshing || rec.refreshing;
  const reload = () => [cats, rec, popular, recent, favs, notes].forEach((x) => x.reload());

  const search = () => router.push({ pathname: '/search', params: { q } });
  const ctx = rec.data?.context;

  if (cats.loading && !cats.data) return <Loading />;
  if (cats.error && !cats.data) return <ErrorView error={cats.error} onRetry={reload} />;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl * 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} colors={[colors.primary]} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Txt variant="caption" color={colors.inkSoft}>
              {t('appName')}
            </Txt>
            <Txt variant="title" weight="bold" numberOfLines={1}>
              {t('hello', { name: user?.name?.split(' ')[0] || '' })}
            </Txt>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('notifications')}
            onPress={() => router.push('/notifications')}
            style={styles.bell}
            hitSlop={6}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            {notes.data?.unread ? (
              <View style={styles.dot}>
                <Txt variant="caption" weight="bold" color={colors.white} style={{ fontSize: 11, lineHeight: 16 }}>
                  {notes.data.unread > 9 ? '9+' : notes.data.unread}
                </Txt>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={search}
            accessibilityLabel={t('search')}
          />
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/report')} style={styles.reportCta}>
          <View style={styles.reportIcon}>
            <Ionicons name="camera" size={26} color={colors.soil} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyLg" weight="bold" color={colors.white}>
              {t('reportCta')}
            </Txt>
            <Txt color="rgba(255,255,255,0.88)">{t('reportCtaSub')}</Txt>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.white} />
        </Pressable>

        <SectionTitle title={t('categories')} action={t('seeAll')} onAction={() => router.push('/categories')} />
        <View style={styles.catGrid}>
          {(cats.data?.items || []).map((c) => (
            <Pressable
              key={c._id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/search', params: { category: c.slug, title: loc(c.name) } })}
              style={styles.cat}
            >
              <View style={[styles.catIcon, { backgroundColor: c.color }]}>
                <Ionicons name={c.icon || 'leaf'} size={24} color={colors.white} />
              </View>
              <Txt variant="caption" weight="semibold" numberOfLines={2} style={{ textAlign: 'center' }}>
                {loc(c.name)}
              </Txt>
            </Pressable>
          ))}
        </View>

        {rec.data?.items?.length ? (
          <>
            <SectionTitle title={t('recommendedForYou')} />
            {ctx ? (
              <Txt variant="caption" color={colors.inkSoft} style={{ marginTop: -space.sm, marginBottom: space.md }}>
                {t('recommendedContext', { season: t(ctx.season), zone: ctx.zone ? t(`zone_${ctx.zone}`) : user?.district || '' })}
              </Txt>
            ) : null}
            <Carousel items={rec.data.items} />
          </>
        ) : null}

        {favs.data?.items?.length ? (
          <>
            <SectionTitle title={t('favorites')} action={t('seeAll')} onAction={() => router.push('/favorites')} />
            <Carousel items={favs.data.items} />
          </>
        ) : null}

        <SectionTitle title={t('popular')} action={t('seeAll')} onAction={() => router.push({ pathname: '/search', params: { sort: 'popular' } })} />
        <Carousel items={popular.data?.items} />

        <SectionTitle title={t('recent')} action={t('seeAll')} onAction={() => router.push({ pathname: '/search', params: { sort: 'recent' } })} />
        <Carousel items={recent.data?.items} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  bell: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  dot: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: space.md, outlineStyle: 'none' },
  reportCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: space.lg,
    marginTop: space.lg,
  },
  reportIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.soilSoft, alignItems: 'center', justifyContent: 'center' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cat: { width: '23%', minWidth: 72, alignItems: 'center', gap: 6 },
  catIcon: { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
});
