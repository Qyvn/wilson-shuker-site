import { asset } from '../lib/asset';
import type { ArtistConfig } from '../types';

/**
 * CENTRAL ARTIST CONFIGURATION — Wilson Shuker
 * Links below were checked on 23 Oct 2026 and resolve to profiles named "Wilson Shuker".
 * The biography is a DRAFT written only from public profile text. Wilson should review/replace it.
 */
export const artist: ArtistConfig = {
  name: 'Wilson Shuker',
  tagline: 'Hip-hop · rap · storytelling',
  logo: asset('/images/logo.svg'),
  heroImage: asset('/images/wilson/hero-desktop.webp'),
  heroImageMobile: asset('/images/wilson/hero-mobile.webp'),
  heroFocus: '40% 40%',
  profileImage: asset('/images/wilson/profile.webp'),
  shortIntro: 'Expressive and creative: telling a story through music and visuals.',
  biography: [
    // DRAFT — based only on Wilson’s public YouTube “About” text and his Apple Music listing (Hip-Hop/Rap). Please replace with his own words.
    'Wilson Shuker is an independent hip-hop and rap artist who describes himself as an “International Nkinga” and an expressive, creative storyteller, through music and through visuals.',
    'His 2026 singles “Nsimbi Yamahumusha” and “Feel-A” are out on Apple Music. His YouTube channel carries freestyles and performance videos such as “Hold Tight”, “The Most High” and “Soulless”.',
  ],
  // Palette taken by eye from the supplied photos: warm wall/sunlight ambers and the blue of his shirt.
  colors: {
    background: '#12100e',
    surface: '#1f1a16',
    text: '#f3ebe1',
    muted: '#b9a897',
    accent: '#e3a25c',
    accent2: '#2f6fd6',
  },
  fonts: {
    display: '"Fraunces", Georgia, serif',
    body: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    googleFontsHref: '',
  },
  // Only links with a non-empty URL are rendered. TikTok could not be verified, so it is left empty.
  socials: [
    { label: 'Apple Music', url: 'https://music.apple.com/us/artist/wilson-shuker/1896717690' },
    { label: 'YouTube', url: 'https://www.youtube.com/@wilsonshuker' },
    { label: 'SoundCloud', url: 'https://soundcloud.com/wilsonshuker' },
    { label: 'Instagram', url: 'https://www.instagram.com/wilsonshuker/' },
    { label: 'X', url: 'https://x.com/wilsonshuker' },
    { label: 'Spotify', url: '' }, // not verified yet: add his Spotify artist URL
    { label: 'TikTok', url: '' }, // not verified yet
  ],
  gallery: [
    { src: asset('/images/wilson/gallery-portrait.webp'), alt: 'Wilson Shuker in clear-rim glasses and a silver chain, warm sunlight across his face' },
    { src: asset('/images/wilson/gallery-wilson-crop.webp'), alt: 'Wilson Shuker in a blue and white shirt and green cap, seated outdoors' },
    { src: asset('/images/wilson/gallery-group.webp'), alt: 'Wilson Shuker with friends at an outdoor gathering' },
  ],
  contact: {
    // Email shown publicly on his YouTube channel. Confirm before launch.
    email: 'wilsonshuker@gmail.com',
  },
  seo: {
    title: 'Wilson Shuker — Official Website',
    description:
      'Official website of Wilson Shuker, hip-hop and rap artist. Spin the CD wheel, hear previews and stream “Feel-A” and “Nsimbi Yamahumusha”.',
    url: 'https://example.com', // TODO: replace with the live domain
    image: asset('/images/wilson/hero-desktop.jpg'),
  },
  previewSeconds: 30,
};

export const PREVIEW_CAP_SECONDS = Math.min(30, artist.previewSeconds);
