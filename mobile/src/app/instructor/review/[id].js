/** Screens 16–17 – Review a recommendation and Accept / Modify / Reject it. */
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { errorMessage, useI18n } from '../../../lib/i18n';
import { useApi } from '../../../lib/useApi';
import { formatDate, formatDateTime } from '../../../lib/format';
import { Banner, Button, Card, ErrorView, Field, InfoRow, Loading, Screen, SectionTitle, Txt } from '../../../components/ui';
import { PlantImage, VerificationBadge } from '../../../components/plant';
import { AiNotice, RecommendationContent, StaffStatusBadge } from '../../../components/recommendation';
import { ReportSummary } from '../../../components/ReportSummary';
import { RecommendationEditor, contentToDraft, draftToContent } from '../../../components/RecommendationEditor';
import { colors, radius, space } from '../../../theme';

const DECISIONS = [
  { key: 'accepted', icon: 'checkmark-circle', color: colors.verified, label: 'accept', help: 'acceptHelp' },
  { key: 'modified', icon: 'create', color: colors.soil, label: 'modify', help: 'modifyHelp' },
  { key: 'rejected', icon: 'close-circle', color: colors.danger, label: 'reject', help: 'rejectHelp' },
];

export default function Review() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { t, loc, lang } = useI18n();
  const { data, error, loading, reload, refreshing, setData } = useApi(`/instructor/recommendations/${id}`);
  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState('');
  const [explanation, setExplanation] = useState('');
  const [reason, setReason] = useState('');
  const [alternative, setAlternative] = useState('');
  const [infoReq, setInfoReq] = useState('');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  const rec = data.recommendation;
  const up = rec.userPlant;
  const pending = rec.status === 'pending_review';
  const canDecide = pending && user.role === 'instructor';

  const choose = (k) => {
    setDecision(k);
    setMsg(null);
    if (k === 'modified' && !draft) setDraft(contentToDraft(rec.aiOutput || { language: rec.report?.language }));
  };

  const submit = async () => {
    setMsg(null);
    let body;
    if (decision === 'accepted') body = { decision, comment: comment.trim() || undefined };
    if (decision === 'modified') {
      if (explanation.trim().length < 5) return setMsg({ tone: 'danger', text: t('explainChanges') });
      body = { decision, content: draftToContent(draft), changeExplanation: explanation.trim(), comment: comment.trim() || undefined };
    }
    if (decision === 'rejected') {
      if (reason.trim().length < 5) return setMsg({ tone: 'danger', text: t('reasonRequired') });
      body = {
        decision,
        rejectionReason: reason.trim(),
        alternativeRecommendation: alternative.trim() || undefined,
        additionalInfoRequested: infoReq.trim() || undefined,
        comment: comment.trim() || undefined,
      };
    }
    setBusy(true);
    try {
      const res = await api.post(`/instructor/recommendations/${id}/review`, body);
      setData({ ...data, recommendation: res.recommendation });
      setDecision(null);
      setMsg({ tone: 'success', text: t('sentToFarmer') });
      reload();
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err, t) });
      if (err.code === 'ALREADY_REVIEWED') reload();
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api.post(`/instructor/recommendations/${id}/regenerate`);
      reload();
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err, t) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {/* Plant & farmer */}
      <Card style={{ flexDirection: 'row', gap: space.md }}>
        <PlantImage plant={rec.plant} height={72} style={{ width: 72 }} rounded={radius.md} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyLg" weight="bold">
            {loc(rec.plant?.name)}{' '}
            <Txt variant="caption" color={colors.inkSoft} style={{ fontStyle: 'italic' }}>
              {rec.plant?.scientificName}
            </Txt>
          </Txt>
          <Txt variant="caption" color={colors.inkSoft}>
            {rec.recommendationCode} · {formatDateTime(rec.createdAt, lang)}
          </Txt>
          <Txt variant="caption" color={colors.inkSoft}>
            {t('farmer')}: {rec.user?.name}
            {rec.user?.district ? ` (${rec.user.district})` : ''}
          </Txt>
          <StaffStatusBadge status={rec.status} decision={rec.review?.decision} />
        </View>
      </Card>
      <Pressable
        onPress={() => router.push(`/plant/${rec.plant?._id}`)}
        accessibilityRole="link"
        style={{ paddingVertical: space.sm, flexDirection: 'row', gap: 6, alignItems: 'center' }}
      >
        <VerificationBadge status={rec.plant?.verification?.status} />
        <Txt variant="caption" weight="semibold" color={colors.primary}>
          {t('growingGuide')}
        </Txt>
      </Pressable>

      {msg ? <Banner tone={msg.tone} text={msg.text} style={{ marginVertical: space.md }} /> : null}

      <ReportSummary report={rec.report} title={t('farmerReport')} />

      {up ? (
        <>
          <SectionTitle title={t('growingHistory')} />
          <Card>
            <InfoRow icon="calendar" label={t('plantingDate')} value={`${formatDate(up.plantingDate, lang)}`} />
            <InfoRow icon="trending-up" label={t('currentStage')} value={t(`stage_${up.growthStage}`)} />
            <InfoRow icon="water" label={t('lastWatered')} value={up.lastWateredAt ? formatDate(up.lastWateredAt, lang) : t('notRecorded')} />
            <InfoRow
              icon="flask"
              label={t('fertilizer')}
              value={
                (up.fertilizerLog || []).length
                  ? up.fertilizerLog
                      .slice(-4)
                      .map((f) => `${formatDate(f.date, lang)}: ${f.type} ${f.quantity || ''}`)
                      .join('\n')
                  : t('notRecorded')
              }
              last
            />
          </Card>
        </>
      ) : null}

      <SectionTitle title={t('aiFindings')} />
      {rec.aiOutput ? (
        <>
          {rec.aiMeta?.isTestOutput ? <AiNotice testOutput /> : null}
          <Txt variant="caption" color={colors.muted} style={{ marginVertical: space.sm }}>
            {rec.aiMeta?.provider} {rec.aiMeta?.model} · {t('photos')}: {rec.aiMeta?.imagesAnalyzed ?? 0}
          </Txt>
          <RecommendationContent content={rec.aiOutput} />
        </>
      ) : (
        <Banner tone="warn" text={`${t('noAiOutput')}${rec.aiMeta?.error ? `\n(${rec.aiMeta.error})` : ''}`} />
      )}
      {pending ? (
        <Button
          title={t('retryAi')}
          icon="refresh"
          variant="ghost"
          onPress={regenerate}
          loading={busy && !decision}
          style={{ alignSelf: 'flex-start', marginTop: space.sm }}
        />
      ) : null}

      {/* Decision */}
      {canDecide ? (
        <>
          <SectionTitle title={t('review')} />
          <View style={{ gap: space.sm }}>
            {DECISIONS.map((d) => {
              const disabled = d.key === 'accepted' && !rec.aiOutput;
              const active = decision === d.key;
              return (
                <Pressable
                  key={d.key}
                  disabled={disabled}
                  onPress={() => choose(d.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active, disabled }}
                  style={[
                    styles.decision,
                    { borderColor: active ? d.color : colors.line },
                    active && { backgroundColor: colors.surface },
                    disabled && { opacity: 0.45 },
                  ]}
                >
                  <Ionicons name={d.icon} size={28} color={d.color} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyLg" weight="bold" color={d.color}>
                      {t(d.label)}
                    </Txt>
                    <Txt variant="caption" color={colors.inkSoft}>
                      {t(d.help)}
                    </Txt>
                  </View>
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? d.color : colors.muted} />
                </Pressable>
              );
            })}
          </View>

          {decision ? (
            <Card style={{ marginTop: space.lg }}>
              {decision === 'modified' && draft ? (
                <>
                  <RecommendationEditor draft={draft} onChange={setDraft} />
                  <Field label={t('explainChanges')} value={explanation} onChangeText={setExplanation} multiline />
                </>
              ) : null}
              {decision === 'rejected' ? (
                <>
                  <Field label={t('reasonRequired')} value={reason} onChangeText={setReason} multiline />
                  <Field label={t('alternativeOptional')} value={alternative} onChangeText={setAlternative} multiline />
                  <Field label={t('infoOptional')} value={infoReq} onChangeText={setInfoReq} multiline />
                </>
              ) : null}
              <Field label={t('commentOptional')} value={comment} onChangeText={setComment} multiline />
              <Button
                title={t('confirmAndSend')}
                icon="paper-plane"
                variant={decision === 'rejected' ? 'dangerSolid' : 'primary'}
                onPress={submit}
                loading={busy}
              />
            </Card>
          ) : null}
        </>
      ) : null}

      {/* Decision already made */}
      {rec.review?.decision ? (
        <>
          <SectionTitle title={t('instructorFeedback')} />
          <Card style={{ gap: space.sm }}>
            <StaffStatusBadge status={rec.review.decision} />
            {rec.review.reviewer?.name ? (
              <Txt variant="caption" color={colors.inkSoft}>
                {t('reviewedBy', { name: rec.review.reviewer.name })} · {formatDateTime(rec.review.reviewedAt, lang)}
              </Txt>
            ) : null}
            {rec.review.rejectionReason ? <InfoRow label={t('rejectionReason')} value={rec.review.rejectionReason} /> : null}
            {rec.review.alternativeRecommendation ? <InfoRow label={t('alternativeAdvice')} value={rec.review.alternativeRecommendation} /> : null}
            {rec.review.additionalInfoRequested ? <InfoRow label={t('infoRequested')} value={rec.review.additionalInfoRequested} /> : null}
            {rec.review.changeExplanation ? <InfoRow label={t('changesMade')} value={rec.review.changeExplanation} /> : null}
            {rec.review.comment ? <InfoRow label={t('instructorComment')} value={rec.review.comment} last /> : null}
          </Card>
          {rec.review.decision === 'modified' && rec.finalRecommendation ? (
            <>
              <SectionTitle title={t('approvedAdvice')} />
              <RecommendationContent content={rec.finalRecommendation} />
            </>
          ) : null}
        </>
      ) : null}

      {/* Audit trail */}
      <SectionTitle title={t('auditTrail')} />
      <Card>
        {(data.audit || []).map((a, i) => (
          <View key={a._id} style={[styles.audit, i < data.audit.length - 1 && styles.line]}>
            <Ionicons name="ellipse" size={10} color={colors.primary} style={{ marginTop: 8 }} />
            <View style={{ flex: 1 }}>
              <Txt weight="semibold">{t(`audit_${a.action}`)}</Txt>
              <Txt variant="caption" color={colors.inkSoft}>
                {a.actor?.name || t('system')} · {formatDateTime(a.createdAt, lang)}
              </Txt>
              {a.note ? (
                <Txt variant="caption" color={colors.inkSoft}>
                  {a.note}
                </Txt>
              ) : null}
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  decision: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    backgroundColor: colors.bg,
  },
  audit: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm },
  line: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
});
