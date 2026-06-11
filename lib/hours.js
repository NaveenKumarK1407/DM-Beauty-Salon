// Studio hours helpers — single source for admin + public site display.

export const DAY_ABBR = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const DAY_FULL = {
  mon: 'monday',
  monday: 'monday',
  tue: 'tuesday',
  tuesday: 'tuesday',
  wed: 'wednesday',
  wednesday: 'wednesday',
  thu: 'thursday',
  thursday: 'thursday',
  fri: 'friday',
  friday: 'friday',
  sat: 'saturday',
  saturday: 'saturday',
  sun: 'sunday',
  sunday: 'sunday',
};

export const WEEKDAYS = [
  { key: 'Monday', short: 'Mon' },
  { key: 'Tuesday', short: 'Tue' },
  { key: 'Wednesday', short: 'Wed' },
  { key: 'Thursday', short: 'Thu' },
  { key: 'Friday', short: 'Fri' },
  { key: 'Saturday', short: 'Sat' },
  { key: 'Sunday', short: 'Sun' },
];

export const OPEN_DAY_PRESETS = [
  'Mon - Fri',
  'Mon - Sat',
  'Mon - Sun',
  'Tue - Sun',
];

export function normalizeDayName(day) {
  if (!day) return '';
  const k = String(day).toLowerCase().trim();
  return DAY_FULL[k] || k;
}

export function formatTime12h(time24) {
  const parts = String(time24 || '10:00').split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (Number.isNaN(h)) return '10:00 am';
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 || 12;
  const mins = String(m).padStart(2, '0');
  if (m === 0) return `${hr} ${ampm}`;
  return `${hr}:${mins} ${ampm}`;
}

export function parseOpenDaysFromLegacy(hoursText) {
  if (!hoursText) return null;
  const first = hoursText.split(',')[0].trim();
  const idx = first.search(/\s·\s/);
  if (idx > 0) return first.slice(0, idx).trim();
  return first;
}

export function getOpenDaysLabel(settings) {
  return (
    settings?.openDays ||
    parseOpenDaysFromLegacy(settings?.hoursText) ||
    'Mon - Sat'
  );
}

/** Main hours line: Mon - Sun · 10:30 am - 8:30 pm */
export function formatHoursLine(settings) {
  const openDays = getOpenDaysLabel(settings);
  const open = formatTime12h(settings?.openTime || '10:00');
  const close = formatTime12h(settings?.closeTime || '20:00');
  return `${openDays} · ${open} - ${close}`;
}

/** Closed-day suffixes from closedDays array: Thu · Closed */
export function formatClosedDayParts(settings) {
  return (settings?.closedDays || [])
    .filter(Boolean)
    .map((day) => {
      const full = normalizeDayName(day);
      const abbr = DAY_ABBR[full] || String(day).slice(0, 3);
      return `${abbr} · CLOSED`;
    });
}

/** Full stored hoursText built from structured fields */
export function buildHoursText(settings) {
  const main = formatHoursLine(settings);
  const closed = formatClosedDayParts(settings);
  return closed.length ? `${main}, ${closed.join(', ')}` : main;
}

export function getTodayShort() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'short' });
}

/** Contact / mobile menu — full hours with closed days */
export function formatHoursDisplay(settings) {
  const main = formatHoursLine(settings);
  const closed = formatClosedDayParts(settings);
  if (!closed.length) return main;
  return `${main} · ${closed.join(' · ')}`;
}

/** Footer badge segments from structured settings */
export function getFooterHoursParts(settings, isOpen) {
  const hoursLine = formatHoursLine(settings);
  const statusLabel = isOpen ? 'OPEN' : 'CLOSED';
  const closedParts = formatClosedDayParts(settings);
  const todayShort = getTodayShort();
  const rightSide = closedParts.length
    ? closedParts.join(', ')
    : `${todayShort} · ${isOpen ? 'OPEN' : 'CLOSED'}`;
  return {
    hoursLine,
    statusLabel,
    rightSide,
    closedParts,
    statusColor: isOpen ? 'var(--success)' : 'var(--danger)',
  };
}
