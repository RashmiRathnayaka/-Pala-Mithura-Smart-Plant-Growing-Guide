/** Favourite plants */
import { router } from 'expo-router';
import { useI18n } from '../lib/i18n';
import { useApi } from '../lib/useApi';
import { Empty, ErrorView, Loading, Screen } from '../components/ui';
import { PlantRow } from '../components/plant';

export default function Favorites() {
  const { t } = useI18n();
  const { data, error, loading, reload, refreshing } = useApi('/favorites');
  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {data.items.length ? (
        data.items.map((p) => <PlantRow key={p._id} plant={p} />)
      ) : (
        <Empty icon="heart-outline" text={t('noFavorites')} actionTitle={t('search')} onAction={() => router.push('/search')} />
      )}
    </Screen>
  );
}
