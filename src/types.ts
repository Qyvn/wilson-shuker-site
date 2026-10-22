export interface Song {
  id: string;
  title: string;
  /** Optional release/album subtitle */
  subtitle?: string;
  artwork: string;
  /** Authorised preview audio. Empty string = no preview available. */
  previewUrl: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  youtubeMusicUrl: string;
  youtubeUrl: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface ArtistConfig {
  name: string;
  tagline: string;
  logo: string;
  heroImage: string;
  profileImage: string;
  shortIntro: string;
  biography: string[];
  colors: { background: string; surface: string; text: string; muted: string; accent: string; accent2: string };
  fonts: { display: string; body: string; googleFontsHref?: string };
  socials: SocialLink[];
  gallery: { src: string; alt: string }[];
  contact: { email: string; management?: string; bookingEmail?: string };
  seo: { title: string; description: string; url: string; image: string };
  /** Maximum preview length in seconds (hard cap, never above 30). */
  previewSeconds: number;
}
