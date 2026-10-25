/** In-app notifications (review completed, preliminary analysis ready, new review items). */
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useApi } from '../lib/useApi';
import { formatDateTime } from '../lib/format';
import { Button, Card, Empty, ErrorView, Loading, Screen, Txt } from '../components/ui';
import { colors, space } from '../theme';

const ICONS = {
  review_completed: 'shield-checkmark',
  recommendation_ready: 'sparkles',
  new_review_item: 'clipboard',
  reminder: 'alarm',
  system: 'information-circle',
};

export default function Notifications() {
  const { t, loc, lang } = useI18n();
  const { user } = useAuth();
  const { data, error, loading, reload, refreshing } = useApi('/notifications');

  const open = async (n) => {
    if (!n.readAt) api.patch(`/notifications/${n._id}/read`).catch(() => {});
    const id = n.data?.recommendationId;
    if (!id) return reload();
    if (user.role === 'user') router.push(n.type === 'review_completed' ? `/recommendation/${id}` : `/analysis/${id}`);
    else router.push(`/instructor/review/${id}`);
  };

  const readAll = async () => {
    await api.patch('/notifications/read-all');
    reload();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {data.unread ? (
        <Button
          title={t('markAllRead')}
          icon="checkmark-done"
          variant="ghost"
          compact
          onPress={readAll}
          style={{ alignSelf: 'flex-end', marginBottom: space.sm }}
        />
      ) : null}
      {!data.items.length ? (
        <Empty icon="notifications-off-outline" text={t('notificationsEmpty')} />
      ) : (
        data.items.map((n) => (
          <Pressable key={n._id} onPress={() => open(n)} accessibilityRole="button">
            <Card style={{ marginBottom: space.md, flexDirection: 'row', gap: space.md, opacity: n.readAt ? 0.75 : 1 }}>
              <Ionicons name={ICONS[n.type] || 'notifications'} size={24} color={n.readAt ? colors.muted : colors.primary} />
              <View style={{ flex: 1 }}>
                <Txt weight={n.readAt ? 'regular' : 'bold'}>{loc(n.title)}</Txt>
                <Txt variant="caption" color={colors.inkSoft}>
                  {loc(n.body)}
                </Txt>
                <Txt variant="caption" color={colors.muted}>
                  {formatDateTime(n.createdAt, lang)}
                </Txt>
              </View>
              {!n.readAt ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger, marginTop: 8 }} /> : null}
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
