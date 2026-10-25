/** One item in the instructor review queue. */
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../lib/i18n';
import { formatDateTime } from '../lib/format';
import { Card, Txt } from './ui';
import { PlantImage } from './plant';
import { UrgencyTag } from './recommendation';
import { colors, radius, space } from '../theme';

export function QueueItem({ r }) {
  const { t, loc, lang } = useI18n();
  return (
    <Card onPress={() => router.push(`/instructor/review/${r._id}`)} style={{ marginBottom: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <PlantImage plant={r.plant} image={r.report?.photos?.[0]} height={64} style={{ width: 64 }} rounded={radius.md} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt weight="bold" numberOfLines={1}>
            {loc(r.plant?.name)} · {r.recommendationCode}
          </Txt>
          <Txt variant="caption" color={colors.inkSoft} numberOfLines={1}>
            {t('farmer')}: {r.user?.name}
            {r.user?.district ? ` (${r.user.district})` : ''}
          </Txt>
          <Txt variant="caption" color={colors.muted}>
            {formatDateTime(r.createdAt, lang)}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            {r.aiOutput ? <UrgencyTag urgency={r.aiOutput.urgency} /> : null}
            {!r.aiOutput ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="cloud-offline" size={14} color={colors.soil} />
                <Txt variant="caption" weight="bold" color={colors.soil}>
                  {t('aiFailedItems')}
                </Txt>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} style={{ alignSelf: 'center' }} />
      </View>
      {r.report?.symptoms?.length ? (
        <Txt variant="caption" color={colors.inkSoft} numberOfLines={1} style={{ marginTop: space.sm }}>
          {r.report.symptoms.map((s) => t(`sym_${s}`)).join(', ')}
        </Txt>
      ) : null}
    </Card>
  );
}
