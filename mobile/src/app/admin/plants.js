/** Screen 20 – Plant and disease management */
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { Button, Card, Chip, Empty, ErrorView, Field, Loading, Screen, Txt } from '../../components/ui';
import { PlantRow, VerificationBadge } from '../../components/plant';
import { colors, space } from '../../theme';

export default function ManagePlants() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { t, loc } = useI18n();
  const [tab, setTab] = useState(params.tab === 'diseases' ? 'diseases' : 'plants');
  const [q, setQ] = useState('');
  const plants = useApi('/plants', { q: q || undefined, includeUnpublished: 'true', limit: 100 });
  const diseases = useApi('/diseases', { q: q || undefined });
  const isAdmin = user?.role === 'admin';
  const current = tab === 'plants' ? plants : diseases;

  return (
    <Screen refreshing={current.refreshing} onRefresh={current.reload}>
      <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
        <Chip label={t('plants')} selected={tab === 'plants'} onPress={() => setTab('plants')} icon="leaf" />
        <Chip label={t('diseases')} selected={tab === 'diseases'} onPress={() => setTab('diseases')} icon="bug" />
      </View>
      <Field placeholder={t('search')} value={q} onChangeText={setQ} returnKeyType="search" />

      {isAdmin ? (
        <Button
          title={tab === 'plants' ? t('newPlant') : t('newDisease')}
          icon="add"
          onPress={() => router.push(tab === 'plants' ? '/admin/plant-edit' : '/admin/disease-edit')}
          style={{ marginBottom: space.lg }}
        />
      ) : null}

      {current.loading ? (
        <Loading />
      ) : current.error ? (
        <ErrorView error={current.error} onRetry={current.reload} />
      ) : !current.data.items.length ? (
        <Empty text={t('noResults')} />
      ) : tab === 'plants' ? (
        plants.data.items.map((p) => (
          <PlantRow
            key={p._id}
            plant={p}
            onPress={() => router.push({ pathname: '/admin/plant-edit', params: { id: p._id } })}
            right={
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Txt variant="caption" color={colors.muted}>
                  {p.plantCode}
                </Txt>
                {!p.isPublished ? (
                  <Txt variant="caption" weight="semibold" color={colors.danger}>
                    {t('unpublished')}
                  </Txt>
                ) : null}
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </View>
            }
          />
        ))
      ) : (
        diseases.data.items.map((d) => (
          <Card key={d._id} onPress={() => router.push({ pathname: '/admin/disease-edit', params: { id: d._id } })} style={{ marginBottom: space.md, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Txt weight="bold" style={{ flex: 1 }}>
                {loc(d.name)}
              </Txt>
              <Txt variant="caption" color={colors.muted}>
                {d.code}
              </Txt>
            </View>
            <Txt variant="caption" color={colors.inkSoft}>
              {t(`type_${d.type}`)}
              {d.plants?.length ? ` · ${d.plants.map((p) => loc(p.name)).join(', ')}` : ''}
            </Txt>
            <VerificationBadge status={d.verification?.status} />
          </Card>
        ))
      )}
    </Screen>
  );
}
