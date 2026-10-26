/** Recommendation display: status badges, the AI notice, and the content sections. */
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, themed } from '../theme';
import { useI18n } from '../lib/i18n';
import { Banner, Bullets, Card, Txt } from './ui';

/** What the farmer sees: under review / verified / rejected. */
export function UserStatusBadge({ rec }) {
  const { t } = useI18n();
  let key = 'pending';
  if (rec.status === 'published') key = rec.isInstructorVerified ? 'verified' : 'rejected';
  const m = {
    pending: { icon: 'hourglass', fg: colors.pending, bg: colors.pendingSoft },
    verified: { icon: 'shield-checkmark', fg: colors.verified, bg: colors.verifiedSoft },
    rejected: { icon: 'close-circle', fg: colors.danger, bg: colors.dangerSoft },
  }[key];
  return (
    <View style={[styles.badge, { backgroundColor: m.bg }]}>
      <Ionicons name={m.icon} size={16} color={m.fg} />
      <Txt variant="caption" weight="bold" color={m.fg}>
        {t(`userStatus_${key}`)}
      </Txt>
    </View>
  );
}

/** Staff view of the six workflow statuses (+ decision once published). */
export function StaffStatusBadge({ status, decision }) {
  const { t } = useI18n();
  const m = {
    ai_generated: { icon: 'sparkles', fg: colors.info, bg: colors.infoSoft },
    pending_review: { icon: 'hourglass', fg: colors.pending, bg: colors.pendingSoft },
    accepted: { icon: 'checkmark-circle', fg: colors.verified, bg: colors.verifiedSoft },
    modified: { icon: 'create', fg: colors.soil, bg: colors.soilSoft },
    rejected: { icon: 'close-circle', fg: colors.danger, bg: colors.dangerSoft },
    published: { icon: 'paper-plane', fg: colors.verified, bg: colors.verifiedSoft },
  }[status] || { icon: 'help', fg: colors.inkSoft, bg: colors.line };
  return (
    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
      <View style={[styles.badge, { backgroundColor: m.bg }]}>
        <Ionicons name={m.icon} size={14} color={m.fg} />
        <Txt variant="caption" weight="bold" color={m.fg}>
          {t(`status_${status}`)}
        </Txt>
      </View>
      {status === 'published' && decision ? <StaffStatusBadge status={decision} /> : null}
    </View>
  );
}

export function UrgencyTag({ urgency }) {
  const { t } = useI18n();
  if (!urgency) return null;
  const fg = { low: colors.inkSoft, medium: colors.pending, high: colors.danger, critical: colors.danger }[urgency];
  return (
    <View style={[styles.badge, { borderWidth: 1, borderColor: fg }]}>
      <Ionicons name={urgency === 'critical' ? 'warning' : 'speedometer'} size={14} color={fg} />
      <Txt variant="caption" weight="bold" color={fg}>
        {t('urgency')}: {t(`urgency_${urgency}`)}
      </Txt>
    </View>
  );
}

export function AiNotice({ testOutput }) {
  const { t } = useI18n();
  return (
    <View style={{ gap: space.sm }}>
      <Banner tone="warn" title={t('aiNoticeTitle')} text={t('aiNotice')} icon="sparkles" />
      {testOutput ? <Banner tone="info" text={t('aiTestOutput')} icon="flask" /> : null}
    </View>
  );
}

function Block({ icon, title, children, tone }) {
  return (
    <Card style={{ marginBottom: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
        <Ionicons name={icon} size={20} color={tone || colors.primary} />
        <Txt variant="bodyLg" weight="bold">
          {title}
        </Txt>
      </View>
      {children}
    </Card>
  );
}

/** Renders the recommendation content structure (AI draft or final approved version). */
export function RecommendationContent({ content }) {
  const { t } = useI18n();
  if (!content) return null;
  const likeColor = { high: colors.danger, medium: colors.pending, low: colors.inkSoft };
  const prioColor = { immediate: colors.danger, soon: colors.pending, routine: colors.inkSoft };
  return (
    <View>
      {content.summary ? (
        <Block icon="document-text" title={t('summary')}>
          <Txt>{content.summary}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
            <UrgencyTag urgency={content.urgency} />
            {content.confidence?.level ? (
              <View style={[styles.badge, { backgroundColor: colors.line }]}>
                <Ionicons name="analytics" size={14} color={colors.inkSoft} />
                <Txt variant="caption" weight="bold" color={colors.inkSoft}>
                  {t('confidence')}: {t(`confidence_${content.confidence.level}`)}
                </Txt>
              </View>
            ) : null}
          </View>
          {content.confidence?.explanation ? (
            <Txt variant="caption" color={colors.inkSoft} style={{ marginTop: space.sm }}>
              {content.confidence.explanation}
            </Txt>
          ) : null}
        </Block>
      ) : null}

      {content.possibleCauses?.length ? (
        <Block icon="search" title={t('possibleCauses')}>
          <View style={{ gap: space.md }}>
            {content.possibleCauses.map((c, i) => (
              <View key={i} style={styles.cause}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
                  <Txt weight="bold" style={{ flex: 1 }}>
                    {c.name}
                  </Txt>
                  <Txt variant="caption" weight="semibold" color={likeColor[c.likelihood]}>
                    {t(`likelihood_${c.likelihood}`)}
                  </Txt>
                </View>
                {c.evidence ? (
                  <Txt variant="caption" color={colors.inkSoft}>
                    {t('evidence')}: {c.evidence}
                  </Txt>
                ) : null}
              </View>
            ))}
          </View>
        </Block>
      ) : null}

      {content.suggestedActions?.length ? (
        <Block icon="checkmark-done" title={t('suggestedActions')}>
          <View style={{ gap: space.md }}>
            {content.suggestedActions.map((a, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
                <View style={styles.stepNum}>
                  <Txt variant="caption" weight="bold" color={colors.onPrimary}>
                    {i + 1}
                  </Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt>{a.action}</Txt>
                  <Txt variant="caption" weight="semibold" color={prioColor[a.priority]}>
                    {t(`priority_${a.priority}`)}
                  </Txt>
                </View>
              </View>
            ))}
          </View>
        </Block>
      ) : null}

      {content.fertilizerAdvice ? (
        <Block icon="flask" title={t('fertilizerAdvice')} tone={colors.soil}>
          <Txt>{content.fertilizerAdvice}</Txt>
        </Block>
      ) : null}
      {content.requiredMaterials?.length ? (
        <Block icon="construct" title={t('requiredMaterials')}>
          <Bullets items={content.requiredMaterials} />
        </Block>
      ) : null}
      {content.furtherChecks?.length ? (
        <Block icon="eye" title={t('furtherChecks')}>
          <Bullets items={content.furtherChecks} />
        </Block>
      ) : null}
      {content.additionalInfoNeeded?.length ? (
        <Block icon="camera" title={t('additionalInfoNeeded')} tone={colors.info}>
          <Bullets items={content.additionalInfoNeeded} color={colors.info} />
        </Block>
      ) : null}
      {content.preventionMethods?.length ? (
        <Block icon="shield" title={t('preventionMethods')}>
          <Bullets items={content.preventionMethods} />
        </Block>
      ) : null}
      {content.safetyPrecautions?.length ? (
        <Block icon="warning" title={t('safetyPrecautions')} tone={colors.danger}>
          <Bullets items={content.safetyPrecautions} icon="alert-circle" color={colors.danger} />
        </Block>
      ) : null}
    </View>
  );
}

const styles = themed(() => ({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  cause: { borderLeftWidth: 3, borderLeftColor: colors.primarySoft, paddingLeft: space.md, gap: 2 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
}));
