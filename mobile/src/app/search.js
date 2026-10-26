/** Screen 5 – Plant search results (by Sinhala, English or scientific name; category filter). */
import { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../lib/i18n';
import { useApi } from '../lib/useApi';
import { Chip, Empty, ErrorView, Loading, Txt } from '../components/ui';
import { PlantRow } from '../components/plant';
import { colors, fonts, radius, space, themed } from '../theme';

export default function Search() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { t, loc } = useI18n();
  const [text, setText] = useState(params.q || '');
  const [q, setQ] = useState(params.q || '');
  const [category, setCategory] = useState(params.category || '');
  const cats = useApi('/categories');
  const { data, error, loading, reload } = useApi('/plants', { q, category, sort: params.sort || 'name', limit: 50 });

  useLayoutEffect(() => {
    navigation.setOptions({ title: params.title || t('search') });
  }, [navigation, params.title, t]);

  // Search as you type, with a short pause.
  useEffect(() => {
    const id = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(id);
  }, [text]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: space.lg, paddingBottom: 0 }}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoFocus={!params.category && !params.sort}
            returnKeyType="search"
            accessibilityLabel={t('search')}
          />
          {text ? <Ionicons name="close-circle" size={20} color={colors.muted} onPress={() => setText('')} accessibilityLabel={t('close')} /> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: space.md }}>
          <Chip label={t('allCategories')} selected={!category} onPress={() => setCategory('')} />
          {(cats.data?.items || []).map((c) => (
            <Chip key={c._id} label={loc(c.name)} selected={category === c.slug} onPress={() => setCategory(c.slug)} />
          ))}
        </ScrollView>
      </View>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorView error={error} onRetry={reload} />
      ) : (
        <FlatList
          data={data.items}
          keyExtractor={(p) => p._id}
          contentContainerStyle={{ padding: space.lg, paddingTop: 0, paddingBottom: space.xxl }}
          ListHeaderComponent={
            <Txt variant="caption" color={colors.inkSoft} style={{ marginBottom: space.sm }}>
              {t('results', { n: data.total })}
            </Txt>
          }
          ListEmptyComponent={<Empty icon="search" text={t('noResults')} />}
          renderItem={({ item }) => <PlantRow plant={item} />}
        />
      )}
    </View>
  );
}

const styles = themed(() => ({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: space.md, outlineStyle: 'none' },
}));
