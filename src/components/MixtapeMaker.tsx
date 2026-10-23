import { useMemo, useState, type DragEvent } from 'react';
import type { MixtapeConfig, Song } from '../types';
import { MAX_NAME, moveItem, shareUrl } from '../lib/mixtape';

export function MixtapeMaker({ songs, config }: { songs: Song[]; config: MixtapeConfig }) {
  const [ids, setIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(config.tapeColors[0]?.id ?? '');
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [dragOver, setDragOver] = useState(false);
  const byId = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const full = ids.length >= config.maxSongs;
  const tapeColor = config.tapeColors.find((c) => c.id === color)?.value ?? '#888';

  const add = (id: string) => setIds((l) => (l.includes(id) || l.length >= config.maxSongs ? l : [...l, id]));
  const remove = (id: string) => setIds((l) => l.filter((x) => x !== id));
  const url = ids.length ? shareUrl({ name: name.trim() || 'Untitled mixtape', color, songIds: ids }, window.location) : '';

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const id = e.dataTransfer.getData('text/plain'); if (byId.has(id)) add(id);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied('ok'); } catch { setCopied('fail'); }
  };
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const share = async () => {
    try { await navigator.share({ title: name || 'My mixtape', text: 'I made you a mixtape', url }); } catch { /* cancelled */ }
  };

  return (
    <div className="mixtape-maker" data-testid="mixtape-maker">
      <div className="mix-catalogue">
        <h3 className="small-caps">Catalogue</h3>
        <ul>
          {songs.map((s) => {
            const on = ids.includes(s.id);
            return (
              <li key={s.id} draggable={!on && !full} onDragStart={(e) => e.dataTransfer.setData('text/plain', s.id)} className={on ? 'on' : ''}>
                <img src={s.artwork} alt="" width={40} height={40} />
                <span className="mix-title">{s.title}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => (on ? remove(s.id) : add(s.id))}
                  disabled={!on && full} aria-label={on ? `Remove ${s.title} from mixtape` : `Add ${s.title} to mixtape`}>
                  {on ? 'Remove' : 'Add'}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mix-tape-area">
        <div className={`blank-tape${dragOver ? ' drag-over' : ''}`} style={{ ['--tape' as string]: tapeColor }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
          data-testid="blank-tape">
          <div className="blank-tape-label">
            <span className="blank-tape-name">{name.trim() || 'Untitled mixtape'}</span>
            <span className="small">{ids.length}/{config.maxSongs} tracks</span>
          </div>
          <div className="cassette-window"><span className="reel" /><span className="tape" /><span className="reel" /></div>
        </div>
        {ids.length === 0 ? (
          <p className="muted small">Tap “Add” or drag songs onto the tape.</p>
        ) : (
          <ol className="mix-tracks" aria-label="Mixtape tracklist">
            {ids.map((id, i) => {
              const t = byId.get(id)?.title;
              return (
                <li key={id}>
                  <span className="mix-n">{i + 1}</span>
                  <span className="mix-title">{t}</span>
                  <span className="mix-actions">
                    <button type="button" className="icon-btn" onClick={() => setIds((l) => moveItem(l, i, i - 1))} disabled={i === 0} aria-label={`Move ${t} up`}>↑</button>
                    <button type="button" className="icon-btn" onClick={() => setIds((l) => moveItem(l, i, i + 1))} disabled={i === ids.length - 1} aria-label={`Move ${t} down`}>↓</button>
                    <button type="button" className="icon-btn" onClick={() => remove(id)} aria-label={`Remove ${t}`}>✕</button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {full && <p className="small muted" role="status">Tape full ({config.maxSongs} songs max).</p>}

        <label className="field">
          <span>Name your tape</span>
          <input value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} placeholder="e.g. Late-night drive" />
        </label>
        <fieldset className="field swatches">
          <legend>Tape colour</legend>
          {config.tapeColors.map((c) => (
            <label key={c.id} className="swatch" title={c.label}>
              <input type="radio" name="tape-color" value={c.id} checked={color === c.id} onChange={() => setColor(c.id)} />
              <span style={{ background: c.value }} aria-hidden="true" />
              <span className="sr-only">{c.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="mix-share">
          <button type="button" className="btn btn-primary" onClick={copy} disabled={!url}>Copy link</button>
          {canShare && <button type="button" className="btn btn-ghost" onClick={share} disabled={!url}>Share…</button>}
          {url && <a className="small" href={url} data-testid="mixtape-link">Open shared view</a>}
        </div>
        <p className="small" role="status" aria-live="polite">
          {copied === 'ok' ? 'Link copied!' : copied === 'fail' ? 'Couldn’t copy. Use “Open shared view” and copy the address bar.' : ''}
        </p>
      </div>
    </div>
  );
}
