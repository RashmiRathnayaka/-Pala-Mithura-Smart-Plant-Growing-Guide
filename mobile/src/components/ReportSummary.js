/** The farmer's original report: photos, symptoms, parts, description. */
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { imageUrl } from '../lib/config';
import { useI18n } from '../lib/i18n';
import { Card, Txt } from './ui';
import { colors, radius, space } from '../theme';

export function ReportSummary({ report, title }) {
  const { t } = useI18n();
  if (!report) return null;
  return (
    <Card style={{ marginTop: space.md }}>
      <Txt variant="bodyLg" weight="bold" style={{ marginBottom: space.sm }}>
        {title || t('yourReport')}
      </Txt>
      {report.photos?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, marginBottom: space.md }}>
          {report.photos.map((p) => (
            <Image
              key={p._id || p.url}
              source={{ uri: imageUrl(p.url) }}
              style={{ width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.primarySoft }}
              contentFit="cover"
            />
          ))}
        </ScrollView>
      ) : null}
      {report.symptoms?.length ? (
        <View style={{ marginBottom: space.sm }}>
          <Txt variant="caption" color={colors.muted}>
            {t('reportedSymptoms')}
          </Txt>
          <Txt>{report.symptoms.map((s) => t(`sym_${s}`)).join(', ')}</Txt>
        </View>
      ) : null}
      {report.affectedParts?.length ? (
        <View style={{ marginBottom: space.sm }}>
          <Txt variant="caption" color={colors.muted}>
            {t('affectedPart')}
          </Txt>
          <Txt>{report.affectedParts.map((p) => t(`part_${p}`)).join(', ')}</Txt>
        </View>
      ) : null}
      {report.durationDays != null ? (
        <View style={{ marginBottom: space.sm }}>
          <Txt variant="caption" color={colors.muted}>
            {t('howLong')}
          </Txt>
          <Txt>
            {report.durationDays} {t('days')}
          </Txt>
        </View>
      ) : null}
      {report.description ? (
        <View>
          <Txt variant="caption" color={colors.muted}>
            {t('farmerDescription')}
          </Txt>
          <Txt>{report.description}</Txt>
        </View>
      ) : null}
    </Card>
  );
}
