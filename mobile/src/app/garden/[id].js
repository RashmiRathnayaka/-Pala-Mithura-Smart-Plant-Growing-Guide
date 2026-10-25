/** Screen 9 – Plant growth timeline, logs and crop-specific reminders. */
import { useLayoutEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, buildForm } from '../../lib/api';
import { errorMessage, useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { formatDate, relativeDay } from '../../lib/format';
import { imageUrl } from '../../lib/config';
import { confirmAction, notify } from '../../lib/confirm';
import { syncReminders } from '../../lib/reminders';
import { pickImages } from '../../components/photos';
import { StageSelect } from '../../components/forms';
import { Banner, Button, Card, ErrorView, Field, Loading, Screen, SectionTitle, Toggle, Txt } from '../../components/ui';
import { PlantImage } from '../../components/plant';
import { colors, radius, space } from '../../theme';

const EVENT_ICON = { planted: 'flag', watering: 'water', fertilizer: 'flask', photo: 'image', note: 'create', problem: 'alert-circle' };
const EVENT_COLOR = {
  planted: colors.primary,
  watering: colors.info,
  fertilizer: colors.soil,
  photo: colors.primary,
  note: colors.inkSoft,
  problem: colors.danger,
};

function Sheet({ visible, title, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(19,74,46,0.35)' }} onPress={onClose} />
      <View style={styles.sheet}>
        <Txt variant="title" weight="bold" style={{ marginBottom: space.md }}>
          {title}
        </Txt>
        {children}
      </View>
    </Modal>
  );
}

export default function GardenPlant() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { t, loc, lang } = useI18n();
  const detail = useApi(`/my-plants/${id}`);
  const tl = useApi(`/my-plants/${id}/timeline`);
  const [sheet, setSheet] = useState(null); // 'fert' | 'note' | 'reminders'
  const [fert, setFert] = useState({ type: '', quantity: '' });
  const [note, setNote] = useState({ text: '', isProblem: false });
  const [busy, setBusy] = useState(false);

  const up = detail.data?.userPlant;
  useLayoutEffect(() => {
    if (up) navigation.setOptions({ title: up.nickname || loc(up.plant?.name) });
  }, [navigation, up, loc]);

  if (detail.loading || tl.loading) return <Loading />;
  if (detail.error) return <ErrorView error={detail.error} onRetry={detail.reload} />;

  const s = up.schedule || {};
  const refresh = () => {
    detail.reload();
    tl.reload();
    syncReminders(t, loc).catch(() => {});
  };
  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      setSheet(null);
      refresh();
    } catch (err) {
      notify(t('errGeneric'), errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const water = () => run(() => api.post(`/my-plants/${id}/watering`, {}));
  const saveFert = () =>
    run(() =>
      api.post(`/my-plants/${id}/fertilizer`, { type: fert.type.trim(), quantity: fert.quantity.trim() }).then(() => setFert({ type: '', quantity: '' })),
    );
  const saveNote = () =>
    run(() => api.post(`/my-plants/${id}/notes`, { text: note.text.trim(), isProblem: note.isProblem }).then(() => setNote({ text: '', isProblem: false })));
  const addPhoto = async () => {
    const picked = await pickImages({ max: 3 });
    if (!picked.length) return;
    run(async () => api.upload(`/my-plants/${id}/photos`, await buildForm({}, picked, 'photos')));
  };
  const setStage = (growthStage) => run(() => api.patch(`/my-plants/${id}`, { growthStage }));
  const saveReminders = (patch) => run(() => api.patch(`/my-plants/${id}`, { reminders: patch }));
  const archive = () =>
    confirmAction({
      title: t('archiveConfirm'),
      confirmText: t('archive'),
      cancelText: t('cancel'),
      onConfirm: async () => {
        await api.del(`/my-plants/${id}`);
        syncReminders(t, loc).catch(() => {});
        router.back();
      },
    });

  const fertApps = s.fertilizer?.applications || [];

  return (
    <Screen refreshing={detail.refreshing} onRefresh={refresh}>
      <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <PlantImage plant={up.plant} image={up.photos?.[up.photos.length - 1]} height={84} style={{ width: 84 }} rounded={radius.md} />
        <View style={{ flex: 1 }}>
          <Txt variant="title" weight="bold">
            {t('dayN', { n: s.daysSincePlanting ?? 0 })}
          </Txt>
          <Txt variant="caption" color={colors.inkSoft}>
            {t('plantingDate')}: {formatDate(up.plantingDate, lang)}
          </Txt>
          <Txt variant="caption" color={colors.inkSoft}>
            {t('quantity')}: {up.quantity}
            {up.location?.district ? ` · ${up.location.district}` : ''}
          </Txt>
        </View>
      </Card>

      <View style={{ marginTop: space.lg }}>
        <StageSelect value={up.growthStage} onChange={setStage} />
      </View>

      {/* Next tasks, from this crop's own schedule */}
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        <Card style={[styles.task, { borderColor: s.watering?.overdue ? colors.danger : 'transparent' }]}>
          <Ionicons name="water" size={22} color={s.watering?.overdue ? colors.danger : colors.info} />
          <Txt variant="caption" color={colors.inkSoft}>
            {t('nextWatering')}
          </Txt>
          <Txt weight="bold" color={s.watering?.overdue ? colors.danger : colors.ink}>
            {s.watering?.enabled ? (s.watering.overdue ? t('overdue') : relativeDay(s.watering.nextDueAt, t)) : '–'}
          </Txt>
          {s.watering?.intervalDays ? (
            <Txt variant="caption" color={colors.muted}>
              {t('wateringEvery', { n: s.watering.intervalDays })}
            </Txt>
          ) : null}
        </Card>
        <Card style={styles.task}>
          <Ionicons name="flask" size={22} color={colors.soil} />
          <Txt variant="caption" color={colors.inkSoft}>
            {t('nextFertilizer')}
          </Txt>
          <Txt weight="bold">{s.fertilizer?.nextDueAt ? relativeDay(s.fertilizer.nextDueAt, t) : '–'}</Txt>
        </Card>
        <Card style={styles.task}>
          <Ionicons name="basket" size={22} color={colors.primary} />
          <Txt variant="caption" color={colors.inkSoft}>
            {t('harvestWindow')}
          </Txt>
          <Txt weight="bold">{s.harvest?.startAt ? relativeDay(s.harvest.startAt, t) : '–'}</Txt>
        </Card>
      </View>
      {!s.watering?.enabled && !fertApps.length && !s.harvest?.startAt ? <Banner tone="info" text={t('noSchedule')} style={{ marginTop: space.md }} /> : null}

      <View style={styles.actions}>
        <Button title={t('logWater')} icon="water" onPress={water} loading={busy} style={{ flexGrow: 1 }} compact />
        <Button title={t('logFertilizer')} icon="flask" variant="soil" onPress={() => setSheet('fert')} style={{ flexGrow: 1 }} compact />
        <Button title={t('addPhoto')} icon="camera" variant="secondary" onPress={addPhoto} style={{ flexGrow: 1 }} compact />
        <Button title={t('addNote')} icon="create" variant="secondary" onPress={() => setSheet('note')} style={{ flexGrow: 1 }} compact />
      </View>
      <Button
        title={t('reportProblem')}
        icon="medkit"
        variant="danger"
        onPress={() => router.push({ pathname: '/report', params: { userPlant: id } })}
        style={{ marginTop: space.sm }}
      />

      {fertApps.length ? (
        <>
          <SectionTitle title={t('fertilizer')} />
          <Card>
            {fertApps.map((a, i) => (
              <View key={i} style={[styles.fertRow, i < fertApps.length - 1 && styles.line]}>
                <Ionicons
                  name={a.done ? 'checkmark-circle' : a.overdue ? 'alert-circle' : 'ellipse-outline'}
                  size={22}
                  color={a.done ? colors.verified : a.overdue ? colors.danger : colors.muted}
                />
                <View style={{ flex: 1 }}>
                  <Txt weight="semibold">{loc(a.timing)}</Txt>
                  <Txt variant="caption" color={colors.inkSoft}>
                    {formatDate(a.dueAt, lang)} · {a.products.map((p) => p.name).join(', ')}
                  </Txt>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle title={t('reminders')} action={t('edit')} onAction={() => setSheet('reminders')} />
      <Card>
        <Txt variant="caption" color={colors.inkSoft}>
          {t('wateringReminder')}: {up.reminders?.watering ? t('yes') : t('no')} · {t('fertilizerReminder')}: {up.reminders?.fertilizer ? t('yes') : t('no')} ·{' '}
          {t('harvestReminder')}: {up.reminders?.harvest ? t('yes') : t('no')} · {t('reminderTime')}: {up.reminders?.time}
        </Txt>
      </Card>

      {tl.data?.stages?.length ? (
        <>
          <SectionTitle title={t('growthPath')} />
          <Card>
            {tl.data.stages.map((st, i) => {
              const now = new Date();
              const active = new Date(st.startAt) <= now && (!st.endAt || new Date(st.endAt) >= now);
              return (
                <View key={st.stage} style={[styles.stageRow, i < tl.data.stages.length - 1 && styles.line]}>
                  <View style={[styles.stageDot, active && { backgroundColor: colors.primary }]} />
                  <Txt weight={active ? 'bold' : 'regular'} style={{ flex: 1 }}>
                    {t(`stage_${st.stage}`)}
                  </Txt>
                  <Txt variant="caption" color={colors.inkSoft}>
                    {formatDate(st.startAt, lang)}
                  </Txt>
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      <SectionTitle title={t('timeline')} />
      {(tl.data?.events || []).map((e, i) => (
        <View key={`${e.type}-${e.id || i}`} style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ alignItems: 'center', width: 32 }}>
            <View style={[styles.evIcon, { backgroundColor: EVENT_COLOR[e.type] }]}>
              <Ionicons name={EVENT_ICON[e.type]} size={16} color={colors.white} />
            </View>
            {i < tl.data.events.length - 1 ? <View style={styles.evLine} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: space.lg }}>
            <Txt weight="semibold">
              {t(`ev_${e.type}`)}
              {e.detail ? ` – ${e.detail}` : ''}
            </Txt>
            <Txt variant="caption" color={colors.muted}>
              {formatDate(e.date, lang)}
            </Txt>
            {e.note ? <Txt variant="caption">{e.note}</Txt> : null}
            {e.url ? <Image source={{ uri: imageUrl(e.url) }} style={styles.evPhoto} contentFit="cover" /> : null}
          </View>
        </View>
      ))}

      <Button title={t('archive')} icon="archive" variant="ghost" onPress={archive} style={{ marginTop: space.lg }} />

      <Sheet visible={sheet === 'fert'} title={t('logFertilizer')} onClose={() => setSheet(null)}>
        <Field label={t('fertilizerType')} value={fert.type} onChangeText={(v) => setFert((f) => ({ ...f, type: v }))} placeholder="Urea, TSP, MOP, Compost…" />
        <Field
          label={`${t('amount')} ${t('optional')}`}
          value={fert.quantity}
          onChangeText={(v) => setFert((f) => ({ ...f, quantity: v }))}
          placeholder="50 g"
        />
        <Button title={t('save')} onPress={saveFert} loading={busy} disabled={!fert.type.trim()} />
      </Sheet>

      <Sheet visible={sheet === 'note'} title={t('addNote')} onClose={() => setSheet(null)}>
        <Field label={t('note')} value={note.text} onChangeText={(v) => setNote((n) => ({ ...n, text: v }))} multiline />
        <Toggle label={t('isProblem')} value={note.isProblem} onChange={(v) => setNote((n) => ({ ...n, isProblem: v }))} />
        <Button title={t('save')} onPress={saveNote} loading={busy} disabled={!note.text.trim()} style={{ marginTop: space.md }} />
      </Sheet>

      <RemindersSheet visible={sheet === 'reminders'} reminders={up.reminders} schedule={s} onClose={() => setSheet(null)} onSave={saveReminders} busy={busy} />
    </Screen>
  );
}

function RemindersSheet({ visible, reminders = {}, schedule, onClose, onSave, busy }) {
  const { t } = useI18n();
  const [r, setR] = useState(reminders);
  const [interval, setInterval_] = useState(reminders.wateringIntervalDays ? String(reminders.wateringIntervalDays) : '');
  const set = (k) => (v) => setR((x) => ({ ...x, [k]: v }));
  return (
    <Sheet visible={visible} title={t('reminders')} onClose={onClose}>
      <Toggle label={t('wateringReminder')} value={!!r.watering} onChange={set('watering')} />
      <Field
        label={t('customInterval')}
        hint={schedule?.watering?.intervalSource === 'crop' ? `${t('cropInterval')}: ${schedule.watering.intervalDays}` : undefined}
        value={interval}
        onChangeText={(v) => setInterval_(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Toggle label={t('fertilizerReminder')} value={!!r.fertilizer} onChange={set('fertilizer')} />
      <Toggle label={t('harvestReminder')} value={!!r.harvest} onChange={set('harvest')} />
      <Field label={`${t('reminderTime')} (HH:MM)`} value={r.time} onChangeText={set('time')} maxLength={5} keyboardType="numbers-and-punctuation" />
      <Button
        title={t('save')}
        loading={busy}
        onPress={() =>
          onSave({
            watering: !!r.watering,
            fertilizer: !!r.fertilizer,
            harvest: !!r.harvest,
            time: /^([01]\d|2[0-3]):[0-5]\d$/.test(r.time || '') ? r.time : '07:00',
            wateringIntervalDays: interval ? Math.min(60, Math.max(1, parseInt(interval, 10))) : null,
          })
        }
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  task: { flex: 1, minWidth: 100, gap: 2, borderWidth: 1.5, borderColor: 'transparent', padding: space.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
  fertRow: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm, alignItems: 'center' },
  line: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  stageDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.line },
  evIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  evLine: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: 2 },
  evPhoto: { width: 160, height: 120, borderRadius: radius.md, marginTop: space.sm, backgroundColor: colors.primarySoft },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.lg, paddingBottom: space.xxl },
});
