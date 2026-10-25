/**
 * Initial sample plant records (spec §4). Editable by admins and instructors.
 *
 * Figures marked with a DOA source were copied from the Department of Agriculture, Sri Lanka
 * crop pages listed in sources.js (fetched October 2026). Anything that page did not give is
 * left empty (null) rather than guessed, and is listed in `verification.uncertainFields`.
 * Default watering reminder intervals are app estimates (intervalIsEstimate: true) – the DOA
 * pages give no fixed interval – and users can change them per plant.
 * All records start as "needs_review" until an Agricultural Instructor verifies them.
 */
const S = require('./sources');

const fert = (si, en, day, products, note) => ({
  timing: { si, en },
  daysAfterPlanting: day,
  products: Object.entries(products).map(([name, rate]) => ({ name, rate, unit: 'kg/ha' })),
  ...(note ? { note } : {}),
});

const PER_HA_NOTE = {
  si: 'මාත්‍රා හෙක්ටයාරයකට (kg/ha) දක්වා ඇත. කුඩා බිම් කොටසක් සඳහා: kg/ha ÷ 10 = වර්ග මීටරයකට ග්‍රෑම් (g/m²). පස් පරීක්ෂාවකින් පසු යෙදීම වඩාත් සුදුසුයි.',
  en: 'Rates are per hectare (kg/ha). For a small plot: kg/ha ÷ 10 = grams per square metre (g/m²). Applying after a soil test is best.',
};

const COMMON_ORGANIC = {
  si: ['හොඳින් දිරාපත් වූ කොම්පෝස්ට්', 'දිරාපත් වූ ගොම පොහොර', 'කොළ පොහොර'],
  en: ['Well-decomposed compost', 'Decomposed cattle manure', 'Green manure'],
};

