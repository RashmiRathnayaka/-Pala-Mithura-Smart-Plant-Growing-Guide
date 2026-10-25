/** Screen 6 – Plant details & growing guide */
import { useLayoutEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { kgPerHaToGPerSqm } from '../../lib/format';
import { Banner, Bullets, Button, Card, ErrorView, InfoRow, Loading, Txt } from '../../components/ui';
import { PlantImage, VerificationBadge } from '../../components/plant';
import { colors, radius, space } from '../../theme';

const has = (v) => v !== null && v !== undefined && v !== '';

function Section({ icon, title, children, tone = colors.primary }) {
  return (
    <Card style={{ marginBottom: space.md }}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIcon, { backgroundColor: tone === colors.soil ? colors.soilSoft : colors.primarySoft }]}>
          <Ionicons name={icon} size={20} color={tone} />
        </View>
        <Txt variant="title" weight="bold">
          {title}
        </Txt>
      </View>
      {children}
    </Card>
  );
}

function Value({ value, fallback }) {
  return has(value) ? <Txt>{value}</Txt> : <Txt color={colors.muted}>{fallback}</Txt>;
}

/** The growth path: the one place the guide is a true sequence, so it is drawn as one. */
function GrowthPath({ stages, t }) {
  if (!stages?.length) return null;
  return (
    <View>
      {stages.map((s, i) => {
        const last = i === stages.length - 1;
        return (
          <View key={s.stage} style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ alignItems: 'center', width: 28 }}>
              <View style={[styles.node, last && { backgroundColor: colors.soil }]}>
                <Ionicons name={last ? 'basket' : 'leaf'} size={14} color={colors.white} />
              </View>
              {!last ? <View style={styles.stem} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : space.lg }}>
              <Txt weight="bold">{t(`stage_${s.stage}`)}</Txt>
              <Txt variant="caption" color={colors.inkSoft}>
                {s.endDay != null ? `${t('dayN', { n: s.startDay })} – ${s.endDay}` : `${t('dayN', { n: s.startDay })} +`}
              </Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function PlantDetails() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t, loc, locList, lang } = useI18n();
  const { data, error, loading, reload, setData } = useApi(`/plants/${id}`);
  const [tab, setTab] = useState('guide');
  const [imgIdx, setImgIdx] = useState(0);

  const plant = data?.plant;
  useLayoutEffect(() => {
    if (plant) navigation.setOptions({ title: loc(plant.name) });
  }, [navigation, plant, loc]);

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={reload} />;

  const toggleFav = async () => {
    const was = data.isFavorite;
    setData({ ...data, isFavorite: !was });
    try {
      if (was) await api.del(`/favorites/${plant._id}`);
      else await api.post(`/favorites/${plant._id}`);
    } catch {
      setData({ ...data, isFavorite: was });
    }
  };

  const v = plant.verification || {};
  const nr = t('notRecorded');
  const fert = plant.fertilizer || {};
  const isUser = user?.role === 'user';

  const tabs = [
    ['guide', t('growingGuide')],
    ['overview', t('overview')],
    ['problems', t('problems')],
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: space.xxl * 2 }}>
      <PlantImage plant={plant} image={plant.images?.[imgIdx]} height={260} rounded={0} />
      {plant.images?.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, padding: space.md }}>
          {plant.images.map((img, i) => (
            <Pressable key={img._id || i} onPress={() => setImgIdx(i)} accessibilityRole="imagebutton">
              <PlantImage
                plant={plant}
                image={img}
                height={56}
                style={{ width: 56, borderWidth: i === imgIdx ? 2 : 0, borderColor: colors.primary }}
                rounded={radius.sm}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={{ padding: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Txt variant="display" weight="bold">
              {loc(plant.name)}
            </Txt>
            <Txt color={colors.inkSoft}>
              {lang === 'en' ? plant.name.si : plant.name.en}{'  '}
              <Txt color={colors.inkSoft} style={{ fontStyle: 'italic' }}>
                {plant.scientificName}
              </Txt>
            </Txt>
          </View>
          {isUser ? (
            <Pressable
              onPress={toggleFav}
              accessibilityRole="button"
              accessibilityLabel={data.isFavorite ? t('removeFavorite') : t('addFavorite')}
              style={styles.fav}
              hitSlop={6}
            >
              <Ionicons name={data.isFavorite ? 'heart' : 'heart-outline'} size={26} color={data.isFavorite ? colors.danger : colors.primary} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' }}>
          <VerificationBadge status={v.status} />
          <Txt variant="caption" color={colors.muted}>
            {plant.plantCode}
          </Txt>
        </View>

        {v.status !== 'verified' ? <Banner tone="warn" text={t('uncertainNotice')} style={{ marginTop: space.lg }} /> : null}

        {isUser ? (
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            <Button
              title={t('addToGarden')}
              icon="add-circle"
              onPress={() => router.push({ pathname: '/garden/add', params: { plant: plant._id } })}
              style={{ flex: 1 }}
            />
            <Button
              title={t('tabReport')}
              icon="camera"
              variant="secondary"
              onPress={() => router.push({ pathname: '/report', params: { plant: plant._id } })}
            />
          </View>
        ) : (
          <Button
            title={t('edit')}
            icon="create"
            variant="secondary"
            onPress={() => router.push({ pathname: '/admin/plant-edit', params: { id: plant._id } })}
            style={{ marginTop: space.lg }}
          />
        )}

        <View style={styles.tabs} accessibilityRole="tablist">
          {tabs.map(([k, label]) => (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === k }}
              style={[styles.tab, tab === k && styles.tabActive]}
            >
              <Txt weight={tab === k ? 'bold' : 'regular'} color={tab === k ? colors.primary : colors.inkSoft} style={{ textAlign: 'center' }}>
                {label}
              </Txt>
            </Pressable>
          ))}
        </View>

        {tab === 'overview' ? (
          <>
            <Section icon="information-circle" title={t('overview')}>
              <Value value={loc(plant.description)} fallback={nr} />
              {locList(plant.uses).length ? (
                <>
                  <Txt weight="bold" style={{ marginTop: space.md, marginBottom: space.xs }}>
                    {t('uses')}
                  </Txt>
                  <Bullets items={locList(plant.uses)} />
                </>
              ) : null}
            </Section>
            {plant.varieties?.length ? (
              <Section icon="ribbon" title={t('varieties')}>
                <Txt>{plant.varieties.join(', ')}</Txt>
              </Section>
            ) : null}
            <Section icon="map" title={t('regions')}>
              <InfoRow label={t('regions')} value={plant.regions?.zones?.length ? plant.regions.zones.map((z) => t(`zone_${z}`)).join(', ') : nr} />
              {plant.regions?.districts?.length ? <InfoRow label={t('district')} value={plant.regions.districts.join(', ')} /> : null}
              <InfoRow label={t('climate')} value={loc(plant.regions?.climate) || nr} last />
            </Section>
            {v.sources?.length ? (
              <Section icon="library" title={t('sources')}>
                {v.sources.map((s, i) => (
                  <Pressable key={i} onPress={() => s.url && Linking.openURL(s.url)} accessibilityRole="link" style={{ paddingVertical: space.xs }}>
                    <Txt color={colors.info} style={{ textDecorationLine: s.url ? 'underline' : 'none' }}>
                      {s.title}
                    </Txt>
                  </Pressable>
                ))}
              </Section>
            ) : null}
          </>
        ) : null}

        {tab === 'guide' ? (
          <>
            <Section icon="calendar" title={t('season')}>
              <Value value={loc(plant.season?.text) || (plant.season?.keys || []).map((k) => (k === 'year_round' ? '—' : t(k))).join(', ')} fallback={nr} />
            </Section>

            <Section icon="earth" title={t('soil')} tone={colors.soil}>
              <InfoRow label={t('soil')} value={loc(plant.soil?.type) || nr} />
              <InfoRow
                label={t('soilPh')}
                value={has(plant.soil?.phMin) ? `${plant.soil.phMin} – ${plant.soil.phMax}` : nr}
                last={!loc(plant.soil?.preparation)}
              />
              {loc(plant.soil?.preparation) ? <InfoRow label={t('soilPreparation')} value={loc(plant.soil.preparation)} last /> : null}
            </Section>

            <Section icon="sunny" title={`${t('sunlight')} & ${t('temperature')}`}>
              <InfoRow label={t('sunlight')} value={plant.sunlight?.level ? t(`sun_${plant.sunlight.level}`) : loc(plant.sunlight?.notes) || nr} />
              <InfoRow
                label={t('temperature')}
                last
                value={
                  has(plant.temperature?.optimalMinC)
                    ? `${plant.temperature.optimalMinC}–${plant.temperature.optimalMaxC} °C`
                    : has(plant.temperature?.minC)
                      ? `${plant.temperature.minC}–${plant.temperature.maxC} °C`
                      : nr
                }
              />
            </Section>

            <Section icon="water" title={t('watering')}>
              {plant.watering?.intervalDays ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm, flexWrap: 'wrap' }}>
                  <Txt weight="bold">{t('wateringEvery', { n: plant.watering.intervalDays })}</Txt>
                  {plant.watering.intervalIsEstimate ? (
                    <View style={styles.estimate}>
                      <Txt variant="caption" weight="semibold" color={colors.pending}>
                        {t('estimate')}
                      </Txt>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <Value value={loc(plant.watering?.notes)} fallback={plant.watering?.intervalDays ? '' : nr} />
            </Section>

            <Section icon="flask" title={t('fertilizer')} tone={colors.soil}>
              {loc(fert.summary) ? <Txt style={{ marginBottom: space.md }}>{loc(fert.summary)}</Txt> : null}
              {fert.applications?.length ? (
                <View style={{ gap: space.md }}>
                  {fert.applications.map((a, i) => (
                    <View key={i} style={styles.fertRow}>
                      <Txt weight="bold">{loc(a.timing)}</Txt>
                      {a.products.map((p) => (
                        <View key={p.name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Txt>{p.name}</Txt>
                          <Txt weight="semibold">
                            {has(p.rate) ? `${p.rate} ${p.unit}` : nr}
                            {p.unit === 'kg/ha' && has(p.rate) ? (
                              <Txt variant="caption" color={colors.inkSoft}>
                                {'  '}
                                {t('perSqm', { n: kgPerHaToGPerSqm(p.rate) })}
                              </Txt>
                            ) : null}
                          </Txt>
                        </View>
                      ))}
                      {loc(a.note) ? (
                        <Txt variant="caption" color={colors.inkSoft}>
                          {loc(a.note)}
                        </Txt>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <Txt color={colors.muted}>{nr}</Txt>
              )}
              {locList(fert.organicOptions).length ? (
                <>
                  <Txt weight="bold" style={{ marginTop: space.lg, marginBottom: space.xs }}>
                    {t('organic')}
                  </Txt>
                  <Bullets items={locList(fert.organicOptions)} color={colors.soil} />
                </>
              ) : null}
              {loc(fert.notes) ? <Banner tone="soil" text={loc(fert.notes)} style={{ marginTop: space.md }} icon="calculator" /> : null}
            </Section>

            <Section icon="resize" title={t('spacing')}>
              <InfoRow label={t('betweenPlants')} value={has(plant.spacing?.plantCm) ? `${plant.spacing.plantCm} cm` : nr} />
              <InfoRow label={t('betweenRows')} value={has(plant.spacing?.rowCm) ? `${plant.spacing.rowCm} cm` : nr} last={!loc(plant.spacing?.notes)} />
              {loc(plant.spacing?.notes) ? <InfoRow label={t('note')} value={loc(plant.spacing.notes)} last /> : null}
            </Section>

            <Section icon="leaf" title={t('planting')}>
              <InfoRow label={t('planting')} value={plant.planting?.method ? t(`method_${plant.planting.method}`) : nr} />
              <InfoRow label={t('plantingDepth')} value={has(plant.planting?.depthCm) ? `${plant.planting.depthCm} cm` : nr} />
              <InfoRow label={t('seedRate')} value={loc(plant.planting?.seedRate) || nr} />
              {plant.planting?.method === 'transplanting' ? (
                <InfoRow
                  label={t('nursery')}
                  value={plant.planting?.nurseryDays?.min ? `${plant.planting.nurseryDays.min}–${plant.planting.nurseryDays.max} ${t('days')}` : nr}
                />
              ) : null}
              <InfoRow
                label={t('germination')}
                value={plant.planting?.germinationDays?.min ? `${plant.planting.germinationDays.min}–${plant.planting.germinationDays.max} ${t('days')}` : nr}
                last={!loc(plant.planting?.notes)}
              />
              {loc(plant.planting?.notes) ? <InfoRow label={t('note')} value={loc(plant.planting.notes)} last /> : null}
            </Section>

            <Section icon="basket" title={t('harvest')} tone={colors.soil}>
              <InfoRow
                label={t('harvest')}
                value={has(plant.harvest?.startDays) ? t('harvestFrom', { n: plant.harvest.startDays }) : nr}
                last={!loc(plant.harvest?.notes)}
              />
              {loc(plant.harvest?.notes) ? <InfoRow label={t('note')} value={loc(plant.harvest.notes)} last /> : null}
            </Section>

            {plant.growthStages?.length ? (
              <Section icon="git-commit" title={t('growthPath')}>
                <GrowthPath stages={plant.growthStages} t={t} />
              </Section>
            ) : null}
          </>
        ) : null}

        {tab === 'problems' ? (
          plant.pestsAndDiseases?.length ? (
            plant.pestsAndDiseases.map((d) => <DiseaseCard key={d._id} d={d} />)
          ) : (
            <Txt color={colors.muted}>{nr}</Txt>
          )
        ) : null}
      </View>
    </ScrollView>
  );
}

function DiseaseCard({ d }) {
  const { t, loc, locList } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ marginBottom: space.md }}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
      >
        <View style={{ flex: 1 }}>
          <Txt variant="bodyLg" weight="bold">
            {loc(d.name)}
          </Txt>
          <Txt variant="caption" color={colors.inkSoft}>
            {t(`type_${d.type}`)}
            {d.causalAgent ? `  ` : ''}
            <Txt variant="caption" color={colors.inkSoft} style={{ fontStyle: 'italic' }}>
              {d.causalAgent}
            </Txt>
          </Txt>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color={colors.primary} />
      </Pressable>
      {open ? (
        <View style={{ marginTop: space.md, gap: space.md }}>
          {loc(d.vector) ? <InfoRow icon="bug" label={t('vector')} value={loc(d.vector)} /> : null}
          {[
            ['symptoms', 'eye', colors.primary, 'ellipse'],
            ['prevention', 'shield', colors.primary, 'ellipse'],
            ['treatment', 'medkit', colors.soil, 'ellipse'],
            ['safety', 'warning', colors.danger, 'alert-circle'],
          ].map(([k, icon, color, bullet]) =>
            locList(d[k]).length ? (
              <View key={k}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space.xs }}>
                  <Ionicons name={icon} size={18} color={color} />
                  <Txt weight="bold">{t(k)}</Txt>
                </View>
                <Bullets items={locList(d[k])} color={color} icon={bullet} />
              </View>
            ) : null,
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  fav: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabs: { flexDirection: 'row', marginTop: space.xl, marginBottom: space.lg, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { flex: 1, paddingVertical: space.md, borderBottomWidth: 3, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: colors.primary },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  sectionIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  estimate: { backgroundColor: colors.pendingSoft, paddingHorizontal: 8, borderRadius: radius.pill },
  fertRow: { borderLeftWidth: 3, borderLeftColor: colors.soil, paddingLeft: space.md, gap: 2 },
  node: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stem: { flex: 1, width: 3, backgroundColor: colors.primarySoft, marginVertical: 2 },
});
