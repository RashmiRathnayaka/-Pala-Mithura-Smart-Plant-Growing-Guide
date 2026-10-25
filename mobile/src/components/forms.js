/** Shared form pickers backed by reference data. */
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { Select } from './ui';

let metaCache = null;
export function useMeta() {
  const [meta, setMeta] = useState(metaCache);
  useEffect(() => {
    if (metaCache) return;
    api
      .get('/meta')
      .then((m) => {
        metaCache = m;
        setMeta(m);
      })
      .catch(() => {});
  }, []);
  return meta;
}

export function DistrictSelect({ value, onChange, label }) {
  const { t, lang } = useI18n();
  const meta = useMeta();
  const options = (meta?.districts || []).map((d) => ({
    value: d.key,
    label: lang === 'en' ? d.key : `${d.si} (${d.key})`,
    sublabel: t(`zone_${d.zone}`),
  }));
  return <Select label={label ?? t('district')} placeholder={t('chooseDistrict')} value={value} onChange={onChange} options={options} />;
}

export function StageSelect({ value, onChange, label }) {
  const { t } = useI18n();
  const stages = ['seed', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvesting', 'completed'];
  return <Select label={label ?? t('currentStage')} value={value} onChange={onChange} options={stages.map((s) => ({ value: s, label: t(`stage_${s}`) }))} />;
}
