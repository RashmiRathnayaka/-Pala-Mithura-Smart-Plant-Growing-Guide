/** Admin / instructor – create or edit a plant record, its photos and verification status. */
import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, buildForm } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage, useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { confirmAction } from '../../lib/confirm';
import { pickImages } from '../../components/photos';
import { Banner, Button, Card, Field, Loading, Screen, Select, Toggle, Txt } from '../../components/ui';
import { PlantImage } from '../../components/plant';
import { colors, radius, space } from '../../theme';

const num = (v) => (v === '' || v == null ? null : Number(v));
const str = (v) => (v == null ? '' : String(v));

function initialForm(p = {}) {
  return {
    nameSi: p.name?.si || '',
    nameEn: p.name?.en || '',
    scientificName: p.scientificName || '',
    category: p.category?._id || p.category || null,
    descriptionSi: p.description?.si || '',
    descriptionEn: p.description?.en || '',
    wateringDays: str(p.watering?.intervalDays),
    wateringNotesSi: p.watering?.notes?.si || '',
    phMin: str(p.soil?.phMin),
    phMax: str(p.soil?.phMax),
    plantCm: str(p.spacing?.plantCm),
    rowCm: str(p.spacing?.rowCm),
    harvestStart: str(p.harvest?.startDays),
    isPublished: p.isPublished !== false,
    verificationStatus: p.verification?.status || 'needs_review',
    verificationNotes: p.verification?.notes || '',
  };
}

