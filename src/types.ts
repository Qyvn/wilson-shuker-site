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
  /** Internal: special wheel discs. Omit for normal songs. */
  kind?: 'song' | 'vault' | 'tour';
  locked?: boolean;
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
  /** Optional portrait-orientation crop used on narrow screens. */
  heroImageMobile?: string;
  /** CSS object-position for the hero photo, e.g. '40% 30%'. */
  heroFocus?: string;
  profileImage: string;
  shortIntro: string;
  biography: string[];
  colors: { background: string; surface: string; text: string; muted: string; accent: string; accent2: string };
  fonts: { display: string; body: string; googleFontsHref?: string };
  socials: SocialLink[];
  gallery: { src: string; alt: string; caption?: string }[];
  contact: { email: string; management?: string; bookingEmail?: string };
  seo: { title: string; description: string; url: string; image: string };
  /** Maximum preview length in seconds (hard cap, never above 30). */
  previewSeconds: number;
}

export interface MixtapeConfig {
  enabled: boolean;
  maxSongs: number;
  /** Tape shell colours fans can pick from. */
  tapeColors: { id: string; label: string; value: string }[];
}

export interface VaultConfig {
  enabled: boolean;
  /** true = placeholder entry; replace before launch. */
  example: boolean;
  title: string;
  teaserArt: string;
  /** ISO 8601 date-time with offset, e.g. 2026-11-22T00:00:00+02:00 */
  releaseDate: string;
  /** Where to send fans once unlocked (pre-save / stream link). Optional. */
  unlockUrl: string;
  /** Real form endpoint (e.g. Formspree POST URL). Empty = signup hidden. */
  signupEndpoint: string;
}

export interface TicketTier {
  id: string;
  name: string;
  /** Price in rand (ZAR), e.g. 150 */
  priceZar: number;
  note?: string;
  soldOut?: boolean;
}

export interface TourEvent {
  id: string;
  example?: boolean;
  name: string;
  venue: string;
  city: string;
  /** ISO 8601 date-time with offset */
  date: string;
  tiers: TicketTier[];
  capacityNote?: string;
  /** External ticketing fallback (Quicket / Howler / Computicket). */
  ticketUrl: string;
  maxPerOrder?: number;
}

export interface PaymentsConfig {
  /** Paystack PUBLIC key (pk_live_… / pk_test_…). Never put the secret key here. */
  paystackPublicKey: string;
  currency: 'ZAR';
}