module.exports = [
  /* ───────────────────────── TOMATO ───────────────────────── */
  {
    key: 'tomato',
    plantCode: 'PM-0001',
    category: 'vegetables',
    name: { si: 'තක්කාලි', en: 'Tomato' },
    scientificName: 'Solanum lycopersicum',
    family: 'Solanaceae',
    description: {
      si: 'තක්කාලි ගෙවතු සහ වාණිජ වගාව සඳහා ජනප්‍රිය එළවළු බෝගයකි. තවානක පැළ සකසා ක්ෂේත්‍රයේ සිටුවනු ලැබේ.',
      en: 'Tomato is a popular vegetable for home gardens and commercial growing. Seedlings are raised in a nursery and transplanted.',
    },
    uses: { si: ['සලාද', 'ව්‍යංජන', 'සෝස් සහ පේස්ට්'], en: ['Salads', 'Curries', 'Sauces and paste'] },
    varieties: ['HORDI Tomato hybrid 03', 'Thilina', 'KWR', 'T245', 'Ravi', 'Lanka Sour', 'Maheshi', 'Tharindu', 'Rajitha', 'Rashmi', 'Bhathiya', 'KC 1', 'Lanka Cherry'],
    season: {
      keys: [],
      text: {
        si: 'තවාන් බීජ වැපිරීම: මාර්තු මැද හෝ අගෝස්තු අග (DOA).',
        en: 'Nursery sowing: mid-March or end of August (DOA).',
      },
    },
    soil: {
      type: { si: 'කාබනික ද්‍රව්‍ය බහුල, ජලය හොඳින් බැස යන පස', en: 'Well-drained soil rich in organic matter' },
      phMin: 5.5,
      phMax: 7.5,
      preparation: {
        si: 'හොඳින් දිරාපත් වූ කාබනික ද්‍රව්‍ය 10 t/ha පසට මිශ්‍ර කරන්න. මූලික පොහොර සිටුවීමට දින 2–3කට පෙර යොදන්න.',
        en: 'Mix 10 t/ha of well-decomposed organic matter into the soil. Apply basal fertilizer 2–3 days before transplanting.',
      },
    },
    sunlight: { level: 'full_sun', notes: { si: '', en: '' } },
    watering: {
      intervalDays: 2,
      intervalIsEstimate: true,
      notes: {
        si: 'අධික ලෙස වතුර දැමීමෙන් වළකින්න; විශේෂයෙන් වියළි කාලයේ අධික ජලය ගෙඩි පැලීමට හේතු වේ (DOA).',
        en: 'Avoid excess water; especially in the dry season it causes fruit cracking (DOA).',
      },
    },
    fertilizer: {
      summary: { si: 'Urea, TSP, MOP – මූලික පොහොර සහ මතුපිට පොහොර දෙකක්', en: 'Urea, TSP, MOP – basal plus two top dressings' },
      applications: [
        fert('මූලික පොහොර (සිටුවීමට දින 1–2කට පෙර)', 'Basal (1–2 days before planting)', -2, { Urea: 65, TSP: 325, MOP: 65 }, {
          si: 'බදුල්ල දිස්ත්‍රික්කයේ TSP 215 kg/ha.',
          en: 'Badulla District: TSP 215 kg/ha.',
        }),
        fert('පළමු මතුපිට පොහොර (සති 3)', '1st top dressing (3 weeks after planting)', 21, { Urea: 65 }),
        fert('දෙවන මතුපිට පොහොර (සති 6)', '2nd top dressing (6 weeks after planting)', 42, { Urea: 65, MOP: 65 }),
      ],
      organicOptions: { si: ['හොඳින් දිරාපත් වූ කාබනික ද්‍රව්‍ය 10 t/ha (DOA)', ...COMMON_ORGANIC.si.slice(1)], en: ['Well-decomposed organic matter 10 t/ha (DOA)', ...COMMON_ORGANIC.en.slice(1)] },
      notes: PER_HA_NOTE,
    },
    spacing: {
      plantCm: 50,
      rowCm: 80,
      notes: { si: 'DOA: 80 cm × 50 cm', en: 'DOA: 80 cm × 50 cm' },
    },
    planting: {
      method: 'transplanting',
      depthCm: null,
      seedRate: { si: '200–250 g/ha', en: '200–250 g/ha' },
      nurseryDays: { min: 14, max: 18 },
      germinationDays: null,
      notes: {
        si: 'සත්‍ය කොළ 3–5ක් සහිත, සෙ.මී. 15–25 උස පැළ සිටුවීමට සුදුසුයි.',
        en: 'Seedlings 15–25 cm tall with 3–5 true leaves are best for transplanting.',
      },
    },
    growthDurationDays: null,
    harvest: {
      startDays: null,
      endDays: null,
      intervalDays: null,
      notes: {
        si: 'ගෙඩි කොළ-කහ පැහැයට හැරෙන විට නෙළන්න; නෙළීම් 10–12ක් පමණ (DOA).',
        en: 'Harvest when fruits turn green-yellow; about 10–12 pickings (DOA).',
      },
    },
    growthStages: [
      { stage: 'seedling', startDay: 0, endDay: 20 },
      { stage: 'vegetative', startDay: 21, endDay: 40 },
      { stage: 'flowering', startDay: 41, endDay: 60 },
      { stage: 'fruiting', startDay: 61, endDay: null },
    ],
    regions: { zones: [], districts: [], climate: { si: '', en: '' } },
    verification: {
      status: 'needs_review',
      sources: [S.tomato],
      uncertainFields: ['season.keys', 'sunlight', 'temperature', 'watering.intervalDays', 'harvest.startDays', 'growthStages', 'regions'],
      notes: 'DOA page lists 80 cm × 50 cm without stating which is the row spacing; row = 80 cm assumed. Harvest start day not given by DOA.',
    },
  },

  /* ───────────────────────── CHILLI ───────────────────────── */
  {
    key: 'chilli',
    plantCode: 'PM-0002',
    category: 'vegetables',
    name: { si: 'මිරිස්', en: 'Chilli' },
    scientificName: 'Capsicum annuum',
    family: 'Solanaceae',
    description: {
      si: 'මිරිස් ශ්‍රී ලංකාවේ ප්‍රධාන ක්ෂේත්‍ර බෝග සහ ගෙවතු බෝගයකි. අමු මිරිස් සහ වියළි මිරිස් ලෙස භාවිත වේ.',
      en: 'Chilli is a major field and home-garden crop in Sri Lanka, used fresh (green) and dried.',
    },
    uses: { si: ['අමු මිරිස්', 'වියළි මිරිස් සහ මිරිස් කුඩු'], en: ['Green chilli', 'Dried chilli and chilli powder'] },
    varieties: [],
    season: { keys: [], text: { si: '', en: '' } },
    soil: { type: { si: '', en: '' }, phMin: null, phMax: null },
    sunlight: { level: null },
    watering: {
      intervalDays: 3,
      intervalIsEstimate: true,
      notes: { si: 'ජලය රැඳීම වළක්වන්න.', en: 'Avoid waterlogging.' },
    },
    fertilizer: { applications: [], organicOptions: COMMON_ORGANIC, notes: { si: 'නිර්දේශිත පොහොර කාලසටහන උපදේශකවරයාගෙන් තහවුරු කරගන්න.', en: 'Confirm the recommended fertilizer schedule with an instructor.' } },
    spacing: { plantCm: null, rowCm: null },
    planting: { method: 'transplanting', nurseryDays: null, germinationDays: null },
    growthDurationDays: null,
    harvest: { startDays: null, endDays: null },
    growthStages: [],
    regions: { zones: [], districts: [] },
    verification: {
      status: 'unverified',
      sources: [],
      uncertainFields: ['season', 'soil', 'sunlight', 'temperature', 'watering', 'fertilizer', 'spacing', 'planting', 'harvest', 'growthStages', 'regions'],
      notes: 'No DOA chilli crop page was reachable when seeding. All cultivation figures must be added and verified by an Agricultural Instructor.',
    },
  },

  /* ───────────────────────── BRINJAL ───────────────────────── */
  {
    key: 'brinjal',
    plantCode: 'PM-0003',
    category: 'vegetables',
    name: { si: 'වම්බටු', en: 'Brinjal (Eggplant)' },
    scientificName: 'Solanum melongena',
    family: 'Solanaceae',
    description: {
      si: 'වම්බටු මුහුදු මට්ටමේ සිට මීටර් 1300 දක්වා වගා කළ හැකි එළවළු බෝගයකි. තවානේ පැළ සකසා සිටුවනු ලැබේ.',
      en: 'Brinjal can be grown up to 1300 m above sea level. Seedlings are raised in a nursery and transplanted.',
    },
    uses: { si: ['ව්‍යංජන', 'බැදුම්', 'මෝජු'], en: ['Curries', 'Fried dishes', 'Pickles (moju)'] },
    varieties: ['Amanda F1', 'Anjalee-F1', 'HORDI Lenairi 1', 'Thinnaweli purple', 'Padagoda', 'SM 164'],
    season: { keys: [], text: { si: '', en: '' } },
    soil: {
      type: { si: 'ජලය හොඳින් බැස යන පස', en: 'Well-drained soil' },
      phMin: 5.5,
      phMax: 5.8,
      preparation: {
        si: 'තවාන් පාත්ති මීටර් 3 × 1, පෘෂ්ඨීය පස සහ ගොම 1:1 මිශ්‍රණය (DOA).',
        en: 'Nursery beds 3 m × 1 m with a 1:1 mix of topsoil and cow dung (DOA).',
      },
    },
    sunlight: { level: 'full_sun', notes: { si: 'තවාන හිරු එළිය ලැබෙන තැනක සකසන්න (DOA).', en: 'Place the nursery in a sunny site (DOA).' } },
    watering: {
      intervalDays: 3,
      intervalIsEstimate: true,
      notes: { si: 'හොඳ වර්ධනයක් සඳහා ජල සැපයුම නිර්දේශිතයි (DOA).', en: 'Water supply is recommended for better growth (DOA).' },
    },
    fertilizer: {
      summary: { si: 'Urea, TSP, MOP – මූලික පොහොර සහ සති 4 සහ 8 මතුපිට පොහොර', en: 'Urea, TSP, MOP – basal plus top dressings at 4 and 8 weeks' },
      applications: [
        fert('මූලික පොහොර', 'Basal', -1, { Urea: 75, TSP: 325, MOP: 85 }),
        fert('සති 4කට පසු', 'After 4 weeks', 28, { Urea: 75 }),
        fert('සති 8කට පසු', 'After 8 weeks', 56, { Urea: 75, MOP: 85 }),
      ],
      organicOptions: COMMON_ORGANIC,
      notes: PER_HA_NOTE,
    },
    spacing: { plantCm: 60, rowCm: 90, notes: { si: 'DOA: 90 cm × 60 cm', en: 'DOA: 90 cm × 60 cm' } },
    planting: {
      method: 'transplanting',
      seedRate: { si: '350 g/ha', en: '350 g/ha' },
      nurseryDays: { min: 25, max: 30 },
      germinationDays: null,
      notes: { si: 'දින 25–30 වයසැති පැළ, වළකට එක පැළයක් බැගින් සිටුවන්න.', en: 'Transplant 25–30-day-old seedlings, one per hole.' },
    },
    growthDurationDays: null,
    harvest: {
      startDays: 70,
      endDays: null,
      intervalDays: 7,
      notes: {
        si: 'සිටුවා සති 10–12කින් පළමු අස්වැන්න; දින 7කට වරක් නෙළීම්, නෙළීම් 10–12ක් (DOA).',
        en: 'First harvest 10–12 weeks after transplanting; pick every 7 days for 10–12 pickings (DOA).',
      },
    },
    growthStages: [
      { stage: 'seedling', startDay: 0, endDay: 20 },
      { stage: 'vegetative', startDay: 21, endDay: 45 },
      { stage: 'flowering', startDay: 46, endDay: 69 },
      { stage: 'harvesting', startDay: 70, endDay: null },
    ],
    regions: { zones: [], districts: [], climate: { si: 'මුහුදු මට්ටමේ සිට මීටර් 1300 දක්වා', en: 'Up to 1300 m above sea level' } },
    verification: {
      status: 'needs_review',
      sources: [S.brinjal],
      uncertainFields: ['season', 'temperature', 'watering.intervalDays', 'growthStages', 'regions.zones'],
      notes: '90 × 60 cm assumed to be row × plant spacing.',
    },
  },

  /* ───────────────────────── OKRA ───────────────────────── */
  {
    key: 'okra',
    plantCode: 'PM-0004',
    category: 'vegetables',
    name: { si: 'බණ්ඩක්කා', en: 'Okra' },
    scientificName: 'Abelmoschus esculentus',
    family: 'Malvaceae',
    description: {
      si: 'බණ්ඩක්කා බීජ සෘජුවම වපුරා වගා කරන, දිගු කලක් අස්වැන්න ලබා දෙන එළවළු බෝගයකි.',
      en: 'Okra is direct-seeded and gives a long harvesting period.',
    },
    uses: { si: ['ව්‍යංජන', 'බැදුම්'], en: ['Curries', 'Fried dishes'] },
    varieties: ['MI5', 'MI7', 'OKH1 (hybrid)', 'Haritha'],
    season: {
      keys: ['yala', 'maha'],
      text: {
        si: 'යල: අප්‍රේල් මුල සිට මැයි මුල දක්වා. මහ: සැප්තැම්බර් මුල සිට ඔක්තෝබර් මුල දක්වා (DOA).',
        en: 'Yala: early April to early May. Maha: early September to early October (DOA).',
      },
    },
    soil: {
      type: { si: 'ආම්ලික හෝ භාෂ්මික නොවන, ජලය හොඳින් බැස යන පස', en: 'Well-drained soil, neither acidic nor alkaline' },
      phMin: null,
      phMax: null,
      preparation: { si: 'හොඳින් දිරාපත් වූ කාබනික ද්‍රව්‍ය 10 t/ha පසට මිශ්‍ර කරන්න.', en: 'Mix 10 t/ha of well-decomposed organic matter into the soil.' },
    },
    sunlight: { level: null },
    watering: {
      intervalDays: 2,
      intervalIsEstimate: true,
      notes: {
        si: 'පැළ හටගන්නා තෙක් දිනකට දෙවරක්; පසුව පසේ තෙත්බව අනුව (DOA).',
        en: 'Twice a day until germination, then according to soil moisture (DOA).',
      },
    },
    fertilizer: {
      summary: { si: 'Urea, TSP, MOP – මූලික පොහොර සහ මතුපිට පොහොර තුනක්', en: 'Urea, TSP, MOP – basal plus three top dressings' },
      applications: [
        fert('මූලික පොහොර', 'Basal', -1, { Urea: 50, TSP: 195, MOP: 25 }),
        fert('සිටුවා සති 2', '2 weeks after planting', 14, { Urea: 50, MOP: 25 }),
        fert('සිටුවා සති 5', '5 weeks after planting', 35, { Urea: 100, MOP: 50 }),
        fert('සිටුවා සති 8', '8 weeks after planting', 56, { Urea: 100, MOP: 50 }),
      ],
      organicOptions: { si: ['හොඳින් දිරාපත් වූ කාබනික ද්‍රව්‍ය 10 t/ha (DOA)', ...COMMON_ORGANIC.si.slice(1)], en: ['Well-decomposed organic matter 10 t/ha (DOA)', ...COMMON_ORGANIC.en.slice(1)] },
      notes: PER_HA_NOTE,
    },
    spacing: { plantCm: 60, rowCm: 90, notes: { si: 'පේළි අතර 90 cm, පැළ අතර 60 cm (DOA)', en: '90 cm between rows, 60 cm between plants (DOA)' } },
    planting: { method: 'direct_seeding', depthCm: null, seedRate: { si: '4.5 kg/ha', en: '4.5 kg/ha' }, nurseryDays: null, germinationDays: null },
    growthDurationDays: { min: null, max: 100 },
    harvest: {
      startDays: 50,
      endDays: 100,
      intervalDays: 2,
      notes: { si: 'සිටුවා දින 50–100 අතර, දින 2කට වරක්, 25 වතාවක් දක්වා නෙළීම (DOA).', en: 'Harvest from 50 to 100 days after planting, every 2 days, up to 25 times (DOA).' },
    },
    growthStages: [
      { stage: 'germination', startDay: 0, endDay: 10 },
      { stage: 'vegetative', startDay: 11, endDay: 35 },
      { stage: 'flowering', startDay: 36, endDay: 49 },
      { stage: 'harvesting', startDay: 50, endDay: 100 },
    ],
    regions: { zones: [], districts: [] },
    verification: {
      status: 'needs_review',
      sources: [S.okra],
      uncertainFields: ['soil.ph', 'sunlight', 'temperature', 'planting.depthCm', 'watering.intervalDays', 'growthStages', 'regions'],
      notes: 'Harvesting window taken from DOA ("harvesting over 50–100 days after planting").',
    },
  },

  /* ───────────────────────── CUCUMBER ───────────────────────── */
  {
    key: 'cucumber',
    plantCode: 'PM-0005',
    category: 'vegetables',
    name: { si: 'පිපිඤ්ඤා', en: 'Cucumber' },
    scientificName: 'Cucumis sativus',
    family: 'Cucurbitaceae',
    description: {
      si: 'පිපිඤ්ඤා බීජ සෘජුවම වපුරා වගා කරයි. තෙත් කලාපයේ වසර පුරා සහ වියළි කලාපයේ මහ කන්නයේ වගාවට සුදුසුයි.',
      en: 'Cucumber is direct-seeded. Suitable year-round in the wet zone and in Maha season in the dry zone.',
    },
    uses: { si: ['සලාද', 'සම්බෝල', 'ව්‍යංජන'], en: ['Salads', 'Sambols', 'Curries'] },
    varieties: ['HORDI Green', 'HORDI White', 'Kalpitiya white', 'Champion', 'Gannoruwa white', 'LY 58'],
    season: {
      keys: ['year_round'],
      text: { si: 'තෙත් කලාපය: වසර පුරා. වියළි කලාපය: මහ කන්නය (DOA).', en: 'Wet zone: year-round. Dry zone: Maha season (DOA).' },
    },
    soil: {
      type: { si: 'ජලවහනය හොඳ, කාබනික ද්‍රව්‍ය සහිත පස', en: 'Well-drained soil with organic matter' },
      phMin: 5.5,
      phMax: 7.5,
    },
    sunlight: { level: null },
    watering: {
      intervalDays: 2,
      intervalIsEstimate: true,
      notes: { si: 'ජලය රැඳී නොසිටින සේ ප්‍රමාණවත් ලෙස වතුර දමන්න (DOA).', en: 'Apply sufficient water without waterlogging (DOA).' },
    },
    fertilizer: {
      summary: { si: 'Urea, TSP, MOP – මූලික පොහොර සහ සති 4 සහ 5 මතුපිට පොහොර', en: 'Urea, TSP, MOP – basal plus top dressings at 4 and 5 weeks' },
      applications: [
        fert('මූලික පොහොර', 'Basal', -1, { Urea: 75, TSP: 200, MOP: 60 }),
        fert('සති 4කට පසු', 'After 4 weeks', 28, { Urea: 75, MOP: 60 }),
        fert('සති 5කට පසු', 'After 5 weeks', 35, { Urea: 75, MOP: 60 }),
      ],
      organicOptions: COMMON_ORGANIC,
      notes: PER_HA_NOTE,
    },
    spacing: { plantCm: 100, rowCm: 100, notes: { si: 'තනි බෝගයක් ලෙස 1 m × 1 m (DOA)', en: '1 m × 1 m as a monocrop (DOA)' } },
    planting: { method: 'direct_seeding', depthCm: null, seedRate: { si: '1 kg/ha', en: '1 kg/ha' }, nurseryDays: null, germinationDays: null },
    growthDurationDays: null,
    harvest: { startDays: null, endDays: null, notes: { si: '', en: '' } },
    growthStages: [],
    regions: {
      zones: ['wet', 'dry'],
      districts: [],
      climate: { si: 'තෙත් කලාපය වසර පුරා; වියළි කලාපය මහ කන්නයේ', en: 'Wet zone year-round; dry zone in Maha' },
    },
    verification: {
      status: 'needs_review',
      sources: [S.cucumber],
      uncertainFields: ['sunlight', 'temperature', 'planting.depthCm', 'watering.intervalDays', 'harvest', 'growthStages'],
      notes: 'DOA harvesting section was blank when seeding.',
    },
  },

  /* ───────────────────────── BEANS ───────────────────────── */
  {
    key: 'bean',
    plantCode: 'PM-0006',
    category: 'vegetables',
    name: { si: 'බෝංචි', en: 'Beans' },
    scientificName: 'Phaseolus vulgaris',
    family: 'Fabaceae',
    description: {
      si: 'බෝංචි වැල් (pole) සහ පඳුරු (bush) වර්ග ලෙස වගා කෙරේ. වැල් බෝංචි සඳහා ආධාරක අවශ්‍යයි.',
      en: 'Beans are grown as pole (climbing) and bush types. Pole beans need support.',
    },
    uses: { si: ['ව්‍යංජන', 'බැදුම්', 'සුප්'], en: ['Curries', 'Stir-fries', 'Soups'] },
    varieties: ['Balangoda Nil', 'Bandarawela Green', 'Gannoruwa BIL', 'Kekulu Bonchi', 'Gannoruwa Green', 'Kappetipola Nil', 'HORDI Green', 'Kentucky Wonder Green', 'Lanka Butter', 'HORDI Bean-03', 'Cherokee Wax', 'Sanjaya', 'Wade', 'Top Crop'],
    season: {
      keys: ['yala', 'maha'],
      text: {
        si: 'බදුල්ල දිස්ත්‍රික්කය – මහ: නොවැම්බර්–දෙසැම්බර්; යල: මාර්තු–අප්‍රේල් (DOA).',
        en: 'Badulla District – Maha: November–December; Yala: March–April (DOA).',
      },
    },
    soil: {
      type: { si: 'ජලවහනය හොඳ ලෝම හෝ වැලි ලෝම පස (රතු-කහ පොඩ්සොලික්)', en: 'Well-drained loam or sandy loam (Red Yellow Podzolic)' },
      phMin: 5.5,
      phMax: 6.5,
      preparation: { si: 'බීජ වැපිරීමට දින 5–6කට පෙර දිරාපත් කාබනික පොහොර 10 t/ha.', en: 'Apply 10 t/ha decomposed organic manure 5–6 days before seeding.' },
    },
    sunlight: { level: null },
    watering: {
      intervalDays: 3,
      intervalIsEstimate: true,
      notes: {
        si: 'වර්ෂාපතනය ප්‍රමාණවත් නොවේ නම් අමතර ජලය. මල් හා කරල් කාලයේ පසේ තෙත්බව උපරිමයෙන් තබන්න (DOA).',
        en: 'Irrigate if rainfall is insufficient. Keep soil moisture optimal during flowering and pod set (DOA).',
      },
    },
    fertilizer: {
      summary: {
        si: 'වැල් බෝංචි සඳහා දැක්වේ. පඳුරු බෝංචි: මූලික Urea 85, TSP 165, MOP 65; සති 3 Urea 85, MOP 65 (kg/ha).',
        en: 'Shown for pole beans. Bush beans: basal Urea 85, TSP 165, MOP 65; week 3 Urea 85, MOP 65 (kg/ha).',
      },
      applications: [
        fert('මූලික පොහොර (බීජ වැපිරීමට දින 1–2කට පෙර)', 'Basal (1–2 days before seeding)', -2, { Urea: 110, TSP: 270, MOP: 75 }),
        fert('මතුපිට පොහොර (සති 3)', 'Top dressing (3 weeks after planting)', 21, { Urea: 110, MOP: 75 }),
      ],
      organicOptions: { si: ['දිරාපත් කාබනික පොහොර 10 t/ha (DOA)', ...COMMON_ORGANIC.si.slice(1)], en: ['Decomposed organic manure 10 t/ha (DOA)', ...COMMON_ORGANIC.en.slice(1)] },
      notes: {
        si: `${PER_HA_NOTE.si} පස් පරීක්ෂාවකින් පසු යෙදීම වඩා හොඳ බව DOA සඳහන් කරයි.`,
        en: `${PER_HA_NOTE.en} DOA notes it is better to apply after a soil test.`,
      },
    },
    spacing: {
      plantCm: 40,
      rowCm: 50,
      notes: { si: 'වැල්: 50 × 40 cm. පඳුරු: 50 × 15 cm (DOA).', en: 'Pole: 50 × 40 cm. Bush: 50 × 15 cm (DOA).' },
    },
    planting: {
      method: 'direct_seeding',
      depthCm: null,
      seedRate: { si: 'වැල් 50 kg/ha; පඳුරු 75 kg/ha', en: 'Pole 50 kg/ha; bush 75 kg/ha' },
      nurseryDays: null,
      germinationDays: null,
      notes: { si: 'වළකට බීජ 3–4ක්; සති 2කට පසු පැළ 2ක් තබන්න.', en: '3–4 seeds per hole; keep two seedlings after 2 weeks.' },
    },
    growthDurationDays: null,
    harvest: {
      startDays: 60,
      endDays: null,
      intervalDays: 7,
      notes: {
        si: 'වැල්: දින 60න් පසු; පඳුරු: දින 45න් පසු. ගන්නෝරුව BIL දින 4කට වරක්, අනෙක් ඒවා දින 7කට වරක් (DOA).',
        en: 'Pole: from 60 days; bush: from 45 days. Gannoruwa BIL every 4 days, others every 7 days (DOA).',
      },
    },
    growthStages: [
      { stage: 'germination', startDay: 0, endDay: 10 },
      { stage: 'vegetative', startDay: 11, endDay: 34 },
      { stage: 'flowering', startDay: 35, endDay: 59 },
      { stage: 'harvesting', startDay: 60, endDay: null },
    ],
    regions: { zones: ['mid_country', 'up_country'], districts: ['Badulla'], climate: { si: '', en: '' } },
    verification: {
      status: 'needs_review',
      sources: [S.bean, S.beanVarieties],
      uncertainFields: ['sunlight', 'temperature', 'planting.depthCm', 'watering.intervalDays', 'growthStages', 'regions.zones'],
      notes: 'Harvest and fertilizer schedule use pole-bean figures; bush-bean figures are in the notes. Flowering stage window estimated from variety data (first flowering ~30–45 days).',
    },
  },

  /* ───────────────────────── PAPAYA ───────────────────────── */
  {
    key: 'papaya',
    plantCode: 'PM-0007',
    category: 'fruits',
    name: { si: 'පැපොල්', en: 'Papaya' },
    scientificName: 'Carica papaya',
    family: 'Caricaceae',
    description: {
      si: 'පැපොල් ගෙවතු සඳහා ජනප්‍රිය, ඉක්මනින් ඵල දරන පලතුරු ශාකයකි.',
      en: 'Papaya is a popular, fast-bearing fruit plant for home gardens.',
    },
    uses: { si: ['ඉදුණු ගෙඩි ආහාරයට', 'අමු ගෙඩි ව්‍යංජනයට'], en: ['Ripe fruit eaten fresh', 'Unripe fruit in curries'] },
    varieties: [],
    season: { keys: [], text: { si: '', en: '' } },
    soil: { type: { si: 'ජලය රැඳී නොසිටින පස', en: 'Soil that does not waterlog' }, phMin: null, phMax: null },
    sunlight: { level: null },
    watering: { intervalDays: 4, intervalIsEstimate: true, notes: { si: '', en: '' } },
    fertilizer: { applications: [], organicOptions: COMMON_ORGANIC, notes: { si: 'නිර්දේශිත පොහොර කාලසටහන උපදේශකවරයාගෙන් තහවුරු කරගන්න.', en: 'Confirm the recommended fertilizer schedule with an instructor.' } },
    spacing: { plantCm: null, rowCm: null },
    planting: { method: 'transplanting' },
    growthDurationDays: null,
    harvest: { startDays: null, endDays: null },
    growthStages: [],
    regions: { zones: [], districts: [] },
    verification: {
      status: 'unverified',
      sources: [],
      uncertainFields: ['season', 'soil', 'sunlight', 'temperature', 'watering', 'fertilizer', 'spacing', 'planting', 'harvest', 'growthStages', 'regions'],
      notes: 'No DOA papaya crop page was reachable when seeding. All cultivation figures must be added and verified by an Agricultural Instructor.',
    },
  },

  /* ───────────────────────── BANANA ───────────────────────── */
  {
    key: 'banana',
    plantCode: 'PM-0008',
    category: 'fruits',
    name: { si: 'කෙසෙල්', en: 'Banana' },
    scientificName: 'Musa spp.',
    family: 'Musaceae',
    description: {
      si: 'කෙසෙල් ශ්‍රී ලංකාවේ බහුලව වගා කරන පලතුරු බෝගයකි. පැල (sucker) මඟින් ප්‍රචාරණය කෙරේ.',
      en: 'Banana is one of the most widely grown fruit crops in Sri Lanka, propagated from suckers.',
    },
    uses: { si: ['ඉදුණු ගෙඩි', 'අළු කෙසෙල් ව්‍යංජන', 'කෙසෙල් මුව'], en: ['Ripe fruit', 'Ash plantain curry', 'Banana blossom'] },
    varieties: [],
    season: { keys: [], text: { si: '', en: '' } },
    soil: { type: { si: '', en: '' }, phMin: null, phMax: null },
    sunlight: { level: null },
    watering: { intervalDays: 4, intervalIsEstimate: true, notes: { si: '', en: '' } },
    fertilizer: { applications: [], organicOptions: COMMON_ORGANIC, notes: { si: 'නිර්දේශිත පොහොර කාලසටහන උපදේශකවරයාගෙන් තහවුරු කරගන්න.', en: 'Confirm the recommended fertilizer schedule with an instructor.' } },
    spacing: { plantCm: null, rowCm: null },
    planting: { method: 'vegetative' },
    growthDurationDays: null,
    harvest: { startDays: null, endDays: null },
    growthStages: [],
    regions: { zones: [], districts: [] },
    verification: {
      status: 'unverified',
      sources: [],
      uncertainFields: ['season', 'soil', 'sunlight', 'temperature', 'watering', 'fertilizer', 'spacing', 'planting', 'harvest', 'growthStages', 'regions'],
      notes: 'No DOA banana crop page was reachable when seeding. All cultivation figures must be added and verified by an Agricultural Instructor.',
    },
  },

  /* ───────────────────────── MANGO ───────────────────────── */
  {
    key: 'mango',
    plantCode: 'PM-0009',
    category: 'fruits',
    name: { si: 'අඹ', en: 'Mango' },
    scientificName: 'Mangifera indica',
    family: 'Anacardiaceae',
    description: {
      si: 'අඹ මීටර් 1300 දක්වා වගා කළ හැකි වුවද වාණිජ වගාව මුහුදු මට්ටමේ සිට මීටර් 600 දක්වා සාර්ථකයි. DOA සහතික කළ බද්ධ පැළ භාවිත කරන්න.',
      en: 'Mango grows up to 1300 m, but commercial growing succeeds from sea level to 600 m. Use DOA-certified budded or grafted plants.',
    },
    uses: { si: ['ඉදුණු ගෙඩි', 'අමු අඹ ව්‍යංජන සහ අච්චාරු'], en: ['Ripe fruit', 'Green mango curries and pickles'] },
    varieties: ['Horanahiru (low-country wet zone)', 'Karthacolomban (dry & intermediate)', 'Velleicolomban (wet & intermediate)', 'Villard (dry)', 'TOM EJC (dry, commercial)', 'Malwana (dry & intermediate)', 'Dampara (wet)', 'Giraamba (wet)'],
    season: { keys: [], text: { si: 'වැසි කාලය ආරම්භයට පෙර බිම සකස් කරන්න (DOA).', en: 'Prepare the land before the rainy season starts (DOA).' } },
    soil: {
      type: { si: 'ගැඹුරු, සාරවත්, ජලය හොඳින් බැස යන පස. ජලය රැඳෙන පස නුසුදුසුයි.', en: 'Deep, rich, well-drained soil. Waterlogged soils are unsuitable.' },
      phMin: 5.5,
      phMax: 7.5,
      preparation: {
        si: 'වළ 60 × 60 × 60 cm (දැඩි පසේ 90 cm). සිටුවීමට සති 2කට පෙර කාබනික පොහොර 20 kg සහ මතුපිට පසින් පුරවන්න.',
        en: 'Pit 60 × 60 × 60 cm (90 cm in hard soil). Refill with 20 kg organic manure and topsoil 2 weeks before planting.',
      },
    },
    sunlight: { level: null },
    temperature: { minC: null, maxC: null, optimalMinC: 27, optimalMaxC: 30 },
    watering: {
      intervalDays: 3,
      intervalIsEstimate: false,
      notes: {
        si: 'සිටුවූ පසු සහ නියඟයේදී වතුර දමන්න; සිටුවීමෙන් පසු වියළි කාලයක් නම් අවම වශයෙන් දින 3කට වරක්. මල් පිපීම ප්‍රේරණයට මාස 3–4කට පෙර වතුර නවත්වන්න; මල් පිපීමේ සිට ගෙඩි මේරීම දක්වා නිතිපතා වතුර දමන්න (DOA).',
        en: 'Water after planting and during drought; at least every 3 days if a dry season follows planting. Stop watering 3–4 months before flower induction, then water regularly from flowering to fruit maturity (DOA).',
      },
    },
    fertilizer: {
      applications: [],
      organicOptions: { si: ['වළ පිරවීමට කාබනික පොහොර 20 kg (DOA)', ...COMMON_ORGANIC.si], en: ['20 kg organic manure for pit filling (DOA)', ...COMMON_ORGANIC.en] },
      notes: { si: 'DOA පිටුවේ රසායනික පොහොර නිර්දේශයක් දක්වා නැත. උපදේශකවරයාගෙන් තහවුරු කරගන්න.', en: 'The DOA page gives no chemical fertilizer recommendation. Confirm with an instructor.' },
    },
    spacing: {
      plantCm: 1000,
      rowCm: 1000,
      notes: {
        si: 'බොහෝ ප්‍රභේද 10 m × 10 m. Villard: පේළිය තුළ 7 m, පේළි අතර 10 m. TOM EJC (ඉහළ ඝනත්වය): 5 × 5 m (DOA).',
        en: 'Most varieties 10 m × 10 m. Villard: 7 m in row, 10 m between rows. TOM EJC (high density): 5 × 5 m (DOA).',
      },
    },
    planting: { method: 'grafted', notes: { si: 'DOA සහතික කළ බද්ධ පැළ', en: 'DOA-certified budded/grafted plants' } },
    growthDurationDays: null,
    harvest: {
      startDays: null,
      endDays: null,
      notes: { si: 'පෙ.ව. 10.00 සිට ප.ව. 3.00 අතර නෙළන්න (DOA).', en: 'Harvest between 10.00 am and 3.00 pm (DOA).' },
    },
    growthStages: [],
    regions: {
      zones: ['wet', 'intermediate', 'dry'],
      districts: [],
      climate: {
        si: 'වාර්ෂික වර්ෂාපතනය 500–2500 mm; ප්‍රශස්ත උෂ්ණත්වය 27–30 °C (DOA).',
        en: 'Annual rainfall 500–2500 mm; optimum temperature 27–30 °C (DOA).',
      },
    },
    verification: {
      status: 'needs_review',
      sources: [S.mango],
      uncertainFields: ['sunlight', 'fertilizer.applications', 'harvest.startDays', 'growthStages'],
      notes: 'Zones depend on variety (see varieties list). DOA page lists rainfall as "500–2500 ml", read as mm.',
    },
  },
];
