const SI_MONTHS = ['ජන', 'පෙබ', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝ', 'සැප්', 'ඔක්', 'නොවැ', 'දෙසැ'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 86400000;

export function formatDate(value, lang = 'si') {
  if (!value) return '';
  const d = new Date(value);
  const m = (lang === 'en' ? EN_MONTHS : SI_MONTHS)[d.getMonth()];
  return lang === 'en' ? `${d.getDate()} ${m} ${d.getFullYear()}` : `${d.getFullYear()} ${m} ${d.getDate()}`;
}

export function formatTime(value) {
  const d = new Date(value);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateTime(value, lang) {
  return value ? `${formatDate(value, lang)}, ${formatTime(value)}` : '';
}

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** "Today", "Tomorrow", "in 3 days", "4 days ago" */
export function relativeDay(value, t) {
  if (!value) return '';
  const diff = Math.round((startOfDay(value) - startOfDay(new Date())) / DAY);
  if (diff === 0) return t('today');
  if (diff === 1) return t('tomorrow');
  if (diff > 1) return t('inDays', { n: diff });
  return t('daysAgo', { n: -diff });
}

export function isoDate(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** Parses "YYYY-MM-DD" as a local date (avoids UTC shifting the day). */
export function parseIsoDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 9, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** kg/ha → g/m² (1 ha = 10 000 m²; 1 kg = 1000 g → ÷ 10). */
export const kgPerHaToGPerSqm = (rate) => (rate == null ? null : Math.round((rate / 10) * 10) / 10);

export const splitLines = (s) =>
  String(s || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
