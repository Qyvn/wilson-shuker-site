import type { ArtistConfig } from '../types';

/**
 * CENTRAL ARTIST CONFIGURATION
 * Everything artist-specific lives here (plus src/data/songs.ts).
 * All values below are PLACEHOLDERS — replace with the artist's real, authorised content.
 */
export const artist: ArtistConfig = {
  name: 'Nova Placeholder',
  tagline: 'Placeholder artist — replace in src/config/artist.ts',
  logo: '/images/logo.svg',
  heroImage: '/images/hero.svg',
  profileImage: '/images/profile.svg',
  shortIntro:
    'Warm analogue textures, late-night melodies and songs built for headphones. (Placeholder intro text.)',
  biography: [
    'This is placeholder biography copy. Replace it with the artist’s own story: where they come from, how they make music and what they stand for.',
    'Keep it to two or three short paragraphs. Press quotes, milestones and collaborators work well here.',
  ],
  colors: {
    background: '#0f0d0c',
    surface: '#1b1714',
    text: '#f4ede4',
    muted: '#b3a698',
    accent: '#e8c48a',
    accent2: '#c2410c',
  },
  fonts: {
    display: '"Fraunces", Georgia, serif',
    body: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    // Optional: a stylesheet URL for web fonts. Leave empty to use system fonts only.
    googleFontsHref: '',
  },
  // Only links with a non-empty URL are rendered.
  socials: [
    { label: 'Instagram', url: '' },
    { label: 'TikTok', url: '' },
    { label: 'YouTube', url: 'https://www.youtube.com/@example' /* EXAMPLE ONLY — replace */ },
  ],
  gallery: [
    { src: '/images/gallery-1.svg', alt: 'Placeholder gallery image 1' },
    { src: '/images/gallery-2.svg', alt: 'Placeholder gallery image 2' },
    { src: '/images/gallery-3.svg', alt: 'Placeholder gallery image 3' },
  ],
  contact: {
    email: 'hello@example.com',
    management: 'Placeholder Management Ltd.',
    bookingEmail: 'booking@example.com',
  },
  seo: {
    title: 'Nova Placeholder — Official Website',
    description: 'Official website of Nova Placeholder. Listen to previews, explore the music and connect.',
    url: 'https://example.com',
    image: '/images/hero.svg',
  },
  previewSeconds: 30,
};

export const PREVIEW_CAP_SECONDS = Math.min(30, artist.previewSeconds);
