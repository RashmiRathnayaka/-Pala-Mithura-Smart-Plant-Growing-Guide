/** Screen 12 – My Recommendations */
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { formatDate } from '../../lib/format';
import { Card, Chip, Empty, ErrorView, Loading, Screen, Txt } from '../../components/ui';
import { PlantImage } from '../../components/plant';
import { UserStatusBadge } from '../../components/recommendation';
import { colors, radius, space } from '../../theme';

export default function Advice() {
  const { t, loc, lang } = useI18n();
  const [filter, setFilter] = useState('all');
  const { data, error, loading, refreshing, reload } = useApi('/recommendations', filter === 'all' ? {} : { status: filter });

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.lg, flexWrap: 'wrap' }}>
        {[
          ['all', 'filterAll'],
          ['pending', 'filterPending'],
          ['published', 'filterPublished'],
        ].map(([k, label]) => (
          <Chip key={k} label={t(label)} selected={filter === k} onPress={() => setFilter(k)} />
        ))}
      </View>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorView error={error} onRetry={reload} />
      ) : !data?.items?.length ? (
        <Empty icon="chatbubbles-outline" text={t('recsEmpty')} actionTitle={t('reportProblem')} onAction={() => router.push('/report')} />
      ) : (
        data.items.map((r) => {
          const unread = r.status === 'published' && !r.userViewedAt;
          const href = r.status === 'published' ? `/recommendation/${r._id}` : `/analysis/${r._id}`;
          const content = r.final || r.preliminary;
          return (
            <Card key={r._id} onPress={() => router.push(href)} style={{ marginBottom: space.md }}>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <PlantImage plant={r.plant} image={r.report?.photos?.[0]} height={64} style={{ width: 64 }} rounded={radius.md} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Txt weight="bold" style={{ flex: 1 }} numberOfLines={1}>
                      {loc(r.plant?.name)}
                    </Txt>
                    {unread ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }} accessibilityLabel="new" /> : null}
                  </View>
                  <Txt variant="caption" color={colors.muted}>
                    {r.recommendationCode} · {formatDate(r.createdAt, lang)}
                  </Txt>
                  <UserStatusBadge rec={r} />
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} style={{ alignSelf: 'center' }} />
              </View>
              {content?.summary ? (
                <Txt variant="caption" color={colors.inkSoft} numberOfLines={2} style={{ marginTop: space.sm }}>
                  {content.summary}
                </Txt>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}
