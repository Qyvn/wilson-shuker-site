import type { Song } from '../types';

export interface MixtapeState {
  name: string;
  color: string; // tape colour id
  songIds: string[];
}

export const MAX_NAME = 40;

/** Builds a shareable query string (no backend). */
export function encodeMixtape(m: MixtapeState): string {
  const p = new URLSearchParams();
  p.set('mixtape', '1');
  p.set('t', m.name.slice(0, MAX_NAME));
  p.set('c', m.color);
  p.set('s', m.songIds.join(','));
  return '?' + p.toString();
}

/** Parses and validates a mixtape from a query string. Unknown/duplicate ids are dropped; length is capped. */
export function decodeMixtape(
  search: string,
  catalogue: Song[],
  opts: { maxSongs: number; colorIds: string[] },
): MixtapeState | null {
  const p = new URLSearchParams(search);
  if (p.get('mixtape') !== '1') return null;
  const known = new Set(catalogue.map((s) => s.id));
  const seen = new Set<string>();
  const songIds: string[] = [];
  for (const raw of (p.get('s') ?? '').split(',')) {
    const id = raw.trim();
    if (known.has(id) && !seen.has(id)) { seen.add(id); songIds.push(id); }
  }
  const capped = songIds.slice(0, opts.maxSongs);
  if (capped.length === 0) return null;
  // eslint-disable-next-line no-control-regex
  const name = (p.get('t') ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, MAX_NAME) || 'Untitled mixtape';
  const c = p.get('c') ?? '';
  const color = opts.colorIds.includes(c) ? c : opts.colorIds[0];
  return { name, color, songIds: capped };
}

export function shareUrl(m: MixtapeState, location: { origin: string; pathname: string }): string {
  return location.origin + location.pathname + encodeMixtape(m);
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = list.slice();
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}
