/** Admin / instructor – create or edit a disease, pest or deficiency record. */
import { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage, useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { splitLines } from '../../lib/format';
import { confirmAction } from '../../lib/confirm';
import { Banner, Button, Card, Chip, Field, Loading, Screen, Select, Txt } from '../../components/ui';
import { useMeta } from '../../components/forms';
import { space } from '../../theme';

const TYPES = ['fungal', 'bacterial', 'viral', 'phytoplasma', 'pest', 'deficiency', 'environmental'];
const LISTS = ['symptoms', 'prevention', 'treatment', 'safety'];

function initialForm(x = {}) {
  const lists = {};
  LISTS.forEach((k) => {
    lists[`${k}Si`] = (x[k]?.si || []).join('\n');
    lists[`${k}En`] = (x[k]?.en || []).join('\n');
  });
  return {
    nameSi: x.name?.si || '',
    nameEn: x.name?.en || '',
    type: x.type || 'fungal',
    causalAgent: x.causalAgent || '',
    symptomKeys: x.symptomKeys || [],
    plants: (x.plants || []).map((p) => p._id || p),
    verification: x.verification?.status || 'needs_review',
    ...lists,
  };
}

export default function DiseaseEdit() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t, loc } = useI18n();
  const meta = useMeta();
  const plants = useApi('/plants', { limit: 100, includeUnpublished: 'true' });
  const existing = useApi(id ? `/diseases/${id}` : null, undefined, { enabled: !!id, refetchOnFocus: false });
  const [f, setF] = useState(() => (id ? null : initialForm()));
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const d = existing.data?.disease;

  useLayoutEffect(() => {
    navigation.setOptions({ title: id ? t('edit') : t('newDisease') });
  }, [navigation, id, t]);

  const [loadedFor, setLoadedFor] = useState(null);
  if (id && d && loadedFor !== d) {
    setLoadedFor(d);
    setF(initialForm(d));
  }

  if (!f || (id && existing.loading)) return <Loading />;
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));

  const save = async () => {
    setMsg(null);
    if (!f.nameSi.trim() || !f.nameEn.trim()) return setMsg({ tone: 'danger', text: t('required') });
    const body = {
      name: { si: f.nameSi.trim(), en: f.nameEn.trim() },
      type: f.type,
      causalAgent: f.causalAgent.trim(),
      symptomKeys: f.symptomKeys,
      plants: f.plants,
      verification: { status: f.verification },
    };
    LISTS.forEach((k) => {
      body[k] = { si: splitLines(f[`${k}Si`]), en: splitLines(f[`${k}En`]) };
    });
    setBusy(true);
    try {
      if (id) await api.patch(`/diseases/${id}`, body);
      else await api.post('/diseases', body);
      router.back();
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err, t) });
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    confirmAction({
      title: t('deleteConfirm'),
      message: f.nameSi,
      confirmText: t('delete'),
      cancelText: t('cancel'),
      onConfirm: async () => {
        await api.del(`/diseases/${id}`);
        router.back();
      },
    });

  return (
    <Screen>
      {msg ? <Banner tone={msg.tone} text={msg.text} style={{ marginBottom: space.md }} /> : null}
      <Field label={t('nameSi')} value={f.nameSi} onChangeText={set('nameSi')} />
      <Field label={t('nameEn')} value={f.nameEn} onChangeText={set('nameEn')} />
      <Select label={t('diseaseType')} value={f.type} onChange={set('type')} options={TYPES.map((x) => ({ value: x, label: t(`type_${x}`) }))} />
      <Field label={t('causalAgent')} value={f.causalAgent} onChangeText={set('causalAgent')} autoCapitalize="none" />

      <Card style={{ marginBottom: space.lg }}>
        <Txt weight="bold" style={{ marginBottom: space.sm }}>
          {t('linkedPlants')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(plants.data?.items || []).map((p) => (
            <Chip key={p._id} label={loc(p.name)} selected={f.plants.includes(p._id)} onPress={() => toggle('plants', p._id)} />
          ))}
        </View>
        <Txt weight="bold" style={{ marginTop: space.lg, marginBottom: space.sm }}>
          {t('symptomKeys')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(meta?.symptoms || []).map((s) => (
            <Chip key={s} tone="soil" label={t(`sym_${s}`)} selected={f.symptomKeys.includes(s)} onPress={() => toggle('symptomKeys', s)} />
          ))}
        </View>
      </Card>

      {LISTS.map((k) => (
        <Card key={k} style={{ marginBottom: space.lg }}>
          <Txt variant="bodyLg" weight="bold" style={{ marginBottom: space.sm }}>
            {t(k)}
          </Txt>
          <Field label="සිංහල" hint={t('onePerLine')} value={f[`${k}Si`]} onChangeText={set(`${k}Si`)} multiline />
          <Field label="English" hint={t('onePerLine')} value={f[`${k}En`]} onChangeText={set(`${k}En`)} multiline style={{ marginBottom: 0 }} />
        </Card>
      ))}

      <Select
        label={t('verificationStatus')}
        value={f.verification}
        onChange={set('verification')}
        options={['verified', 'needs_review', 'unverified'].map((s) => ({ value: s, label: t(`verification_${s}`) }))}
      />
      <Button title={t('save')} icon="save" onPress={save} loading={busy} />
      {id && user?.role === 'admin' ? <Button title={t('delete')} icon="trash" variant="danger" onPress={remove} style={{ marginTop: space.lg }} /> : null}
    </Screen>
  );
}
