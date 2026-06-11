export function getCityFromAddress(address) {
  if (!address) return 'Medak';
  const parts = address.split(',').map((p) => p.trim());

  // Filter out parts that are state names, country names, or empty
  const stateNames = [
    'telangana',
    'andhra pradesh',
    'karnataka',
    'maharashtra',
    'tamil nadu',
    'kerala',
    'india',
    'in',
    'us',
    'usa',
    'united states',
  ];

  const cleanParts = parts.filter((p) => {
    const lowered = p.toLowerCase();
    if (stateNames.includes(lowered)) return false;
    if (/^\d+$/.test(p)) return false; // purely numbers like pin codes
    return true;
  });

  if (cleanParts.length === 0) return 'Medak';

  // Get the last part and clean up any remaining pin codes/zip codes in it
  let lastPart = cleanParts[cleanParts.length - 1];

  // Remove 5 or 6 digit pin codes
  lastPart = lastPart.replace(/\b\d{5,6}\b/g, '').trim();

  // Also check if the resulting part is a state or too short, if so, look at previous parts
  const isState = stateNames.some((state) => lastPart.toLowerCase().includes(state));
  if (isState && cleanParts.length > 1) {
    let secondLast = cleanParts[cleanParts.length - 2];
    secondLast = secondLast.replace(/\b\d{5,6}\b/g, '').trim();
    if (secondLast) return secondLast;
  }

  return lastPart || 'Medak';
}

/** Normalize any stored booking date to YYYY-MM-DD in local time (no UTC shift). */
export function toLocalDateKey(input) {
  if (!input) return '';
  const iso = String(input).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocalKey() {
  return toLocalDateKey(new Date());
}

export function isStudioOpen(settings) {
  if (!settings) return false;

  // Medak is in India (IST, UTC+5:30)
  // Calculate current date/time in IST timezone
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const istOffset = 5.5;
  const istTime = new Date(utc + (3600000 * istOffset));

  const dayOfWeek = istTime.toLocaleString('en-US', { weekday: 'long' }); // e.g. "Monday"
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  const currentTimeVal = currentHour * 60 + currentMinute; // minutes since midnight

  // Build closed-days list: explicit settings.closedDays PLUS any "day · Closed"
  // entries found in hoursText (e.g. "sat · Closed" or "Sunday · Closed")
  const closedDays = (settings.closedDays || ['Sunday']).map(d => d.toLowerCase().trim());
  if (settings.hoursText) {
    const ABBR = { mon:'monday', tue:'tuesday', wed:'wednesday', thu:'thursday', fri:'friday', sat:'saturday', sun:'sunday' };
    settings.hoursText.split(',').forEach(part => {
      const p = part.toLowerCase().trim();
      if (p.includes('closed')) {
        for (const [abbr, full] of Object.entries(ABBR)) {
          if (p.startsWith(abbr)) { if (!closedDays.includes(full)) closedDays.push(full); break; }
        }
      }
    });
  }
  if (closedDays.includes(dayOfWeek.toLowerCase())) return false;

  // Get open and close times
  const openTime = settings.openTime || '10:00';
  const closeTime = settings.closeTime || '20:00';

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  const openTimeVal = openH * 60 + openM;
  const closeTimeVal = closeH * 60 + closeM;

  return currentTimeVal >= openTimeVal && currentTimeVal < closeTimeVal;
}
