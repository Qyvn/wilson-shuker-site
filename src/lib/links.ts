import type { Song } from '../types';

export const isUsableUrl = (url: string | undefined | null): url is string => {
  if (!url || !url.trim()) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:';
  } catch {
    return false;
  }
};

const PLATFORMS = [
  { key: 'spotifyUrl', label: 'Spotify' },
  { key: 'appleMusicUrl', label: 'Apple Music' },
  { key: 'youtubeMusicUrl', label: 'YouTube Music' },
  { key: 'youtubeUrl', label: 'YouTube' },
] as const;

export function streamingLinks(song: Song) {
  return PLATFORMS.filter((p) => isUsableUrl(song[p.key])).map((p) => ({ label: p.label, url: song[p.key] }));
}
