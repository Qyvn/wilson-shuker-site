import { useState } from 'react';
import type { PaymentsConfig, TourEvent } from '../types';
import { clampQty, formatZar, isPast, orderTotal, ticketMode } from '../lib/tickets';
import { payWithPaystack } from '../lib/paystack';

export function TourSection({ events, payments, now = Date.now() }: { events: TourEvent[]; payments: PaymentsConfig; now?: number }) {
  const upcoming = events.filter((e) => !isPast(e.date, now)).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (upcoming.length === 0) return <p className="muted">No upcoming shows right now. Check back soon.</p>;
  return (
    <ul className="tour-list">
      {upcoming.map((e) => <li key={e.id}><EventCard event={e} payments={payments} /></li>)}
    </ul>
  );
}

type Phase = { s: 'idle' } | { s: 'paying' } | { s: 'success'; reference: string } | { s: 'cancelled' } | { s: 'error'; msg: string };

export function EventCard({ event, payments }: { event: TourEvent; payments: PaymentsConfig }) {
  const mode = ticketMode(event, payments);
  const max = event.maxPerOrder ?? 10;
  const firstTier = event.tiers.find((t) => !t.soldOut) ?? event.tiers[0];
  const [tierId, setTierId] = useState(firstTier?.id ?? '');
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>({ s: 'idle' });
  const tier = event.tiers.find((t) => t.id === tierId) ?? firstTier;
  const total = orderTotal(tier?.priceZar ?? 0, qty, max);
  const d = new Date(event.date);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const buy = async () => {
    if (!tier || !emailOk) return;
    setPhase({ s: 'paying' });
    try {
      const r = await payWithPaystack({
        key: payments.paystackPublicKey, email, amountCents: total.cents, currency: payments.currency,
        metadata: { event_id: event.id, event: event.name, tier: tier.name, quantity: total.qty },
      });
      setPhase(r.status === 'success' ? { s: 'success', reference: r.reference } : { s: 'cancelled' });
    } catch (err) {
      setPhase({ s: 'error', msg: (err as Error).message });
    }
  };

  return (
    <article className="event-card cassette-deck" data-testid={`event-${event.id}`} data-mode={mode}>
      <div className="event-date" aria-hidden="true">
        <strong>{d.toLocaleDateString('en-ZA', { day: '2-digit' })}</strong>
        <span>{d.toLocaleDateString('en-ZA', { month: 'short' }).toUpperCase()}</span>
      </div>
      <div className="event-main">
        {event.example && <p className="example-tag">EXAMPLE event: not a real show</p>}
        <h3>{event.name}</h3>
        <p className="muted">{event.venue} · {event.city} ·{' '}
          <time dateTime={event.date}>{d.toLocaleString('en-ZA', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
        </p>
        {event.capacityNote && <p className="small muted">{event.capacityNote}</p>}

        <fieldset className="tiers">
          <legend className="small-caps">Ticket type</legend>
          {event.tiers.map((t) => (
            <label key={t.id} className={`tier${t.soldOut ? ' sold-out' : ''}`}>
              <input type="radio" name={`tier-${event.id}`} value={t.id} checked={tierId === t.id} disabled={t.soldOut} onChange={() => setTierId(t.id)} />
              <span>{t.name}{t.note && <span className="small muted"> · {t.note}</span>}</span>
              <span className="tier-price">{t.soldOut ? 'Sold out' : formatZar(t.priceZar)}</span>
            </label>
          ))}
        </fieldset>

        {mode === 'paystack' && phase.s !== 'success' && (
          <div className="buy-row">
            <div className="qty" role="group" aria-label="Quantity">
              <button type="button" className="icon-btn" onClick={() => setQty((q) => clampQty(q - 1, max))} aria-label="Decrease quantity">−</button>
              <input type="number" inputMode="numeric" min={1} max={max} value={qty} onChange={(e) => setQty(clampQty(Number(e.target.value), max))} aria-label="Quantity" />
              <button type="button" className="icon-btn" onClick={() => setQty((q) => clampQty(q + 1, max))} aria-label="Increase quantity">+</button>
            </div>
            <label className="field email">
              <span>Email for your ticket</span>
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <p className="total" data-testid="total">Total: <strong>{formatZar(total.zar)}</strong></p>
            <button type="button" className="btn btn-primary" onClick={buy} disabled={!emailOk || phase.s === 'paying'}>
              {phase.s === 'paying' ? 'Opening secure checkout…' : `Pay ${formatZar(total.zar)} with Paystack`}
            </button>
            {phase.s === 'cancelled' && <p className="small" role="status">Payment cancelled. You haven’t been charged.</p>}
            {phase.s === 'error' && <p className="small notice" role="alert">Payment couldn’t start: {phase.msg}</p>}
          </div>
        )}
        {mode === 'paystack' && phase.s === 'success' && (
          <div className="notice success" role="status" data-testid="payment-success">
            <strong>Payment received by Paystack.</strong> Reference: <code>{phase.reference}</code>.
            <br />Your ticket will be emailed to {email} once the payment is verified. Keep this reference.
          </div>
        )}
        {mode === 'external' && (
          <a className="btn btn-primary" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
            Get tickets<span className="sr-only"> (opens ticketing site in a new tab)</span>
          </a>
        )}
        {mode === 'soon' && (
          <button type="button" className="btn btn-disabled" disabled data-testid="tickets-soon">Tickets coming soon</button>
        )}
      </div>
    </article>
  );
}
