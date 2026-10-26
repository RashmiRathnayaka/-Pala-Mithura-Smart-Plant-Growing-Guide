/** Screen 8 – Add Plant to My Garden */
import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage, useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { isoDate, parseIsoDate } from '../../lib/format';
import { syncReminders } from '../../lib/reminders';
import { Banner, Button, ErrorView, Field, Loading, Screen, Select } from '../../components/ui';
import { DistrictSelect, StageSelect } from '../../components/forms';
import { space } from '../../theme';

export default function AddPlant() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { t, loc } = useI18n();
  const plants = useApi('/plants', { limit: 100 });
  const [form, setForm] = useState({
    plant: params.plant || null,
    nickname: '',
    plantingDate: isoDate(),
    quantity: '1',
    growthStage: 'seedling',
    district: user?.district || '',
    area: '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const options = useMemo(() => (plants.data?.items || []).map((p) => ({ value: p._id, label: loc(p.name), sublabel: p.scientificName })), [plants.data, loc]);

  const submit = async () => {
    setError(null);
    const date = parseIsoDate(form.plantingDate);
    if (!form.plant) return setError(t('choosePlant'));
    if (!date) return setError(`${t('plantingDate')}: YYYY-MM-DD`);
    setBusy(true);
    try {
      const res = await api.post('/my-plants', {
        plant: form.plant,
        nickname: form.nickname.trim() || undefined,
        plantingDate: date.toISOString(),
        quantity: Math.max(1, parseInt(form.quantity, 10) || 1),
        growthStage: form.growthStage,
        location: { district: form.district, area: form.area.trim() },
      });
      syncReminders(t, loc).catch(() => {});
      router.replace(`/garden/${res.userPlant._id}`);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  if (plants.loading) return <Loading />;
  if (plants.error) return <ErrorView error={plants.error} onRetry={plants.reload} />;
  return (
    <Screen>
      {!options.length ? <Banner tone="warn" text={t('noPlantsYet')} style={{ marginBottom: space.lg }} /> : null}
      <Select label={t('choosePlant')} placeholder={t('choosePlant')} value={form.plant} onChange={set('plant')} options={options} emptyText={t('noPlantsYet')} />
      <Field label={`${t('nickname')} ${t('optional')}`} value={form.nickname} onChangeText={set('nickname')} maxLength={60} />
      <Field
        label={t('plantingDate')}
        hint={`${t('plantingDateHint')} (YYYY-MM-DD)`}
        value={form.plantingDate}
        onChangeText={set('plantingDate')}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <Field
        label={t('quantity')}
        value={form.quantity}
        onChangeText={(v) => set('quantity')(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
      />
      <StageSelect value={form.growthStage} onChange={set('growthStage')} />
      <DistrictSelect value={form.district} onChange={set('district')} />
      <Field label={`${t('area')} ${t('optional')}`} value={form.area} onChangeText={set('area')} maxLength={120} />
      {error ? <Banner tone="danger" text={error} style={{ marginBottom: space.lg }} /> : null}
      <Button title={t('addPlant')} icon="add-circle" onPress={submit} loading={busy} />
    </Screen>
  );
}
