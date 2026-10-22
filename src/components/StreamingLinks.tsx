import type { Song } from '../types';
import { streamingLinks } from '../lib/links';

export function StreamingLinks({ song }: { song: Song }) {
  const links = streamingLinks(song);
  if (links.length === 0) return <p className="muted small">Full-track links coming soon.</p>;
  return (
    <ul className="stream-links" aria-label={`Listen to ${song.title} in full`}>
      {links.map((l) => (
        <li key={l.label}>
          <a className="btn btn-ghost" href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
