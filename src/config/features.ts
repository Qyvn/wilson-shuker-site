import { asset } from '../lib/asset';
import type { MixtapeConfig, PaymentsConfig, TourEvent, VaultConfig } from '../types';

/** FEATURE CONFIGURATION: mixtape maker, unreleased vault, tour and tickets. */

export const mixtape: MixtapeConfig = {
  enabled: true,
  maxSongs: 6,
  tapeColors: [
    { id: 'amber', label: 'Sunlight amber', value: '#e3a25c' },
    { id: 'blue', label: 'Shirt blue', value: '#2f6fd6' },
    { id: 'green', label: 'Cap green', value: '#2e8b57' },
    { id: 'clear', label: 'Clear smoke', value: '#b9b4ad' },
    { id: 'black', label: 'Midnight', value: '#2a2522' },
  ],
};

export const vault: VaultConfig = {
  enabled: true,
  // ⚠ EXAMPLE PLACEHOLDER: Wilson must replace the title, art, date and link (or set enabled: false).
  example: true,
  title: 'Untitled — coming soon',
  teaserArt: asset('/images/vault-teaser.svg'),
  releaseDate: '2026-11-22T00:00:00+02:00',
  unlockUrl: '',
  signupEndpoint: '', // e.g. 'https://formspree.io/f/xxxxxx'. Leave empty to hide the email signup.
};

export const payments: PaymentsConfig = {
  // Paystack PUBLIC key from the Paystack dashboard (Settings → API Keys). Empty = online payment disabled.
  paystackPublicKey: '',
  currency: 'ZAR',
};

export const tourEvents: TourEvent[] = [
  {
    id: 'example-show',
    // ⚠ EXAMPLE EVENT: not a real show. Replace with real dates or remove.
    example: true,
    name: 'EXAMPLE — Live Showcase',
    venue: 'Example Venue (placeholder)',
    city: 'Johannesburg',
    date: '2026-12-12T19:00:00+02:00',
    tiers: [
      { id: 'ga', name: 'General admission', priceZar: 150 },
      { id: 'vip', name: 'VIP', priceZar: 350, note: 'Early entry (example)' },
    ],
    capacityNote: 'Example capacity note: limited to 200 people.',
    ticketUrl: '', // e.g. a Quicket / Howler / Computicket event URL
    maxPerOrder: 6,
  },
];
