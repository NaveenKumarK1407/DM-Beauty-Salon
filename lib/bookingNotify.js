import 'server-only';
import { notifyStudio, notifyCustomer } from './notify.js';
import { getStudioSettings } from './store.js';
import { toLocalDateKey, todayLocalKey } from './utils.js';
import { getCustomerWhatsAppHref } from './whatsapp.js';

function formatWhen(booking) {
  const d = booking.date || 'date TBD';
  const s = booking.slot ? ` at ${booking.slot}` : '';
  return `${d}${s}`;
}

function customerLink(booking, settings, event) {
  return getCustomerWhatsAppHref(booking, settings, event);
}

export async function notifyBookingCreated(booking) {
  const settings = await getStudioSettings();
  const when = formatWhen(booking);
  const ref = booking.reference || booking.id;

  const admin = await notifyStudio({
    title: `New booking · ${booking.serviceName || booking.serviceId}`,
    body: `${booking.name} — ${when} · ${ref}`,
    data: { type: 'booking', event: 'created', reference: ref, bookingId: booking.id },
  });

  const customer = await notifyCustomer({
    phone: booking.phone,
    title: 'Booking received · DM Beauty',
    body: `${booking.serviceName || 'Appointment'} · ${when} · Ref ${ref}`,
    data: { type: 'booking', event: 'created', reference: ref, bookingId: booking.id },
    link: '/booking',
  });

  return { admin, customer, whatsapp: customerLink(booking, settings, 'created') };
}

export async function notifyBookingUpdated(booking, { event, previous = {} } = {}) {
  const settings = await getStudioSettings();
  const when = formatWhen(booking);
  const ref = booking.reference || booking.id;
  const name = booking.name || 'Customer';

  const titles = {
    confirmed: `Confirmed · ${ref}`,
    rescheduled: `Rescheduled · ${ref}`,
    cancelled: `Cancelled · ${ref}`,
    done: `Completed · ${ref}`,
    pending: `Updated · ${ref}`,
  };
  const customerTitles = {
    confirmed: 'Appointment confirmed',
    rescheduled: 'Appointment rescheduled',
    cancelled: 'Appointment cancelled',
    done: 'Thank you for visiting',
    pending: 'Booking updated',
  };

  const title = titles[event] || titles.pending;
  const customerTitle = customerTitles[event] || customerTitles.pending;

  let adminBody = `${name} — ${when}`;
  if (event === 'rescheduled' && previous.date) {
    adminBody = `${name}: ${previous.date}${previous.slot ? ` ${previous.slot}` : ''} → ${when}`;
  } else if (event === 'cancelled') {
    adminBody = `${name} · ${booking.serviceName || ''} · was ${formatWhen(previous)}`;
  }

  const admin = await notifyStudio({
    title,
    body: adminBody,
    data: { type: 'booking', event, reference: ref, bookingId: booking.id },
  });

  const customerBodies = {
    confirmed: `${booking.serviceName || 'Your appointment'} · ${when}`,
    rescheduled: `New time: ${when}`,
    cancelled: `${booking.serviceName || 'Appointment'} on ${when} was cancelled.`,
    done: `We hope you loved your visit! Ref ${ref}`,
    pending: `${booking.serviceName || 'Appointment'} · ${when}`,
  };

  const waEvent = event === 'rescheduled' ? 'rescheduled' : event === 'cancelled' ? 'cancelled' : 'confirmed';

  const customer = await notifyCustomer({
    phone: booking.phone,
    title: `${customerTitle} · DM Beauty`,
    body: customerBodies[event] || customerBodies.pending,
    data: { type: 'booking', event, reference: ref, bookingId: booking.id },
    link: '/booking',
  });

  return { admin, customer, whatsapp: customerLink(booking, settings, waEvent) };
}

export async function notifyNewMessage(message) {
  const admin = await notifyStudio({
    title: `New enquiry · ${message.service || 'General'}`,
    body: `${message.name}: ${String(message.message || '').slice(0, 80)}`,
    data: { type: 'message', event: 'created', messageId: message.id },
  });

  return { admin };
}

export async function notifyMessageReply(message, replyText) {
  if (!message.phone) return { skipped: true };

  const customer = await notifyCustomer({
    phone: message.phone,
    title: 'Reply from DM Beauty',
    body: String(replyText).slice(0, 120),
    data: { type: 'message', event: 'reply', messageId: message.id },
    link: '/contact',
  });

  return { customer };
}

/** 8 PM reminders — tomorrow's appointments + today's still-upcoming. */
export async function sendEveningReminders() {
  const settings = await getStudioSettings();
  const { listBookings, updateBooking } = await import('./store.js');
  const bookings = await listBookings(500);
  const today = todayLocalKey();
  const tomorrow = addDaysLocal(today, 1);
  const now = new Date();
  const reminderKey = `${today}-20h`;

  const active = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );

  const results = { tomorrow: 0, today: 0, admin: null };

  for (const b of active) {
    const dateKey = toLocalDateKey(b.date);
    if (!dateKey) continue;
    if (b.reminderKey === reminderKey) continue;

    const isTomorrow = dateKey === tomorrow;
    const isToday = dateKey === today;
    if (!isTomorrow && !isToday) continue;

    if (isToday && b.slot) {
      const slotHour = parseSlotHour(b.slot);
      if (slotHour !== null && slotHour <= now.getHours()) continue;
    }

    const label = isTomorrow ? 'tomorrow' : 'today';
    const when = formatWhen(b);
    const ref = b.reference || b.id;

    await notifyCustomer({
      phone: b.phone,
      title: `Reminder · appointment ${label}`,
      body: `${b.serviceName || 'Appointment'} · ${when} · ${ref}`,
      data: { type: 'booking', event: 'reminder', reference: ref, bookingId: b.id },
      link: '/booking',
    });

    await updateBooking(b.id, { reminderKey, lastReminderAt: new Date().toISOString() });

    if (isTomorrow) results.tomorrow += 1;
    else results.today += 1;
  }

  const total = results.tomorrow + results.today;
  if (total > 0) {
    results.admin = await notifyStudio({
      title: 'Evening appointment reminders sent',
      body: `${results.tomorrow} tomorrow · ${results.today} today (${total} total)`,
      data: { type: 'reminder', event: 'evening', count: String(total) },
    });
  }

  return results;
}

function addDaysLocal(yyyyMmDd, days) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toLocalDateKey(dt);
}

function parseSlotHour(slot) {
  const m = String(slot).match(/(\d{1,2})/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (/pm/i.test(slot) && h < 12) h += 12;
  if (/am/i.test(slot) && h === 12) h = 0;
  return h;
}
