/**
 * Sri Lankan districts with their *predominant* agro-climatic zone.
 * Many districts span more than one zone; this is an approximation used only to rank
 * plant suggestions. Users can set their exact zone in their profile.
 */
const DISTRICTS = [
  { key: 'Colombo', si: 'කොළඹ', zone: 'wet' },
  { key: 'Gampaha', si: 'ගම්පහ', zone: 'wet' },
  { key: 'Kalutara', si: 'කළුතර', zone: 'wet' },
  { key: 'Kandy', si: 'මහනුවර', zone: 'wet' },
  { key: 'Matale', si: 'මාතලේ', zone: 'intermediate' },
  { key: 'Nuwara Eliya', si: 'නුවරඑළිය', zone: 'wet' },
  { key: 'Galle', si: 'ගාල්ල', zone: 'wet' },
  { key: 'Matara', si: 'මාතර', zone: 'wet' },
  { key: 'Hambantota', si: 'හම්බන්තොට', zone: 'dry' },
  { key: 'Jaffna', si: 'යාපනය', zone: 'dry' },
  { key: 'Kilinochchi', si: 'කිලිනොච්චිය', zone: 'dry' },
  { key: 'Mannar', si: 'මන්නාරම', zone: 'dry' },
  { key: 'Vavuniya', si: 'වවුනියාව', zone: 'dry' },
  { key: 'Mullaitivu', si: 'මුලතිව්', zone: 'dry' },
  { key: 'Batticaloa', si: 'මඩකලපුව', zone: 'dry' },
  { key: 'Ampara', si: 'අම්පාර', zone: 'dry' },
  { key: 'Trincomalee', si: 'ත්‍රිකුණාමලය', zone: 'dry' },
  { key: 'Kurunegala', si: 'කුරුණෑගල', zone: 'intermediate' },
  { key: 'Puttalam', si: 'පුත්තලම', zone: 'dry' },
  { key: 'Anuradhapura', si: 'අනුරාධපුරය', zone: 'dry' },
  { key: 'Polonnaruwa', si: 'පොළොන්නරුව', zone: 'dry' },
  { key: 'Badulla', si: 'බදුල්ල', zone: 'intermediate' },
  { key: 'Monaragala', si: 'මොණරාගල', zone: 'intermediate' },
  { key: 'Ratnapura', si: 'රත්නපුර', zone: 'wet' },
  { key: 'Kegalle', si: 'කෑගල්ල', zone: 'wet' },
];

/** Maha ≈ September–February (north-east monsoon), Yala ≈ March–August. */
function currentSeason(date = new Date()) {
  const m = date.getMonth() + 1;
  return [9, 10, 11, 12, 1, 2].includes(m) ? 'maha' : 'yala';
}

function zoneForDistrict(district) {
  const d = DISTRICTS.find((x) => x.key.toLowerCase() === String(district || '').toLowerCase() || x.si === district);
  return d ? d.zone : null;
}

module.exports = { DISTRICTS, currentSeason, zoneForDistrict };
