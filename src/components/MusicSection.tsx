import { useCallback, useRef, useState } from 'react';
import type { Song, VaultConfig, TourEvent } from '../types';
import { VaultPanel } from './VaultPanel';
import { vaultStatus } from '../lib/vault';
import { useNow } from '../hooks/useNow';
import { CDWheel } from './CDWheel';
import { CassettePlayer } from './CassettePlayer';
import { usePreviewPlayer } from '../hooks/usePreviewPlayer';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Flight { key: number; art: string; from: DOMRect; to: DOMRect }

const blank = { previewUrl: '', spotifyUrl: '', appleMusicUrl: '', youtubeMusicUrl: '', youtubeUrl: '' };

export function MusicSection({ songs, capSeconds, vault, tourEvents }: {
  songs: Song[]; capSeconds: number; vault?: VaultConfig; tourEvents?: TourEvent[];
}) {
  const [selected, setSelected] = useState<Song | null>(null);
  const [special, setSpecial] = useState<'vault' | 'tour' | null>(null);
  const now = useNow(vault?.enabled ? 1000 : 60000);
  const locked = vault ? !vaultStatus(vault.releaseDate, now).unlocked : false;
  const items: Song[] = [...songs];
  if (vault?.enabled) items.push({ id: '__vault', title: vault.title, artwork: vault.teaserArt, kind: 'vault', locked, ...blank });
  const nextShow = tourEvents?.filter((e) => Date.parse(e.date) > now).sort((a, b) => Date.parse(a.date) - Date.parse(b.date))[0];
  if (tourEvents && tourEvents.length > 0) items.push({ id: '__tour', title: 'Tour dates', artwork: '', kind: 'tour', ...blank });
  const player = usePreviewPlayer(selected, capSeconds);
  const reduced = useReducedMotion();
  const slotRef = useRef<HTMLDivElement>(null);
  const [flight, setFlight] = useState<Flight | null>(null);

  const onSelect = useCallback(
    (song: Song, discEl: HTMLElement | null) => {
      if (song.kind === 'vault' || song.kind === 'tour') { setSpecial(song.kind); setSelected(null); return; }
      setSpecial(null);
      if (selected?.id === song.id) return;
      setSelected(song);
      const slot = slotRef.current;
      if (!reduced && discEl && slot && typeof discEl.getBoundingClientRect === 'function') {
        const from = discEl.getBoundingClientRect();
        const to = slot.getBoundingClientRect();
        if (from.width > 0) setFlight({ key: Date.now(), art: song.artwork, from, to });
      }
    },
    [selected, reduced],
  );

  return (
    <div className="music-grid">
      <CDWheel songs={items} selectedId={special ? `__${special}` : selected?.id ?? null} onSelect={onSelect} reducedMotion={reduced} />
      {special === 'vault' && vault ? (
        <VaultPanel vault={vault} />
      ) : special === 'tour' ? (
        <div className="cassette-deck tour-teaser" data-testid="tour-teaser">
          <div className="deck-top"><span className="deck-brand">ON TOUR</span></div>
          {nextShow ? (
            <p><strong>Next show:</strong> {nextShow.name}, {nextShow.city},{' '}
              {new Date(nextShow.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          ) : <p className="muted">No upcoming dates announced yet.</p>}
          <a className="btn btn-primary" href="#tour">See dates &amp; tickets</a>
        </div>
      ) : (
        <CassettePlayer ref={slotRef} song={selected} player={player} />
      )}
      {flight && <FlyingDisc key={flight.key} flight={flight} onDone={() => setFlight(null)} />}
    </div>
  );
}

function FlyingDisc({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const { from, to, art } = flight;
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = Math.max(0.2, to.height / from.height);
  return (
    <span
      className="disc flying"
      aria-hidden="true"
      style={{
        left: from.left, top: from.top, width: from.width, height: from.height,
        ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, ['--s' as string]: scale,
      }}
      onAnimationEnd={onDone}
    >
      <span className="disc-art" style={{ backgroundImage: `url(${art})` }} />
      <span className="disc-sheen" />
      <span className="disc-hub" />
    </span>
  );
}
