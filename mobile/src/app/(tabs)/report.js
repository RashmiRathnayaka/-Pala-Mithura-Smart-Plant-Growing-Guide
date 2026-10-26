/** Screen 10 – "ශාක ගැටලු හඳුනාගැනීම" (Plant Problem Identification) */
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api, buildForm } from '../../lib/api';
import { errorMessage, useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { Banner, Button, Card, Chip, ErrorView, Field, Loading, Screen, Select, Txt } from '../../components/ui';
import { PhotoPicker } from '../../components/photos';
import { useMeta } from '../../components/forms';
import { colors, space } from '../../theme';

export default function Report() {
  const params = useLocalSearchParams();
  const { t, loc, lang } = useI18n();
  const meta = useMeta();
  const garden = useApi('/my-plants');
  const allPlants = useApi('/plants', { limit: 100 });

  const [userPlantId, setUserPlantId] = useState(params.userPlant || null);
  const [plantId, setPlantId] = useState(params.plant || null);
  const [photos, setPhotos] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [parts, setParts] = useState([]);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Arriving from a garden plant or a plant page pre-selects it (adjusted during render).
  const paramKey = `${params.userPlant || ''}|${params.plant || ''}`;
  const [seenParams, setSeenParams] = useState(paramKey);
  if (seenParams !== paramKey) {
    setSeenParams(paramKey);
    setUserPlantId(params.userPlant || null);
    setPlantId(params.plant || null);
  }

  const gardenItems = garden.data?.items || [];
  const selectedUp = gardenItems.find((u) => u._id === userPlantId);
  const effectivePlant = selectedUp ? selectedUp.plant?._id : plantId;

  const plantOptions = useMemo(
    () => (allPlants.data?.items || []).map((p) => ({ value: p._id, label: loc(p.name), sublabel: p.scientificName })),
    [allPlants.data, loc],
  );

  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const reset = () => {
    setPhotos([]);
    setSymptoms([]);
    setParts([]);
    setDescription('');
    setDuration('');
  };

  const submit = async () => {
    setError(null);
    if (!effectivePlant) return setError(t('whichPlant'));
    if (!photos.length && !symptoms.length && !description.trim()) return setError(t('needSomething'));
    setBusy(true);
    try {
      const form = await buildForm(
        {
          plant: effectivePlant,
          userPlant: selectedUp ? selectedUp._id : undefined,
          symptoms,
          affectedParts: parts,
          description: description.trim(),
          durationDays: duration ? Number(duration) : undefined,
          language: lang,
        },
        photos,
        'photos',
      );
      const res = await api.upload('/reports', form);
      reset();
      router.push(`/analysis/${res.recommendation._id}`);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  if (garden.loading || allPlants.loading) return <Loading />;
  if (allPlants.error) return <ErrorView error={allPlants.error} onRetry={allPlants.reload} />;

  return (
    <Screen>
      <Txt color={colors.inkSoft} style={{ marginBottom: space.lg }}>
        {t('problemIntro')}
      </Txt>

      <Card style={{ marginBottom: space.lg }}>
        <Txt variant="bodyLg" weight="bold" style={{ marginBottom: space.md }}>
          {t('whichPlant')}
        </Txt>
        {gardenItems.length ? (
          <>
            <Txt variant="caption" color={colors.muted} style={{ marginBottom: space.sm }}>
              {t('fromMyGarden')}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md }}>
              {gardenItems.map((u) => (
                <Chip
                  key={u._id}
                  label={u.nickname || loc(u.plant?.name)}
                  selected={userPlantId === u._id}
                  onPress={() => {
                    setUserPlantId(userPlantId === u._id ? null : u._id);
                    setPlantId(null);
                  }}
                />
              ))}
            </View>
          </>
        ) : null}
        <Select
          label={gardenItems.length ? t('otherPlant') : undefined}
          placeholder={t('choosePlant')}
          value={selectedUp ? null : plantId}
          onChange={(v) => {
            setPlantId(v);
            setUserPlantId(null);
          }}
          options={plantOptions}
          emptyText={t('noPlantsYet')}
          style={{ marginBottom: 0 }}
        />
      </Card>

      <Card style={{ marginBottom: space.lg }}>
        <Txt variant="bodyLg" weight="bold" style={{ marginBottom: space.md }}>
          {t('photos')}
        </Txt>
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </Card>

      <Card style={{ marginBottom: space.lg }}>
        <Txt variant="bodyLg" weight="bold" style={{ marginBottom: space.md }}>
          {t('whatDoYouSee')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(meta?.symptoms || []).map((s) => (
            <Chip key={s} label={t(`sym_${s}`)} selected={symptoms.includes(s)} onPress={() => toggle(symptoms, setSymptoms, s)} />
          ))}
        </View>
        <Txt variant="bodyLg" weight="bold" style={{ marginTop: space.xl, marginBottom: space.md }}>
          {t('affectedPart')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(meta?.plantParts || []).map((p) => (
            <Chip key={p} tone="soil" label={t(`part_${p}`)} selected={parts.includes(p)} onPress={() => toggle(parts, setParts, p)} />
          ))}
        </View>
      </Card>

      <Field label={t('describe')} value={description} onChangeText={setDescription} multiline maxLength={3000} />
      <Field label={t('howLong')} value={duration} onChangeText={(v) => setDuration(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={4} />

      {error ? <Banner tone="danger" text={error} style={{ marginBottom: space.lg }} /> : null}
      {busy ? <Banner tone="info" text={t('analyzing')} icon="sparkles" style={{ marginBottom: space.lg }} /> : null}
      <Button title={t('submitForAnalysis')} icon="send" onPress={submit} loading={busy} />
    </Screen>
  );
}