export default function PlantEdit() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t, loc } = useI18n();
  const cats = useApi('/categories');
  const existing = useApi(id ? `/plants/${id}` : null, undefined, { enabled: !!id, refetchOnFocus: false });
  const [f, setF] = useState(() => (id ? null : initialForm()));
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const isAdmin = user?.role === 'admin';
  const plant = existing.data?.plant;

  useLayoutEffect(() => {
    navigation.setOptions({ title: id ? t('edit') : t('newPlant') });
  }, [navigation, id, t]);

  // Fill the form once the plant has loaded (and again after each save).
  const [loadedFor, setLoadedFor] = useState(null);
  if (id && plant && loadedFor !== plant) {
    setLoadedFor(plant);
    setF(initialForm(plant));
  }

  const catOptions = useMemo(() => (cats.data?.items || []).map((c) => ({ value: c._id, label: loc(c.name) })), [cats.data, loc]);

  if (!f || (id && existing.loading)) return <Loading />;
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setMsg(null);
    if (!f.nameSi.trim() || !f.nameEn.trim() || !f.scientificName.trim() || !f.category) return setMsg({ tone: 'danger', text: t('required') });
    const body = {
      name: { si: f.nameSi.trim(), en: f.nameEn.trim() },
      scientificName: f.scientificName.trim(),
      category: f.category,
      description: { si: f.descriptionSi.trim(), en: f.descriptionEn.trim() },
      watering: { ...(plant?.watering || {}), intervalDays: num(f.wateringDays), notes: { ...(plant?.watering?.notes || {}), si: f.wateringNotesSi.trim() } },
      soil: { ...(plant?.soil || {}), phMin: num(f.phMin), phMax: num(f.phMax) },
      spacing: { ...(plant?.spacing || {}), plantCm: num(f.plantCm), rowCm: num(f.rowCm) },
      harvest: { ...(plant?.harvest || {}), startDays: num(f.harvestStart) },
      isPublished: f.isPublished,
    };
    // Strip server-only keys that the validator does not accept.
    ['watering', 'soil', 'spacing', 'harvest'].forEach((k) => {
      delete body[k]._id;
    });
    setBusy(true);
    try {
      if (id) {
        await api.patch(`/plants/${id}`, body);
        if (f.verificationStatus !== plant.verification?.status || f.verificationNotes !== (plant.verification?.notes || '')) {
          await api.post(`/plants/${id}/verify`, { status: f.verificationStatus, notes: f.verificationNotes });
        }
        existing.reload();
        setMsg({ tone: 'success', text: t('saved') });
      } else {
        const res = await api.post('/plants', { ...body, verification: { status: f.verificationStatus, notes: f.verificationNotes } });
        router.replace({ pathname: '/admin/plant-edit', params: { id: res.plant._id } });
      }
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err, t) });
    } finally {
      setBusy(false);
    }
  };

  const addImages = async () => {
    const picked = await pickImages({ max: 6 });
    if (!picked.length) return;
    setBusy(true);
    try {
      await api.upload(`/plants/${id}/images`, await buildForm({}, picked, 'images'));
      existing.reload();
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err, t) });
    } finally {
      setBusy(false);
    }
  };

  const removeImage = (img) =>
    confirmAction({
      title: t('deleteConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      onConfirm: async () => {
        await api.del(`/plants/${id}/images/${img._id}`);
        existing.reload();
      },
    });

  const remove = () =>
    confirmAction({
      title: t('deleteConfirm'),
      message: f.nameSi,
      confirmText: t('delete'),
      cancelText: t('cancel'),
      onConfirm: async () => {
        await api.del(`/plants/${id}`);
        router.back();
      },
    });

  return (
    <Screen>
      {msg ? <Banner tone={msg.tone} text={msg.text} style={{ marginBottom: space.md }} /> : null}

      {id ? (
        <Card style={{ marginBottom: space.lg }}>
          <Txt variant="bodyLg" weight="bold" style={{ marginBottom: space.md }}>
            {t('plantImages')}
          </Txt>
          <ScrollView horizontal contentContainerStyle={{ gap: space.sm }}>
            {(plant?.images || []).map((img) => (
              <View key={img._id}>
                <PlantImage plant={plant} image={img} height={96} style={{ width: 96 }} rounded={radius.md} />
                <Pressable
                  onPress={() => removeImage(img)}
                  accessibilityRole="button"
                  accessibilityLabel={t('delete')}
                  style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(22,36,27,0.75)', borderRadius: 13, padding: 3 }}
                >
                  <Ionicons name="trash" size={16} color={colors.white} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <Button title={t('addPhoto')} icon="images" variant="secondary" onPress={addImages} loading={busy} compact style={{ marginTop: space.md }} />
        </Card>
      ) : null}

      <Field label={t('nameSi')} value={f.nameSi} onChangeText={set('nameSi')} />
      <Field label={t('nameEn')} value={f.nameEn} onChangeText={set('nameEn')} />
      <Field label={t('scientificName')} value={f.scientificName} onChangeText={set('scientificName')} autoCapitalize="none" />
      <Select label={t('category')} value={f.category} onChange={set('category')} options={catOptions} placeholder={t('category')} />
      <Field label={t('descriptionSi')} value={f.descriptionSi} onChangeText={set('descriptionSi')} multiline />
      <Field label={t('descriptionEn')} value={f.descriptionEn} onChangeText={set('descriptionEn')} multiline />

      <Card style={{ marginBottom: space.lg }}>
        <Txt variant="bodyLg" weight="bold" style={{ marginBottom: space.md }}>
          {t('growingGuide')}
        </Txt>
        <Field label={t('wateringDays')} value={f.wateringDays} onChangeText={set('wateringDays')} keyboardType="number-pad" />
        <Field label={`${t('watering')} (සිංහල)`} value={f.wateringNotesSi} onChangeText={set('wateringNotesSi')} multiline />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Field label={t('phMin')} value={f.phMin} onChangeText={set('phMin')} keyboardType="decimal-pad" style={{ flex: 1 }} />
          <Field label={t('phMax')} value={f.phMax} onChangeText={set('phMax')} keyboardType="decimal-pad" style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Field label={t('spacingPlantCm')} value={f.plantCm} onChangeText={set('plantCm')} keyboardType="number-pad" style={{ flex: 1 }} />
          <Field label={t('spacingRowCm')} value={f.rowCm} onChangeText={set('rowCm')} keyboardType="number-pad" style={{ flex: 1 }} />
        </View>
        <Field label={t('harvestStartDays')} value={f.harvestStart} onChangeText={set('harvestStart')} keyboardType="number-pad" style={{ marginBottom: 0 }} />
      </Card>

      <Card style={{ marginBottom: space.lg }}>
        <Select
          label={t('verificationStatus')}
          value={f.verificationStatus}
          onChange={set('verificationStatus')}
          options={['verified', 'needs_review', 'unverified'].map((s) => ({ value: s, label: t(`verification_${s}`) }))}
        />
        <Field label={t('note')} value={f.verificationNotes} onChangeText={set('verificationNotes')} multiline />
        {plant?.verification?.uncertainFields?.length ? (
          <Txt variant="caption" color={colors.pending}>
            {plant.verification.uncertainFields.join(', ')}
          </Txt>
        ) : null}
        {isAdmin ? <Toggle label={t('published')} value={f.isPublished} onChange={set('isPublished')} /> : null}
      </Card>

      <Button title={t('save')} icon="save" onPress={save} loading={busy} />
      {id ? <Button title={t('growingGuide')} icon="eye" variant="ghost" onPress={() => router.push(`/plant/${id}`)} style={{ marginTop: space.sm }} /> : null}
      {id && isAdmin ? <Button title={t('delete')} icon="trash" variant="danger" onPress={remove} style={{ marginTop: space.lg }} /> : null}
    </Screen>
  );
}
