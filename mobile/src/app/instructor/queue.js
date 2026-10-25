/** Screen 16 – Pending recommendation review queue (most urgent first). */
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { Empty, ErrorView, Loading, Screen } from '../../components/ui';
import { QueueItem } from '../../components/QueueItem';

export default function Queue() {
  const { t } = useI18n();
  const { data, error, loading, reload, refreshing } = useApi('/instructor/queue');
  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {data.items.length ? data.items.map((r) => <QueueItem key={r._id} r={r} />) : <Empty icon="checkmark-done-circle-outline" text={t('queueEmpty')} />}
    </Screen>
  );
}
