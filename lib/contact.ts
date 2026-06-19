import { config } from "./config";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** Normalize to international digits for tel:/wa.me (defaults to +91 for 10-digit numbers). */
export function contactPhoneDigits(phone = config.contact.phone) {
  const d = digitsOnly(phone);
  if (!d) return "";
  if (d.length === 10) return `91${d}`;
  if (d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}

export function contactTelHref(phone = config.contact.phone) {
  const d = contactPhoneDigits(phone);
  return d ? `tel:+${d}` : "#";
}

export function contactWhatsAppHref(whatsapp = config.contact.whatsapp) {
  const d = contactPhoneDigits(whatsapp);
  return d ? `https://wa.me/${d}` : "#";
}

export function contactMailtoHref(email = config.contact.email) {
  return email ? `mailto:${email}` : "#";
}

/** Human-readable phone for UI, e.g. +91 8144 496 407 */
export function formatContactPhoneDisplay(phone = config.contact.phone) {
  const d = contactPhoneDigits(phone);
  if (!d) return "";
  const local = d.startsWith("91") && d.length >= 12 ? d.slice(2) : d;
  if (local.length === 10) {
    return `+91 ${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return `+${d}`;
}

export const contactDisplay = {
  phone: formatContactPhoneDisplay(),
  whatsapp: formatContactPhoneDisplay(config.contact.whatsapp),
  email: config.contact.email,
} as const;
