import { normalizePhoneDigits } from './utils.js';

/** wa.me link for a 10-digit Indian mobile (with optional pre-filled message). */
export function getWhatsAppHref(phone, text = '') {
  const digits = normalizePhoneDigits(phone);
  if (digits.length !== 10) return null;
  const base = `https://wa.me/91${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function bookingWhatsAppText(booking, settings = {}, event = 'created') {
  const name = settings.name || 'DM Beauty Parlour';
  const ref = booking.reference || booking.id || '';
  const svc = booking.serviceName || booking.serviceId || 'Service';
  const date = booking.date || 'Date TBD';
  const slot = booking.slot || '';
  const lines = [`Hi ${name}!`];

  if (event === 'created') {
    lines.push(
      `I just booked an appointment.`,
      '',
      `Reference: ${ref}`,
      `Service: ${svc}`,
      `Date: ${date}`,
      slot ? `Time: ${slot}` : '',
      `Name: ${booking.name}`,
      `Phone: ${booking.phone || ''}`.trim()
    );
  } else if (event === 'confirmed') {
    lines.push(
      `Hi ${booking.name || 'there'}! Your appointment at ${name} is confirmed.`,
      `${svc} · ${date}${slot ? ` at ${slot}` : ''}`,
      `Reference: ${ref}`
    );
  } else if (event === 'rescheduled') {
    lines.push(
      `Hi ${booking.name || 'there'}! Your appointment at ${name} has been rescheduled.`,
      `${svc} · ${date}${slot ? ` at ${slot}` : ''}`,
      `Reference: ${ref}`
    );
  } else if (event === 'cancelled') {
    lines.push(
      `Hi ${booking.name || 'there'}, your appointment ${ref} (${svc} · ${date}) has been cancelled.`,
      `Contact us if you'd like to rebook.`
    );
  } else if (event === 'reminder') {
    lines.push(
      `Hi ${booking.name || 'there'}! Reminder from ${name}:`,
      `${svc} · ${date}${slot ? ` at ${slot}` : ''}`,
      `Reference: ${ref}`
    );
  } else if (event === 'reply') {
    lines.push(`Following up on my enquiry (${booking.name || 'Customer'}).`);
  }

  return lines.filter(Boolean).join('\n');
}

export function getBookingWhatsAppHref(booking, settings, event = 'created') {
  const studioPhone = settings?.phone || booking.phone;
  return getWhatsAppHref(studioPhone, bookingWhatsAppText(booking, settings, event));
}

export function getCustomerWhatsAppHref(booking, settings, event = 'confirmed') {
  return getWhatsAppHref(booking.phone, bookingWhatsAppText(booking, settings, event));
}
