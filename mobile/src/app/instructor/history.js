/** Screen 18 – Instructor review history */
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { formatDateTime } from '../../lib/format';
import { Card, Chip, Empty, ErrorView, Loading, Screen, Txt } from '../../components/ui';
import { StaffStatusBadge } from '../../components/recommendation';
import { colors, space } from '../../theme';

export default function History() {
  const { t, loc, lang } = useI18n();
  const [decision, setDecision] = useState('');
  const { data, error, loading, reload, refreshing } = useApi('/instructor/history', decision ? { decision } : {});

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', marginBottom: space.lg }}>
        <Chip label={t('filterAll')} selected={!decision} onPress={() => setDecision('')} />
        {['accepted', 'modified', 'rejected'].map((d) => (
          <Chip key={d} label={t(`status_${d}`)} selected={decision === d} onPress={() => setDecision(d)} />
        ))}
      </View>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorView error={error} onRetry={reload} />
      ) : !data.items.length ? (
        <Empty icon="time-outline" text={t('historyEmpty')} />
      ) : (
        data.items.map((r) => (
          <Card key={r._id} onPress={() => router.push(`/instructor/review/${r._id}`)} style={{ marginBottom: space.md, gap: 4 }}>
            <Txt weight="bold">
              {loc(r.plant?.name)} · {r.recommendationCode}
            </Txt>
            <Txt variant="caption" color={colors.inkSoft}>
              {t('farmer')}: {r.user?.name} · {formatDateTime(r.review?.reviewedAt, lang)}
            </Txt>
            {r.review?.reviewer?.name ? (
              <Txt variant="caption" color={colors.inkSoft}>
                {t('reviewedBy', { name: r.review.reviewer.name })}
              </Txt>
            ) : null}
            <StaffStatusBadge status={r.status} decision={r.review?.decision} />
          </Card>
        ))
      )}
    </Screen>
  );
}
