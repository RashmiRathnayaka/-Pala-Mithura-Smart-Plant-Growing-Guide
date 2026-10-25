/** Screen 19 – Administrator dashboard: statistics, services, recent activity. */
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { formatDateTime } from '../../lib/format';
import { Banner, Card, ErrorView, InfoRow, Loading, Screen, SectionTitle, Stat, Txt } from '../../components/ui';
import { StaffStatusBadge } from '../../components/recommendation';
import { colors, radius, space } from '../../theme';

/** Tiny bar chart of reports per day (last 14 days). */
function DailyBars({ days }) {
  const { t } = useI18n();
  if (!days?.length) return null;
  const max = Math.max(...days.map((d) => d.count), 1);
  return (
    <Card>
      <Txt weight="bold" style={{ marginBottom: space.md }}>
        {t('reports30')}
      </Txt>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 90 }}
        accessibilityLabel={days.map((d) => `${d.date}: ${d.count}`).join(', ')}
      >
        {days.map((d) => (
          <View key={d.date} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Txt variant="caption" color={colors.inkSoft} style={{ fontSize: 10, lineHeight: 14 }}>
              {d.count}
            </Txt>
            <View style={{ width: '100%', height: Math.max(4, (d.count / max) * 64), backgroundColor: colors.primary, borderRadius: 3 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Txt variant="caption" color={colors.muted}>
          {days[0].date.slice(5)}
        </Txt>
        <Txt variant="caption" color={colors.muted}>
          {days[days.length - 1].date.slice(5)}
        </Txt>
      </View>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const stats = useApi('/admin/stats');
  const activity = useApi('/admin/activity', { limit: 15 });

  if (stats.loading) return <Loading />;
  if (stats.error) return <ErrorView error={stats.error} onRetry={stats.reload} />;
  const s = stats.data.stats;
  const reload = () => [stats, activity].forEach((x) => x.reload());

  return (
    <Screen refreshing={stats.refreshing} onRefresh={reload}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.lg }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color={colors.inkSoft}>
            {t('role_admin')}
          </Txt>
          <Txt variant="title" weight="bold">
            {user?.name}
          </Txt>
        </View>
        <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel={t('profile')} hitSlop={8}>
          <Ionicons name="person-circle-outline" size={30} color={colors.primary} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <Stat value={s.users.user} label={t('users')} icon="people" onPress={() => router.push('/admin/users')} />
        <Stat
          value={s.users.instructor}
          label={t('instructors')}
          icon="school"
          tone="soil"
          onPress={() => router.push({ pathname: '/admin/users', params: { role: 'instructor' } })}
        />
        <Stat value={s.plants} label={t('plants')} icon="leaf" onPress={() => router.push('/admin/plants')} />
        <Stat
          value={s.diseases}
          label={t('diseases')}
          icon="bug"
          tone="danger"
          onPress={() => router.push({ pathname: '/admin/plants', params: { tab: 'diseases' } })}
        />
        <Stat
          value={s.recommendationsByStatus?.pending_review || 0}
          label={t('pendingReviews')}
          icon="hourglass"
          tone="warn"
          onPress={() => router.push('/instructor/queue')}
        />
        <Stat value={s.avgReviewHours ?? '–'} label={t('avgReview')} icon="timer" />
      </View>

      <SectionTitle title={t('recStatus')} />
      <Card>
        {Object.entries(s.recommendationsByStatus || {}).map(([k, n], i, arr) => (
          <View
            key={k}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: space.sm,
              borderBottomWidth: i < arr.length - 1 ? 0.5 : 0,
              borderBottomColor: colors.line,
            }}
          >
            <View style={{ flex: 1 }}>
              <StaffStatusBadge status={k} />
            </View>
            <Txt weight="bold">{n}</Txt>
          </View>
        ))}
        {Object.entries(s.reviewDecisions || {}).length ? (
          <Txt variant="caption" color={colors.inkSoft} style={{ marginTop: space.sm }}>
            {Object.entries(s.reviewDecisions)
              .map(([k, n]) => `${t(`status_${k}`)}: ${n}`)
              .join('   ')}
          </Txt>
        ) : null}
      </Card>

      <View style={{ height: space.md }} />
      <DailyBars days={s.dailyReports} />

      <SectionTitle title={t('services')} />
      <Card>
        <InfoRow icon="sparkles" label={t('aiProvider')} value={`${s.services.ai.provider}${s.services.ai.model ? ` (${s.services.ai.model})` : ''}`} />
        <InfoRow icon="images" label={t('storageProvider')} value={s.services.storage} last />
      </Card>
      {s.services.ai.provider !== 'anthropic' ? <Banner tone="warn" text={t('aiTestOutput')} style={{ marginTop: space.md }} /> : null}

      <SectionTitle title={t('staffMenu')} />
      <Card>
        {[
          ['people', 'manageUsers', '/admin/users'],
          ['leaf', 'managePlants', '/admin/plants'],
          ['clipboard', 'reviewQueue', '/instructor/queue'],
          ['time', 'reviewHistory', '/instructor/history'],
        ].map(([icon, label, href], i, arr) => (
          <Pressable key={href} onPress={() => router.push(href)} accessibilityRole="button">
            <InfoRow icon={icon} label={t(label)} last={i === arr.length - 1} />
          </Pressable>
        ))}
      </Card>

      <SectionTitle title={t('recentActivity')} />
      <Card>
        {(activity.data?.items || []).map((a, i, arr) => (
          <View key={a._id} style={{ paddingVertical: space.sm, borderBottomWidth: i < arr.length - 1 ? 0.5 : 0, borderBottomColor: colors.line }}>
            <Txt>
              <Txt weight="semibold">{a.actor?.name || t('system')}</Txt> · {a.entityType} · {a.action}
            </Txt>
            <Txt variant="caption" color={colors.muted}>
              {formatDateTime(a.createdAt, lang)}
              {a.note ? ` · ${a.note}` : ''}
            </Txt>
          </View>
        ))}
      </Card>
      <View style={{ height: space.lg, borderRadius: radius.md }} />
    </Screen>
  );
}
