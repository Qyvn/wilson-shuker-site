import type { Song } from '../types';

/**
 * SONG DATA — separate from components so it can later come from a CMS / database.
 * All entries are PLACEHOLDERS. Audio files are synthesised test tones, artwork is generated SVG.
 * Empty URL strings mean "not available": the matching button / preview is hidden or marked unavailable.
 */
export const songs: Song[] = [
  {
    id: 'song-001',
    title: 'Placeholder One',
    subtitle: 'Test tone · 45s file (tests 30s cap)',
    artwork: '/images/cover-1.svg',
    previewUrl: '/audio/placeholder-tone-1.mp3',
    spotifyUrl: 'https://open.spotify.com/track/EXAMPLE-replace-me', // EXAMPLE ONLY — not a real track
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: '',
  },
  {
    id: 'song-002',
    title: 'Placeholder Two',
    subtitle: 'Test tone · 12s file',
    artwork: '/images/cover-2.svg',
    previewUrl: '/audio/placeholder-tone-2.mp3',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: '',
  },
  {
    id: 'song-003',
    title: 'Placeholder Three',
    subtitle: 'Test tone · 40s file',
    artwork: '/images/cover-3.svg',
    previewUrl: '/audio/placeholder-tone-3.mp3',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: '',
  },
  {
    id: 'song-004',
    title: 'No Preview Yet',
    subtitle: 'No preview supplied (tests unavailable state)',
    artwork: '/images/cover-4.svg',
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=EXAMPLE', // EXAMPLE ONLY — replace
  },
  {
    id: 'song-005',
    title: 'Placeholder Five',
    subtitle: 'Test tone · 20s file',
    artwork: '/images/cover-5.svg',
    previewUrl: '/audio/placeholder-tone-4.mp3',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: '',
  },
  {
    id: 'song-006',
    title: 'Placeholder Six',
    subtitle: 'Reuses tone 1',
    artwork: '/images/cover-6.svg',
    previewUrl: '/audio/placeholder-tone-1.mp3',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: '',
  },
];
