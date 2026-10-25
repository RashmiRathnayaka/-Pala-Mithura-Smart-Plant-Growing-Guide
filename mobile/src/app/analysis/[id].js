/** Screen 11 – AI analysis results (preliminary, clearly not instructor-approved). */
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { formatDateTime } from '../../lib/format';
import { Banner, Button, ErrorView, Loading, Screen, Txt } from '../../components/ui';
import { AiNotice, RecommendationContent, UserStatusBadge } from '../../components/recommendation';
import { ReportSummary } from '../../components/ReportSummary';
import { colors, space } from '../../theme';

export default function Analysis() {
  const { id } = useLocalSearchParams();
  const { t, loc, lang } = useI18n();
  const { data, error, loading, reload, refreshing } = useApi(`/recommendations/${id}`);

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  const rec = data.recommendation;

  // Once published, the instructor's version is the one to read.
  if (rec.status === 'published') return <Redirect href={`/recommendation/${rec._id}`} />;

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.md }}>
        <View style={{ flex: 1 }}>
          <Txt variant="title" weight="bold">
            {loc(rec.plant?.name)}
          </Txt>
          <Txt variant="caption" color={colors.muted}>
            {rec.recommendationCode} · {formatDateTime(rec.createdAt, lang)}
          </Txt>
        </View>
        <UserStatusBadge rec={rec} />
      </View>

      <Banner tone="info" icon="hourglass" text={t('waitingReview')} style={{ marginBottom: space.md }} />

      {rec.preliminary ? (
        <>
          <AiNotice testOutput={rec.aiIsTestOutput} />
          <View style={{ height: space.md }} />
          <RecommendationContent content={rec.preliminary} />
        </>
      ) : (
        <Banner tone="warn" text={t('aiFailed')} />
      )}

      <ReportSummary report={rec.report} />

      <Button
        title={t('goToRecommendations')}
        icon="chatbubbles"
        variant="secondary"
        onPress={() => router.replace('/advice')}
        style={{ marginTop: space.lg }}
      />
    </Screen>
  );
}
