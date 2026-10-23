import type { Song } from '../types';

/**
 * SONG DATA — Wilson Shuker
 * Titles, artwork and streaming URLs are real and were verified on 23 Oct 2026.
 * Artwork: Apple Music covers for the two singles; YouTube video thumbnails for the rest.
 *
 * ⚠ PREVIEW AUDIO IS PLACEHOLDER: the files in /public/audio are synthesised test tones, NOT Wilson’s music.
 * Swap in authorised 30s preview clips that Wilson supplies, or set previewUrl to "" to show "Preview unavailable".
 * Spotify / YouTube Music track URLs could not be verified, so they are left empty and hidden.
 */
const PLACEHOLDER = 'Placeholder tone, not the real song';

export const songs: Song[] = [
  {
    id: 'feel-a',
    title: 'Feel-A',
    subtitle: `Single · 2026 · ${PLACEHOLDER}`,
    artwork: '/images/covers/feel-a.jpg',
    previewUrl: '/audio/placeholder-tone-1.mp3',
    spotifyUrl: '',
    appleMusicUrl: 'https://music.apple.com/us/album/feel-a/6775227235?i=6775227238',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=B_MC6xUQREU',
  },
  {
    id: 'nsimbi-yamahumusha',
    title: 'Nsimbi Yamahumusha',
    subtitle: `Single · 2026 · ${PLACEHOLDER}`,
    artwork: '/images/covers/nsimbi-yamahumusha.jpg',
    previewUrl: '/audio/placeholder-tone-3.mp3',
    spotifyUrl: '',
    appleMusicUrl: 'https://music.apple.com/us/album/nsimbi-yamahumusha/6770127252?i=6770127253',
    youtubeMusicUrl: '',
    youtubeUrl: '',
  },
  {
    id: 'hold-tight',
    title: 'Hold Tight',
    subtitle: `YouTube · ${PLACEHOLDER}`,
    artwork: '/images/covers/hold-tight.jpg',
    previewUrl: '/audio/placeholder-tone-2.mp3',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=Y2zcUAX5l2I',
  },
  {
    id: 'the-most-high',
    title: 'The Most High (Freestyle)',
    subtitle: `Cut the Check · ${PLACEHOLDER}`,
    artwork: '/images/covers/the-most-high.jpg',
    previewUrl: '/audio/placeholder-tone-4.mp3',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=16KECARAFns',
  },
  {
    id: 'emotional-song',
    title: 'Emotional Song',
    subtitle: 'YouTube · no preview supplied yet',
    artwork: '/images/covers/emotional-song.jpg',
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=Hzwsoiw7BrY',
  },
  {
    id: 'soulless',
    title: 'Soulless',
    subtitle: 'Emotional freestyle · no preview supplied yet',
    artwork: '/images/covers/soulless.jpg',
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=puYD1D-q9sg',
  },
];
