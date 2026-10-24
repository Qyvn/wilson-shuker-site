import { asset } from '../lib/asset';
import type { Song } from '../types';

/**
 * SONG DATA — Wilson Shuker
 * Verified 24 Oct 2026.
 * - Feel-A and Nsimbi Yamahumusha: official 30s previews + artwork from Apple's iTunes Lookup API
 *   (https://itunes.apple.com/lookup?id=1896717690&entity=song, country us + za). Streamed directly from Apple's CDN, not rehosted.
 * - Other songs are not on Apple Music. They fall back to the official YouTube video on @WilsonShuker
 *   (each ID verified via YouTube oEmbed: author = Wilson Shuker). No audio preview, so the cassette shows "Preview unavailable" + the embed.
 */
const APPLE = 'Preview & artwork courtesy of Apple Music';
export const songs: Song[] = [
  {
    id: 'feel-a',
    title: 'Feel-A',
    subtitle: 'Single · 2026',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f1/27/14/f127148a-a2e2-935d-3d05-031ac0e608d2/5063961742513_cover.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/92/4a/5a/924a5ac8-2ad8-33b0-7ec8-ff5a73c9617d/mzaf_3199407425033831982.plus.aac.p.m4a',
    spotifyUrl: '',
    appleMusicUrl: 'https://music.apple.com/us/album/feel-a/6775227235?i=6775227238',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=B_MC6xUQREU',
    previewCredit: { label: APPLE, url: 'https://music.apple.com/us/album/feel-a/6775227235?i=6775227238' },
  },
  {
    id: 'nsimbi-yamahumusha',
    title: 'Nsimbi Yamahumusha',
    subtitle: 'Single · 2026',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3f/98/a4/3f98a4cf-e0a3-42ae-df91-c92c1faed31c/5063961331892_cover.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3f/9a/49/3f9a4967-25d3-ea8a-d5e9-4851cd0be1d7/mzaf_16816111465504862465.plus.aac.p.m4a',
    spotifyUrl: '',
    appleMusicUrl: 'https://music.apple.com/us/album/nsimbi-yamahumusha/6770127252?i=6770127253',
    youtubeMusicUrl: '',
    youtubeUrl: '',
    previewCredit: { label: APPLE, url: 'https://music.apple.com/us/album/nsimbi-yamahumusha/6770127252?i=6770127253' },
  },
  {
    id: 'hold-tight',
    title: 'Hold Tight',
    subtitle: 'YouTube video',
    artwork: asset('/images/covers/hold-tight.jpg'),
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=Y2zcUAX5l2I',
    embed: { kind: 'youtube', id: 'Y2zcUAX5l2I', title: 'Hold Tight' },
  },
  {
    id: 'the-most-high',
    title: 'The Most High (Freestyle)',
    subtitle: 'Cut the Check · YouTube',
    artwork: asset('/images/covers/the-most-high.jpg'),
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=16KECARAFns',
    embed: { kind: 'youtube', id: '16KECARAFns', title: 'The Most High - Freestyle (Cut the Check)' },
  },
  {
    id: 'emotional-song',
    title: 'Emotional Song',
    subtitle: 'YouTube video',
    artwork: asset('/images/covers/emotional-song.jpg'),
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=Hzwsoiw7BrY',
    embed: { kind: 'youtube', id: 'Hzwsoiw7BrY', title: 'Emotional Song' },
  },
  {
    id: 'soulless',
    title: 'Soulless',
    subtitle: 'Emotional freestyle · YouTube',
    artwork: asset('/images/covers/soulless.jpg'),
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=puYD1D-q9sg',
    embed: { kind: 'youtube', id: 'puYD1D-q9sg', title: 'Soulless - Emotional Freestyle' },
  },
];
