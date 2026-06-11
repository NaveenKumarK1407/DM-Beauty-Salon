import { normalizeDayName, getOpenDaysLabel, DAY_ABBR } from './hours.js';

export function getIstNow() {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5);
}

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

/** Strip to mobile digits — handles +91 / leading 0. */
export function normalizePhoneDigits(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function isValidPhone10(phone) {
  return normalizePhoneDigits(phone).length === 10;
}

export function getPhoneValidationError(phone) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return 'Phone number is required';
  if (digits.length < 10) return 'Enter a valid 10-digit phone number';
  if (digits.length > 10) return 'Enter a valid 10-digit phone number';
  return null;
}

/** True when studio is open right now (IST): open day + between openTime and closeTime. */
export function isStudioOpen(settings) {
  if (!settings) return false;

  const istTime = getIstNow();
  const dayOfWeek = istTime.toLocaleString('en-US', { weekday: 'long' });
  const currentTimeVal = istTime.getHours() * 60 + istTime.getMinutes();

  const closedDays = (settings.closedDays || ['Sunday'])
    .map((day) => normalizeDayName(day))
    .filter(Boolean);
  if (closedDays.includes(normalizeDayName(dayOfWeek))) return false;

  const openTime = settings.openTime || '10:00';
  const closeTime = settings.closeTime || '20:00';
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openTimeVal = openH * 60 + openM;
  const closeTimeVal = closeH * 60 + closeM;

  return currentTimeVal >= openTimeVal && currentTimeVal < closeTimeVal;
}

/** Mobile nav brand line: Mon · CLOSED | Tue - Sun · OPEN NOW | CLOSED after hours */
export function getMobileBrandStatus(settings) {
  if (!settings) return { prefix: null, status: 'CLOSED', isOpen: false };

  const istTime = getIstNow();
  const dayOfWeek = istTime.toLocaleString('en-US', { weekday: 'long' });
  const todayAbbr = DAY_ABBR[normalizeDayName(dayOfWeek)] || dayOfWeek.slice(0, 3);

  const closedDays = (settings.closedDays || ['Sunday'])
    .map((day) => normalizeDayName(day))
    .filter(Boolean);

  if (closedDays.includes(normalizeDayName(dayOfWeek))) {
    return { prefix: todayAbbr, status: 'CLOSED', isOpen: false };
  }

  const openDays = getOpenDaysLabel(settings);
  if (isStudioOpen(settings)) {
    return { prefix: openDays, status: 'OPEN NOW', isOpen: true };
  }

  return { prefix: null, status: 'CLOSED', isOpen: false };
}
