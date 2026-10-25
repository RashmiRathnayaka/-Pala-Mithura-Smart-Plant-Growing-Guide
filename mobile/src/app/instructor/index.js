/** Screen 15 – Agricultural Instructor dashboard */
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { relativeDay } from '../../lib/format';
import { Button, Card, ErrorView, InfoRow, Loading, Screen, SectionTitle, Stat, Txt } from '../../components/ui';
import { QueueItem } from '../../components/QueueItem';
import { colors, space } from '../../theme';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const dash = useApi('/instructor/dashboard');
  const queue = useApi('/instructor/queue');
  const notes = useApi('/notifications/unread-count');

  if (dash.loading) return <Loading />;
  if (dash.error) return <ErrorView error={dash.error} onRetry={dash.reload} />;
  const s = dash.data.stats;
  const reload = () => [dash, queue, notes].forEach((x) => x.reload());

  return (
    <Screen refreshing={dash.refreshing} onRefresh={reload}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.lg }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color={colors.inkSoft}>
            {t('role_instructor')}
          </Txt>
          <Txt variant="title" weight="bold">
            {user?.name}
          </Txt>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel={t('notifications')}
          hitSlop={8}
          style={{ padding: 8 }}
        >
          <Ionicons name="notifications-outline" size={26} color={colors.primary} />
          {notes.data?.unread ? (
            <View style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }} />
          ) : null}
        </Pressable>
        <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel={t('profile')} hitSlop={8} style={{ padding: 8 }}>
          <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <Stat value={s.pending} label={t('pendingReviews')} tone="warn" icon="hourglass" onPress={() => router.push('/instructor/queue')} />
        <Stat value={s.urgent} label={t('urgentItems')} tone="danger" icon="warning" onPress={() => router.push('/instructor/queue')} />
        <Stat value={s.aiFailed} label={t('aiFailedItems')} tone="soil" icon="cloud-offline" />
        <Stat value={s.reviewedThisWeek} label={t('reviewedThisWeek')} icon="checkmark-done" onPress={() => router.push('/instructor/history')} />
      </View>
      {s.oldestPendingAt ? (
        <Txt variant="caption" color={colors.inkSoft} style={{ marginTop: space.sm }}>
          {t('oldestWaiting', { when: relativeDay(s.oldestPendingAt, t) })}
        </Txt>
      ) : null}

      <SectionTitle title={t('reviewQueue')} action={t('seeAll')} onAction={() => router.push('/instructor/queue')} />
      {(queue.data?.items || []).slice(0, 4).map((r) => (
        <QueueItem key={r._id} r={r} />
      ))}
      {queue.data && !queue.data.items.length ? (
        <Card>
          <Txt color={colors.inkSoft}>{t('queueEmpty')}</Txt>
        </Card>
      ) : null}

      <SectionTitle title={t('staffMenu')} />
      <Card>
        <Pressable onPress={() => router.push('/instructor/history')} accessibilityRole="button">
          <InfoRow icon="time" label={t('reviewHistory')} />
        </Pressable>
        <Pressable onPress={() => router.push('/admin/plants')} accessibilityRole="button">
          <InfoRow icon="leaf" label={t('managePlants')} />
        </Pressable>
        <Pressable onPress={() => router.push('/search')} accessibilityRole="button">
          <InfoRow icon="search" label={t('search')} last />
        </Pressable>
      </Card>
      {user?.role === 'admin' ? (
        <Button title={t('adminDashboard')} icon="grid" variant="secondary" onPress={() => router.replace('/admin')} style={{ marginTop: space.lg }} />
      ) : null}
    </Screen>
  );
}
