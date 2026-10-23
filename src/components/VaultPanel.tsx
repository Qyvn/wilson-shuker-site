import { useState, type FormEvent } from 'react';
import type { VaultConfig } from '../types';
import { vaultStatus } from '../lib/vault';
import { isUsableUrl } from '../lib/links';
import { useNow } from '../hooks/useNow';

const pad = (n: number) => String(n).padStart(2, '0');

export function VaultPanel({ vault, now: fixedNow }: { vault: VaultConfig; now?: number }) {
  const live = useNow(1000);
  const now = fixedNow ?? live;
  const st = vaultStatus(vault.releaseDate, now);
  const dateLabel = st.valid
    ? new Date(vault.releaseDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'TBA';

  return (
    <div className={`vault-panel cassette-deck ${st.unlocked ? 'is-unlocked' : 'is-locked'}`} data-testid="vault-panel">
      <div className="deck-top">
        <span className="deck-brand">THE VAULT · {st.unlocked ? 'UNLOCKED' : 'LOCKED'}</span>
        <span className={`led ${st.unlocked ? 'on' : ''}`} aria-hidden="true" />
      </div>
      <div className="vault-body">
        <img src={vault.teaserArt} alt="" width={110} height={110} className="vault-art" />
        <div>
          <h3 className="cassette-title">{vault.title}</h3>
          {vault.example && <p className="example-tag">EXAMPLE placeholder: not a real release yet</p>}
          <p className={st.unlocked ? '' : 'muted'} data-testid="vault-state">
            {st.unlocked ? `Unlocked: out since ${dateLabel}.` : `Locked until ${dateLabel}`}
          </p>
        </div>
      </div>
      {!st.unlocked && st.valid && (
        <div className="countdown" role="timer" aria-label={`${st.days} days ${st.hours} hours ${st.minutes} minutes until release`}>
          {([['days', st.days], ['hrs', st.hours], ['min', st.minutes], ['sec', st.seconds]] as const).map(([l, v]) => (
            <span key={l} className="cd-cell"><strong>{l === 'days' ? v : pad(v)}</strong><small>{l}</small></span>
          ))}
        </div>
      )}
      {st.unlocked && isUsableUrl(vault.unlockUrl) && (
        <a className="btn btn-primary" href={vault.unlockUrl} target="_blank" rel="noopener noreferrer">
          Listen now<span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
      {st.unlocked && !isUsableUrl(vault.unlockUrl) && <p className="muted small">Streaming link coming soon.</p>}
      {!st.unlocked && isUsableUrl(vault.signupEndpoint) && <VaultSignup endpoint={vault.signupEndpoint} />}
    </div>
  );
}

function VaultSignup({ endpoint }: { endpoint: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch(endpoint, { method: 'POST', body: new FormData(e.currentTarget), headers: { Accept: 'application/json' } });
      setState(res.ok ? 'done' : 'error');
    } catch { setState('error'); }
  };
  if (state === 'done') return <p role="status">Thanks! You’ll hear first when it drops.</p>;
  return (
    <form className="vault-signup" onSubmit={onSubmit} data-testid="vault-signup">
      <label htmlFor="vault-email">Get notified on release day</label>
      <div className="row">
        <input id="vault-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        <button className="btn btn-primary" disabled={state === 'sending'}>Notify me</button>
      </div>
      {state === 'error' && <p role="alert" className="small">Couldn’t sign you up. Please try again.</p>}
    </form>
  );
}
