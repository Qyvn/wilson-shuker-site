import { useCallback, useRef, useState } from 'react';
import type { Song } from '../types';
import { CDWheel } from './CDWheel';
import { CassettePlayer } from './CassettePlayer';
import { usePreviewPlayer } from '../hooks/usePreviewPlayer';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Flight { key: number; art: string; from: DOMRect; to: DOMRect }

export function MusicSection({ songs, capSeconds }: { songs: Song[]; capSeconds: number }) {
  const [selected, setSelected] = useState<Song | null>(null);
  const player = usePreviewPlayer(selected, capSeconds);
  const reduced = useReducedMotion();
  const slotRef = useRef<HTMLDivElement>(null);
  const [flight, setFlight] = useState<Flight | null>(null);

  const onSelect = useCallback(
    (song: Song, discEl: HTMLElement | null) => {
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
      <CDWheel songs={songs} selectedId={selected?.id ?? null} onSelect={onSelect} reducedMotion={reduced} />
      <CassettePlayer ref={slotRef} song={selected} player={player} />
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
