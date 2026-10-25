/** Screen 13 – Recommendation details & Agricultural Instructor feedback */
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { formatDateTime } from '../../lib/format';
import { Banner, Button, Card, ErrorView, Loading, Screen, Txt } from '../../components/ui';
import { RecommendationContent, UserStatusBadge } from '../../components/recommendation';
import { ReportSummary } from '../../components/ReportSummary';
import { colors, space } from '../../theme';

function FeedbackBlock({ label, text, icon = 'chatbox-ellipses', color = colors.primary }) {
  if (!text) return null;
  return (
    <View style={{ marginTop: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={18} color={color} />
        <Txt weight="bold">{label}</Txt>
      </View>
      <Txt>{text}</Txt>
    </View>
  );
}

export default function RecommendationDetails() {
  const { id } = useLocalSearchParams();
  const { t, loc, lang } = useI18n();
  const { data, error, loading, reload, refreshing } = useApi(`/recommendations/${id}`);

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  const rec = data.recommendation;

  if (rec.status !== 'published') {
    return (
      <Screen>
        <Banner tone="info" icon="hourglass" text={t('waitingReview')} />
        <Button
          title={t('viewPreliminary')}
          icon="sparkles"
          variant="secondary"
          onPress={() => router.replace(`/analysis/${rec._id}`)}
          style={{ marginTop: space.lg }}
        />
      </Screen>
    );
  }

  const r = rec.review || {};
  const rejected = r.decision === 'rejected';

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.md }}>
        <View style={{ flex: 1 }}>
          <Txt variant="title" weight="bold">
            {loc(rec.plant?.name)}
          </Txt>
          <Txt variant="caption" color={colors.muted}>
            {rec.recommendationCode}
          </Txt>
        </View>
        <UserStatusBadge rec={rec} />
      </View>

      <Card style={{ marginBottom: space.md, borderLeftWidth: 4, borderLeftColor: rejected ? colors.danger : colors.verified }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name={rejected ? 'close-circle' : 'shield-checkmark'} size={24} color={rejected ? colors.danger : colors.verified} />
          <Txt variant="bodyLg" weight="bold">
            {t('instructorFeedback')}
          </Txt>
        </View>
        <Txt variant="caption" color={colors.inkSoft}>
          {r.reviewerName ? `${t('reviewedBy', { name: r.reviewerName })} · ` : ''}
          {formatDateTime(r.reviewedAt, lang)}
        </Txt>
        <FeedbackBlock label={t('rejectionReason')} text={r.rejectionReason} icon="close-circle" color={colors.danger} />
        <FeedbackBlock label={t('infoRequested')} text={r.additionalInfoRequested} icon="camera" color={colors.info} />
        <FeedbackBlock label={t('alternativeAdvice')} text={r.alternativeRecommendation} icon="leaf" />
        <FeedbackBlock label={t('changesMade')} text={r.changeExplanation} icon="create" color={colors.soil} />
        <FeedbackBlock label={t('instructorComment')} text={r.comment} />
      </Card>

      {!rejected && rec.final ? (
        <>
          <Txt variant="title" weight="bold" style={{ marginVertical: space.sm }}>
            {t('approvedAdvice')}
          </Txt>
          <RecommendationContent content={rec.final} />
        </>
      ) : null}

      <ReportSummary report={rec.report} />

      {rejected ? (
        <Button
          title={t('sendNewReport')}
          icon="camera"
          onPress={() => router.push({ pathname: '/report', params: rec.userPlant ? { userPlant: rec.userPlant } : { plant: rec.plant?._id } })}
          style={{ marginTop: space.lg }}
        />
      ) : null}
    </Screen>
  );
}
