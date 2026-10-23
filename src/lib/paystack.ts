/** Lazily loads Paystack Inline v2 only when a fan starts a purchase. */
export interface PaystackTransaction { reference: string; status?: string; message?: string }
interface PaystackPopInstance {
  newTransaction(opts: {
    key: string; email: string; amount: number; currency: string;
    metadata?: Record<string, unknown>;
    onSuccess: (t: PaystackTransaction) => void; onCancel: () => void; onError?: (e: { message: string }) => void;
  }): void;
}
declare global { interface Window { PaystackPop?: new () => PaystackPopInstance } }

export const PAYSTACK_SRC = 'https://js.paystack.co/v2/inline.js';
let loading: Promise<void> | null = null;

export function loadPaystack(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PAYSTACK_SRC; s.async = true;
    s.onload = () => (window.PaystackPop ? resolve() : reject(new Error('Paystack failed to initialise')));
    s.onerror = () => { loading = null; reject(new Error('Could not load Paystack')); };
    document.head.appendChild(s);
  });
  return loading;
}

/** Resolves only from Paystack's own callbacks: success is never assumed. */
export async function payWithPaystack(opts: {
  key: string; email: string; amountCents: number; currency: string; metadata: Record<string, unknown>;
}): Promise<{ status: 'success'; reference: string } | { status: 'cancelled' }> {
  await loadPaystack();
  return new Promise((resolve, reject) => {
    const pop = new window.PaystackPop!();
    pop.newTransaction({
      key: opts.key, email: opts.email, amount: opts.amountCents, currency: opts.currency, metadata: opts.metadata,
      onSuccess: (t) => resolve({ status: 'success', reference: t.reference }),
      onCancel: () => resolve({ status: 'cancelled' }),
      onError: (e) => reject(new Error(e?.message || 'Payment error')),
    });
  });
}
