import { useEffect, useState } from 'react';
import type { MixtapeConfig, Song } from '../types';
import type { MixtapeState } from '../lib/mixtape';
import { usePreviewPlayer } from '../hooks/usePreviewPlayer';
import { StreamingLinks } from './StreamingLinks';

/** Plays previews in order after the visitor presses Play (no autoplay). Songs without a real preview are skipped. */
export function SharedMixtape({ mix, songs, config, capSeconds, onClose }: {
  mix: MixtapeState; songs: Song[]; config: MixtapeConfig; capSeconds: number; onClose: () => void;
}) {
  const tracks = mix.songIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[];
  const [index, setIndex] = useState(0);
  const [sequencing, setSequencing] = useState(false);
  const current = tracks[index] ?? null;
  const player = usePreviewPlayer(current, capSeconds);
  const color = config.tapeColors.find((c) => c.id === mix.color)?.value ?? '#888';

  const nextPlayable = (from: number) => {
    for (let i = from; i < tracks.length; i++) if (tracks[i].previewUrl) return i;
    return -1;
  };

  // once the visitor has started the tape, play each newly loaded track
  useEffect(() => {
    if (!sequencing || !current) return;
    if (!current.previewUrl) {
      const n = nextPlayable(index + 1);
      if (n === -1) setSequencing(false); else setIndex(n);
      return;
    }
    void player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, sequencing]);

  // advance when a preview finishes (30s cap reached or file ended)
  useEffect(() => {
    if (!sequencing || player.status !== 'ended') return;
    const n = nextPlayable(index + 1);
    if (n === -1) setSequencing(false); else setIndex(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.status]);

  const startAll = () => {
    const first = player.status === 'paused' && current?.previewUrl ? index : nextPlayable(0);
    if (first === -1) return;
    if (first === index && sequencing) { void player.play(); return; }
    setIndex(first);
    setSequencing(true);
  };
  const playing = player.status === 'playing' || player.status === 'loading';
  const anyPlayable = nextPlayable(0) !== -1;
  const label: Record<string, string> = { playing: 'playing', loading: 'loading…', paused: 'paused', ended: 'finished', error: 'preview failed to load', unavailable: 'no preview', idle: '' };

  return (
    <section className="section shared-mix" aria-labelledby="shared-mix-title" data-testid="shared-mixtape">
      <p className="eyebrow">Someone made you a mixtape</p>
      <div className="shared-grid">
        <div className="blank-tape" style={{ ['--tape' as string]: color }}>
          <div className="blank-tape-label">
            <span className="blank-tape-name" id="shared-mix-title">{mix.name}</span>
            <span className="small">{tracks.length} tracks</span>
          </div>
          <div className="cassette-window">
            <span className={`reel${player.status === 'playing' ? ' spin' : ''}`} /><span className="tape" /><span className={`reel${player.status === 'playing' ? ' spin' : ''}`} />
          </div>
        </div>
        <div className="shared-controls">
          <div className="deck-buttons">
            <button type="button" className="deck-btn" onClick={() => (playing ? player.pause() : startAll())} disabled={!anyPlayable}>
              {playing ? '❚❚ Pause' : '▶ Play mixtape'}
            </button>
          </div>
          <p className="deck-status" role="status" aria-live="polite" data-testid="mix-status">
            {!anyPlayable ? 'No previews on this tape yet. Use the streaming links.' : current ? `${index + 1}. ${current.title}: ${label[player.status]}` : ''}
          </p>
          <div className="progress" role="progressbar" aria-label="Track preview progress" aria-valuemin={0}
            aria-valuemax={Math.round(player.duration)} aria-valuenow={Math.round(player.time)}>
            <span style={{ width: `${Math.min(100, (player.time / Math.max(1, player.duration)) * 100)}%` }} />
          </div>
          <ol className="mix-tracks">
            {tracks.map((t, i) => (
              <li key={t.id} className={i === index ? 'current' : ''} aria-current={i === index ? 'true' : undefined}>
                <span className="mix-n">{i + 1}</span>
                <span className="mix-title">{t.title}{!t.previewUrl && <span className="muted small"> · no preview</span>}</span>
                <StreamingLinks song={t} />
              </li>
            ))}
          </ol>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Make your own mixtape</button>
        </div>
      </div>
    </section>
  );
}
