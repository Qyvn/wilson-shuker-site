import type { PaymentsConfig, TourEvent } from '../types';
import { isUsableUrl } from './links';

export type TicketMode = 'paystack' | 'external' | 'soon';

/** Paystack (on-site) wins when a valid public key exists; otherwise an external ticket URL; otherwise "coming soon". */
export function ticketMode(event: TourEvent, payments: PaymentsConfig): TicketMode {
  const key = payments.paystackPublicKey.trim();
  if (/^pk_(live|test)_[A-Za-z0-9]+$/.test(key) && event.tiers.some((t) => !t.soldOut && t.priceZar > 0)) return 'paystack';
  if (isUsableUrl(event.ticketUrl)) return 'external';
  return 'soon';
}

export function clampQty(q: number, max = 10): number {
  if (!Number.isFinite(q)) return 1;
  return Math.min(max, Math.max(1, Math.floor(q)));
}

/** Total in rand and in cents (the smallest unit Paystack expects). */
export function orderTotal(priceZar: number, qty: number, max = 10) {
  const q = clampQty(qty, max);
  const cents = Math.round(priceZar * 100) * q;
  return { qty: q, cents, zar: cents / 100 };
}

export const formatZar = (zar: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(zar);

export const isPast = (iso: string, now = Date.now()) => Date.parse(iso) < now;
