/** Screen 7 – My Plants: what the user is growing, with each crop's next tasks. */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { notify } from '../../lib/confirm';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { errorMessage, useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { relativeDay } from '../../lib/format';
import { syncReminders } from '../../lib/reminders';
import { Button, Card, Empty, ErrorView, Loading, Screen, Txt } from '../../components/ui';
import { PlantImage } from '../../components/plant';
import { colors, radius, space, themed } from '../../theme';

function Task({ icon, label, when, overdue, tone = colors.primary }) {
  return (
    <View style={styles.task}>
      <Ionicons name={icon} size={18} color={overdue ? colors.danger : tone} />
      <Txt variant="caption" color={colors.inkSoft} style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt variant="caption" weight="semibold" color={overdue ? colors.danger : colors.ink}>
        {when}
      </Txt>
    </View>
  );
}

export function GardenCard({ up, onWatered }) {
  const { t, loc } = useI18n();
  const [busy, setBusy] = useState(false);
  const s = up.schedule;
  const water = async () => {
    setBusy(true);
    try {
      await api.post(`/my-plants/${up._id}/watering`, {});
      onWatered?.();
    } catch (err) {
      notify(t('errGeneric'), errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card onPress={() => router.push(`/garden/${up._id}`)} style={{ marginBottom: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <PlantImage plant={up.plant} image={up.photos?.[up.photos.length - 1]} height={76} style={{ width: 76 }} rounded={radius.md} />
        <View style={{ flex: 1 }}>
          <Txt variant="bodyLg" weight="bold" numberOfLines={1}>
            {up.nickname || loc(up.plant?.name)}
          </Txt>
          <Txt variant="caption" color={colors.inkSoft}>
            {loc(up.plant?.name)} · {up.quantity} · {t('dayN', { n: s?.daysSincePlanting ?? 0 })}
          </Txt>
          <View style={styles.stage}>
            <Ionicons name="trending-up" size={14} color={colors.soil} />
            <Txt variant="caption" weight="semibold" color={colors.soil}>
              {t(`stage_${up.growthStage}`)}
            </Txt>
          </View>
        </View>
      </View>
      {s ? (
        <View style={{ marginTop: space.md, gap: 6 }}>
          {s.watering?.enabled ? (
            <Task
              icon="water"
              label={t('nextWatering')}
              when={s.watering.overdue ? t('overdue') : relativeDay(s.watering.nextDueAt, t)}
              overdue={s.watering.overdue}
              tone={colors.info}
            />
          ) : null}
          {s.fertilizer?.enabled && s.fertilizer.nextDueAt ? (
            <Task icon="flask" label={t('nextFertilizer')} when={relativeDay(s.fertilizer.nextDueAt, t)} tone={colors.soil} />
          ) : null}
          {s.harvest?.startAt ? <Task icon="basket" label={t('harvestWindow')} when={relativeDay(s.harvest.startAt, t)} /> : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
        <Button title={t('logWater')} icon="water" onPress={water} loading={busy} variant="secondary" compact style={{ flex: 1 }} />
        <Button
          title={t('reportProblem')}
          icon="camera"
          onPress={() => router.push({ pathname: '/report', params: { userPlant: up._id } })}
          variant="ghost"
          compact
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

export default function Garden() {
  const { t, loc } = useI18n();
  const { data, error, loading, refreshing, reload } = useApi('/my-plants');

  // Keep the phone's reminders in step with the garden.
  useEffect(() => {
    if (data?.items) syncReminders(t, loc).catch(() => {});
  }, [data, t, loc]);

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;
  const items = data?.items || [];

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {items.length ? (
        <>
          {items.map((up) => (
            <GardenCard key={up._id} up={up} onWatered={reload} />
          ))}
          <Button title={t('addPlant')} icon="add" onPress={() => router.push('/garden/add')} />
        </>
      ) : (
        <Empty icon="leaf-outline" text={t('gardenEmpty')} actionTitle={t('addPlant')} onAction={() => router.push('/garden/add')} />
      )}
    </Screen>
  );
}

const styles = themed(() => ({
  task: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.soilSoft,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
}));
