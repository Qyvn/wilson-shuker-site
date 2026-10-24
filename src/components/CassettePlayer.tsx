import type { Song } from '../types';
import type { usePreviewPlayer } from '../hooks/usePreviewPlayer';
import { StreamingLinks } from './StreamingLinks';
import { forwardRef, useEffect, useState } from 'react';

type Player = ReturnType<typeof usePreviewPlayer>;

const fmt = (t: number) => `0:${String(Math.floor(t)).padStart(2, '0')}`;

const STATUS_LABEL: Record<Player['status'], string> = {
  idle: 'No tape loaded',
  loading: 'Loading…',
  playing: 'Playing',
  paused: 'Paused',
  ended: 'Preview ended',
  error: 'Preview could not be loaded',
  unavailable: 'Preview unavailable',
};

export const CassettePlayer = forwardRef<HTMLDivElement, { song: Song | null; player: Player }>(
  function CassettePlayer({ song, player }, slotRef) {
    const { status, time, duration, cap, play, pause, replay } = player;
    const isPlaying = status === 'playing' || status === 'loading';
    const canPlay = !!song?.previewUrl && status !== 'error';
    const [showEmbed, setShowEmbed] = useState(false);
    useEffect(() => setShowEmbed(false), [song?.id]);
    const pct = Math.min(100, (time / Math.max(1, duration)) * 100);

    return (
      <div className={`cassette-deck status-${status}`} data-status={status}>
        <div className="deck-top">
          <span className="deck-brand">STEREO CASSETTE · {cap}s PREVIEW</span>
          <span className={`led ${status === 'playing' ? 'on' : ''}`} aria-hidden="true" />
        </div>

        <div className="cassette">
          <div className="cassette-label">
            {song ? (
              <>
                <img src={song.artwork} alt="" width={56} height={56} className="cassette-art" />
                <div className="cassette-text">
                  <strong className="cassette-title">{song.title}</strong>
                  {song.subtitle && <span className="muted small">{song.subtitle}</span>}
                </div>
              </>
            ) : (
              <span className="muted">Select a CD to load a tape</span>
            )}
          </div>
          <div className="cassette-window" ref={slotRef}>
            <span className={`reel${status === 'playing' ? ' spin' : ''}`} />
            <span className="tape" />
            <span className={`reel${status === 'playing' ? ' spin' : ''}`} />
          </div>
        </div>

        <div className="deck-status" role="status" aria-live="polite">
          <span data-testid="status">{STATUS_LABEL[status]}</span>
          {song && canPlay && <span className="muted"> {fmt(time)} / {fmt(duration)}</span>}
        </div>

        <div
          className="progress"
          role="progressbar"
          aria-label="Preview progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
        >
          <span style={{ width: `${pct}%` }} />
        </div>

        <div className="deck-buttons">
          <button
            type="button"
            className="deck-btn"
            onClick={() => (isPlaying ? pause() : play())}
            disabled={!canPlay}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? '❚❚' : '▶'}
            <span className="deck-btn-label">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" className="deck-btn" onClick={replay} disabled={!canPlay} aria-label="Replay preview from start">
            ↺<span className="deck-btn-label">Replay</span>
          </button>
        </div>

        {status === 'unavailable' && (
          <p className="notice" role="note">
            No preview is available for this song yet.{song?.embed ? ' Watch the official video from his YouTube channel instead.' : ' Listen to the full track below where available.'}
          </p>
        )}
        {status === 'unavailable' && song?.embed && (
          <div className="embed-fallback" data-testid="embed-fallback">
            {showEmbed ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${song.embed.id}?rel=0`}
                title={`${song.embed.title} (official video, YouTube)`}
                loading="lazy"
                allow="encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setShowEmbed(true)}>
                Load official video (YouTube)
              </button>
            )}
          </div>
        )}
        {status === 'error' && (
          <p className="notice" role="alert">
            The preview failed to load. Check your connection, or listen to the full track below.
          </p>
        )}

        {song?.previewCredit && (
          <p className="preview-credit small muted" data-testid="preview-credit">
            <a href={song.previewCredit.url} target="_blank" rel="noopener noreferrer">{song.previewCredit.label}<span className="sr-only"> (opens in a new tab)</span></a>
          </p>
        )}
        {song && (
          <div className="deck-links">
            <h3 className="small-caps">Full track</h3>
            <StreamingLinks song={song} />
          </div>
        )}
      </div>
    );
  },
);
